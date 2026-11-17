package com.smartpc.modules.pcbuilder.service;

import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.response.BuildTelemetryDTO;
import com.smartpc.modules.pcbuilder.dto.response.PCBuilderEvaluateResponse;
import com.smartpc.modules.pcbuilder.dto.response.SlotDiagnosticDTO;
import com.smartpc.modules.pcbuilder.dto.response.StockIssueDTO;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service đánh giá tương thích real-time và tính chỉ số telemetry cho cấu hình PC Builder (WBS 7.5.2).
 * Tuyệt đối không gắn @Transactional để tránh giữ kết nối DB trong khi Rule Engine thực thi trên RAM.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PCBuilderEvaluationService {

    private static final int MIN_RECOMMENDED_PSU_W = 450;
    private static final double PSU_HEADROOM_FACTOR = 1.35;
    private static final double PSU_STEP_W = 50.0;

    private final ProductRepository productRepository;
    private final CompatibilityService compatibilityService;
    private final AggregateCalculator aggregateCalculator;
    private final PCBuilderRequestValidator requestValidator;

    /**
     * Đánh giá toàn diện cấu hình PC từ danh sách đầu vào của client.
     */
    public PCBuilderEvaluateResponse evaluateBuild(List<BuildItemInput> items) {
        long startNs = System.nanoTime();

        Map<String, Integer> qtyMap = requestValidator.validateEvaluateItems(items, false);
        if (qtyMap.isEmpty()) {
            return buildEmptyResponse(startNs);
        }

        // Single-fetch DB ngắn hạn, giải phóng connection ngay trước khi tính toán Rule Engine
        List<Product> fetched = productRepository.findAllActiveWithCategoryByIds(qtyMap.keySet());
        List<Product> products = fetched != null ? fetched : Collections.emptyList();

        Set<String> foundIds = products.stream()
                .map(Product::getProductId)
                .collect(Collectors.toSet());
        List<String> unresolvedIds = qtyMap.keySet().stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        return evaluateFetchedProducts(products, qtyMap, unresolvedIds, startNs);
    }

    /**
     * Đánh giá cấu hình dựa trên danh sách Product đã được nạp sẵn từ DB (tái sử dụng cho 7.5.4 & 7.5.6).
     */
    public PCBuilderEvaluateResponse evaluateFetchedProducts(
            List<Product> products,
            Map<String, Integer> qtyMap,
            List<String> unresolved
    ) {
        return evaluateFetchedProducts(products, qtyMap, unresolved, System.nanoTime());
    }

    private PCBuilderEvaluateResponse evaluateFetchedProducts(
            List<Product> products,
            Map<String, Integer> qtyMap,
            List<String> unresolved,
            long startNs
    ) {
        List<Product> safeProducts = products != null ? products : Collections.emptyList();
        Map<String, Integer> safeQtyMap = qtyMap != null ? qtyMap : Collections.emptyMap();
        List<String> safeUnresolved = unresolved != null ? unresolved : Collections.emptyList();

        if (safeProducts.isEmpty() && safeUnresolved.isEmpty()) {
            return buildEmptyResponse(startNs);
        }

        Map<BuilderSlotCode, List<Product>> coreProductsBySlot = new EnumMap<>(BuilderSlotCode.class);
        List<ProductItemContext> contexts = new ArrayList<>(safeProducts.size());
        List<StockIssueDTO> stockIssues = new ArrayList<>();
        long totalPrice = 0L;
        int totalSelectedQuantity = 0;

        for (Product product : safeProducts) {
            if (product == null) {
                continue;
            }
            String categoryCode = resolveCategoryCode(product);
            int quantity = Math.max(1, safeQtyMap.getOrDefault(product.getProductId(), 1));
            totalSelectedQuantity += quantity;

            long unitPrice = product.getPrice() != null ? Math.max(0L, product.getPrice().longValue()) : 0L;
            totalPrice += unitPrice * quantity;

            int availableStock = product.getStockQuantity() != null ? Math.max(0, product.getStockQuantity()) : 0;
            if (availableStock < quantity) {
                String reason = availableStock == 0
                        ? "Sản phẩm đã hết hàng"
                        : "Tồn kho không đủ (còn " + availableStock + ", yêu cầu " + quantity + ")";
                stockIssues.add(StockIssueDTO.builder()
                        .productId(product.getProductId())
                        .name(product.getName())
                        .slotCode(categoryCode)
                        .requestedQuantity(quantity)
                        .availableStock(availableStock)
                        .reason(reason)
                        .build());
            }

            BuilderSlotCode.fromCode(categoryCode).ifPresent(slot ->
                    coreProductsBySlot.computeIfAbsent(slot, k -> new ArrayList<>()).add(product)
            );

            Map<String, Object> defensiveSpecs = product.getSpecs() != null
                    ? new LinkedHashMap<>(product.getSpecs())
                    : new LinkedHashMap<>();

            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(categoryCode)
                    .specs(defensiveSpecs)
                    .quantity(quantity)
                    .build());
        }

        CompatibilityResult rawCompatibility = compatibilityService.evaluateContexts(contexts, safeUnresolved);
        CompatibilityResult compatibility = normalizeCompatibilityResult(rawCompatibility, safeUnresolved);

        int selectedCoreSlots = coreProductsBySlot.size();
        int totalCoreSlots = BuilderSlotCode.values().length;

        double estimatedTdpW = 0.0;
        int recommendedPsuW = 0;
        Integer selectedPsuWattageW = null;
        Double psuLoadPercent = null;

        if (selectedCoreSlots > 0) {
            Map<String, Object> aggregates = aggregateCalculator.calculateAggregates(contexts);
            double rawTdp = extractDouble(
                    aggregates.get(AggregateCalculator.SYSTEM_CATEGORY + ":" + AggregateCalculator.TOTAL_TDP_KEY),
                    0.0
            );
            estimatedTdpW = roundToDecimals(rawTdp, 1);

            int gpuMinPsuW = resolveGpuRecommendedPsu(coreProductsBySlot.get(BuilderSlotCode.GPU));
            recommendedPsuW = computeRecommendedPsuWattage(estimatedTdpW, gpuMinPsuW);

            Integer psuRatedW = resolveSelectedPsuWattage(coreProductsBySlot.get(BuilderSlotCode.PSU));
            if (psuRatedW != null && psuRatedW > 0) {
                selectedPsuWattageW = psuRatedW;
                psuLoadPercent = roundToDecimals((estimatedTdpW / psuRatedW) * 100.0, 1);
            }
        }

        BalanceSummary balance = computeBalanceIndex(coreProductsBySlot, selectedCoreSlots);

        Map<String, SlotDiagnosticDTO> slotStatuses = buildSlotStatuses(coreProductsBySlot, compatibility);
        List<String> missingRecommendedSlots = resolveMissingRecommendedSlots(coreProductsBySlot);
        boolean hasAnyItems = totalSelectedQuantity > 0 || !safeUnresolved.isEmpty();
        BuilderGateStatus gateStatus = determineGateStatus(hasAnyItems, compatibility, stockIssues, safeUnresolved);

        double evalTimeMs = roundToDecimals((System.nanoTime() - startNs) / 1_000_000.0, 2);

        BuildTelemetryDTO telemetry = BuildTelemetryDTO.builder()
                .totalPrice(totalPrice)
                .estimatedTdpW(estimatedTdpW)
                .recommendedPsuW(recommendedPsuW)
                .selectedPsuWattageW(selectedPsuWattageW)
                .psuLoadPercent(psuLoadPercent)
                .balanceIndex(balance.index())
                .balanceLabel(balance.label())
                .selectedCoreSlots(selectedCoreSlots)
                .totalCoreSlots(totalCoreSlots)
                .evaluationTimeMs(evalTimeMs)
                .build();

        return PCBuilderEvaluateResponse.builder()
                .compatibility(compatibility)
                .telemetry(telemetry)
                .slotStatuses(slotStatuses)
                .gateStatus(gateStatus)
                .stockIssues(stockIssues)
                .missingRecommendedSlots(missingRecommendedSlots)
                .build();
    }

    /**
     * Xác định trạng thái cổng kiểm soát an toàn (Risk Gatekeeper) cho cấu hình hiện tại.
     * Thứ tự ưu tiên tuyệt đối (WBS 7.5.4 §3.1):
     * BLOCKED_EMPTY -> BLOCKED_OUT_OF_STOCK -> BLOCKED_COMPATIBILITY_ERROR -> WARNING_CONFIRM_REQUIRED -> READY_SAFE.
     */
    public BuilderGateStatus determineGateStatus(
            boolean hasAnyItems,
            CompatibilityResult compatibility,
            List<StockIssueDTO> stockIssues,
            List<String> unresolvedProductIds
    ) {
        if (!hasAnyItems) {
            return BuilderGateStatus.BLOCKED_EMPTY;
        }
        boolean hasStockIssues = stockIssues != null && !stockIssues.isEmpty();
        boolean hasUnresolved = (unresolvedProductIds != null && !unresolvedProductIds.isEmpty())
                || (compatibility != null
                && compatibility.getUnresolvedProductIds() != null
                && !compatibility.getUnresolvedProductIds().isEmpty());
        if (hasStockIssues || hasUnresolved) {
            return BuilderGateStatus.BLOCKED_OUT_OF_STOCK;
        }
        if (compatibility != null
                && compatibility.getErrors() != null
                && !compatibility.getErrors().isEmpty()) {
            return BuilderGateStatus.BLOCKED_COMPATIBILITY_ERROR;
        }
        if (compatibility != null
                && compatibility.getWarnings() != null
                && !compatibility.getWarnings().isEmpty()) {
            return BuilderGateStatus.WARNING_CONFIRM_REQUIRED;
        }
        return BuilderGateStatus.READY_SAFE;
    }

    /**
     * Overload nhận tổng số lượng linh kiện đã chọn theo đặc tả WBS 7.5.4 §3.1.
     */
    public BuilderGateStatus determineGateStatus(
            int totalSelectedQuantity,
            CompatibilityResult compatibility,
            List<StockIssueDTO> stockIssues,
            List<String> unresolvedProductIds
    ) {
        return determineGateStatus(totalSelectedQuantity > 0, compatibility, stockIssues, unresolvedProductIds);
    }

    private PCBuilderEvaluateResponse buildEmptyResponse(long startNs) {
        Map<String, SlotDiagnosticDTO> emptySlots = new LinkedHashMap<>();
        for (BuilderSlotCode slot : BuilderSlotCode.values()) {
            emptySlots.put(slot.name(), SlotDiagnosticDTO.builder()
                    .slotCode(slot.name())
                    .status(SlotStatusLevel.EMPTY)
                    .errorCount(0)
                    .warningCount(0)
                    .infoCount(0)
                    .violationRuleIds(new ArrayList<>())
                    .build());
        }

        List<String> missingRecommended = Arrays.stream(BuilderSlotCode.values())
                .filter(BuilderSlotCode::isRecommended)
                .map(Enum::name)
                .toList();

        double evalTimeMs = roundToDecimals((System.nanoTime() - startNs) / 1_000_000.0, 2);

        BuildTelemetryDTO telemetry = BuildTelemetryDTO.builder()
                .totalPrice(0L)
                .estimatedTdpW(0.0)
                .recommendedPsuW(0)
                .selectedPsuWattageW(null)
                .psuLoadPercent(null)
                .balanceIndex(null)
                .balanceLabel("CHƯA ĐỦ DỮ LIỆU")
                .selectedCoreSlots(0)
                .totalCoreSlots(BuilderSlotCode.values().length)
                .evaluationTimeMs(evalTimeMs)
                .build();

        CompatibilityResult compatibility = CompatibilityResult.builder()
                .isCompatible(true)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .info(new ArrayList<>())
                .unresolvedProductIds(new ArrayList<>())
                .build();

        return PCBuilderEvaluateResponse.builder()
                .compatibility(compatibility)
                .telemetry(telemetry)
                .slotStatuses(emptySlots)
                .gateStatus(BuilderGateStatus.BLOCKED_EMPTY)
                .stockIssues(new ArrayList<>())
                .missingRecommendedSlots(missingRecommended)
                .build();
    }

    private int computeRecommendedPsuWattage(double estimatedTdpW, int gpuRecommendedPsuW) {
        int headroomW = (int) (Math.ceil((estimatedTdpW * PSU_HEADROOM_FACTOR) / PSU_STEP_W) * PSU_STEP_W);
        return Math.max(MIN_RECOMMENDED_PSU_W, Math.max(headroomW, gpuRecommendedPsuW));
    }

    private BalanceSummary computeBalanceIndex(Map<BuilderSlotCode, List<Product>> coreProductsBySlot, int selectedCoreSlots) {
        Product cpu = firstProduct(coreProductsBySlot.get(BuilderSlotCode.CPU));
        Product gpu = firstProduct(coreProductsBySlot.get(BuilderSlotCode.GPU));

        double cpuScore = (cpu != null && cpu.getBenchmarkScore() != null) ? cpu.getBenchmarkScore() : 0.0;
        double gpuScore = (gpu != null && gpu.getBenchmarkScore() != null) ? gpu.getBenchmarkScore() : 0.0;

        if (cpuScore > 0.0 && gpuScore > 0.0) {
            double diff = Math.abs(cpuScore - gpuScore);
            double pairBalance = Math.max(0.0, 100.0 - 1.2 * diff);
            double rawScore = pairBalance * 0.8 + ((double) selectedCoreSlots / BuilderSlotCode.values().length) * 20.0;
            int index = (int) Math.min(100L, Math.max(0L, Math.round(rawScore)));
            return new BalanceSummary(index, classifyBalanceLabel(index));
        }

        if (cpuScore > 0.0) {
            double rawScore = cpuScore * 0.75 + selectedCoreSlots * 3.0;
            int index = (int) Math.min(100L, Math.max(0L, Math.round(rawScore)));
            return new BalanceSummary(index, classifyBalanceLabel(index));
        }

        return new BalanceSummary(null, "CHƯA ĐỦ DỮ LIỆU");
    }

    private String classifyBalanceLabel(int index) {
        if (index >= 80) {
            return "CÂN BẰNG TỐT";
        }
        if (index >= 60) {
            return "KHÁ TỐT";
        }
        return "CÓ ĐIỂM NGHẼN";
    }

    private Map<String, SlotDiagnosticDTO> buildSlotStatuses(
            Map<BuilderSlotCode, List<Product>> coreProductsBySlot,
            CompatibilityResult compatibility
    ) {
        Map<String, SlotDiagnosticDTO> slotStatuses = new LinkedHashMap<>();
        for (BuilderSlotCode slot : BuilderSlotCode.values()) {
            boolean hasItems = coreProductsBySlot.containsKey(slot) && !coreProductsBySlot.get(slot).isEmpty();
            slotStatuses.put(slot.name(), SlotDiagnosticDTO.builder()
                    .slotCode(slot.name())
                    .status(hasItems ? SlotStatusLevel.COMPATIBLE : SlotStatusLevel.EMPTY)
                    .errorCount(0)
                    .warningCount(0)
                    .infoCount(0)
                    .violationRuleIds(new ArrayList<>())
                    .build());
        }

        applyViolations(slotStatuses, compatibility.getErrors(), SlotStatusLevel.ERROR);
        applyViolations(slotStatuses, compatibility.getWarnings(), SlotStatusLevel.WARNING);
        applyViolations(slotStatuses, compatibility.getInfo(), SlotStatusLevel.INFO);

        return slotStatuses;
    }

    private void applyViolations(
            Map<String, SlotDiagnosticDTO> slotStatuses,
            List<ViolationDetail> violations,
            SlotStatusLevel level
    ) {
        if (violations == null || violations.isEmpty()) {
            return;
        }
        for (ViolationDetail detail : violations) {
            if (detail == null) {
                continue;
            }
            Set<String> affectedSlots = new LinkedHashSet<>(2);
            if (detail.getSourceProduct() != null && detail.getSourceProduct().getCategoryCode() != null) {
                affectedSlots.add(detail.getSourceProduct().getCategoryCode().trim().toUpperCase());
            }
            if (detail.getTargetProduct() != null && detail.getTargetProduct().getCategoryCode() != null) {
                affectedSlots.add(detail.getTargetProduct().getCategoryCode().trim().toUpperCase());
            }

            for (String slotCode : affectedSlots) {
                SlotDiagnosticDTO diagnostic = slotStatuses.get(slotCode);
                if (diagnostic == null) {
                    continue;
                }
                if (level == SlotStatusLevel.ERROR) {
                    diagnostic.setErrorCount(diagnostic.getErrorCount() + 1);
                } else if (level == SlotStatusLevel.WARNING) {
                    diagnostic.setWarningCount(diagnostic.getWarningCount() + 1);
                } else if (level == SlotStatusLevel.INFO) {
                    diagnostic.setInfoCount(diagnostic.getInfoCount() + 1);
                }
                diagnostic.setStatus(diagnostic.getStatus().max(level));

                String ruleId = detail.getRuleId();
                if (ruleId != null && !ruleId.isBlank() && !diagnostic.getViolationRuleIds().contains(ruleId)) {
                    diagnostic.getViolationRuleIds().add(ruleId);
                }
            }
        }
    }

    private List<String> resolveMissingRecommendedSlots(Map<BuilderSlotCode, List<Product>> coreProductsBySlot) {
        List<String> missing = new ArrayList<>();
        for (BuilderSlotCode slot : BuilderSlotCode.values()) {
            if (slot.isRecommended() && !coreProductsBySlot.containsKey(slot)) {
                missing.add(slot.name());
            }
        }
        return missing;
    }

    private CompatibilityResult normalizeCompatibilityResult(CompatibilityResult raw, List<String> unresolved) {
        if (raw == null) {
            return CompatibilityResult.builder()
                    .isCompatible(true)
                    .errors(new ArrayList<>())
                    .warnings(new ArrayList<>())
                    .info(new ArrayList<>())
                    .unresolvedProductIds(new ArrayList<>(unresolved))
                    .build();
        }
        List<ViolationDetail> errors = raw.getErrors() != null ? raw.getErrors() : Collections.emptyList();
        List<ViolationDetail> warnings = raw.getWarnings() != null ? raw.getWarnings() : Collections.emptyList();
        List<ViolationDetail> info = raw.getInfo() != null ? raw.getInfo() : Collections.emptyList();
        List<String> resUnresolved = raw.getUnresolvedProductIds() != null ? raw.getUnresolvedProductIds() : unresolved;
        return CompatibilityResult.builder()
                .isCompatible(raw.isCompatible() && errors.isEmpty())
                .errors(errors)
                .warnings(warnings)
                .info(info)
                .unresolvedProductIds(resUnresolved)
                .build();
    }

    private int resolveGpuRecommendedPsu(List<Product> gpus) {
        if (gpus == null || gpus.isEmpty()) {
            return 0;
        }
        int maxRec = 0;
        for (Product gpu : gpus) {
            if (gpu != null && gpu.getSpecs() != null) {
                int rec = extractInt(gpu.getSpecs().get("recommended_psu_w"), 0);
                if (rec > maxRec) {
                    maxRec = rec;
                }
            }
        }
        return maxRec;
    }

    private Integer resolveSelectedPsuWattage(List<Product> psus) {
        Product psu = firstProduct(psus);
        if (psu == null || psu.getSpecs() == null) {
            return null;
        }
        int rated = extractInt(psu.getSpecs().get("rated_wattage_w"), 0);
        return rated > 0 ? rated : null;
    }

    private Product firstProduct(List<Product> list) {
        return (list != null && !list.isEmpty()) ? list.get(0) : null;
    }

    private String resolveCategoryCode(Product product) {
        if (product.getCategory() != null && product.getCategory().getCategoryCode() != null) {
            return product.getCategory().getCategoryCode().trim().toUpperCase();
        }
        return "UNKNOWN";
    }

    private int extractInt(Object value, int defaultVal) {
        if (value == null) {
            return defaultVal;
        }
        if (value instanceof Number n) {
            double d = n.doubleValue();
            return Double.isFinite(d) ? n.intValue() : defaultVal;
        }
        try {
            return (int) Math.round(Double.parseDouble(value.toString().trim()));
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private double extractDouble(Object value, double defaultVal) {
        if (value == null) {
            return defaultVal;
        }
        if (value instanceof Number n) {
            double d = n.doubleValue();
            return Double.isFinite(d) ? d : defaultVal;
        }
        try {
            double d = Double.parseDouble(value.toString().trim());
            return Double.isFinite(d) ? d : defaultVal;
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private double roundToDecimals(double value, int decimals) {
        double scale = Math.pow(10.0, decimals);
        return Math.round(value * scale) / scale;
    }

    private record BalanceSummary(Integer index, String label) {
    }
}
