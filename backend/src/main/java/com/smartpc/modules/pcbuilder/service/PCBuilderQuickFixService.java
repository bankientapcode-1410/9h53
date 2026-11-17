package com.smartpc.modules.pcbuilder.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.pcbuilder.dto.request.QuickFixRequest;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixOptionDTO;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixResponse;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixStrategyGroupDTO;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.repository.ProductSpecifications;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ProductReference;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import jakarta.persistence.criteria.Expression;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service mô phỏng phản thực tế (Counterfactual Simulation) trên Rule Engine (UC6)
 * để gợi ý linh kiện thay thế xóa xung đột phần cứng không hardcode luật (WBS 7.5.5).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PCBuilderQuickFixService {

    public static final int MAX_QUICKFIX_POOL = 80;
    private static final int DEFAULT_LIMIT_PER_STRATEGY = 3;
    private static final int MAX_LIMIT_PER_STRATEGY = 5;

    private final ProductRepository productRepository;
    private final CompatibilityService compatibilityService;
    private final PCBuilderRequestValidator requestValidator;
    private final ProductMapper productMapper;

    /**
     * Phân tích vi phạm mục tiêu và chạy mô phỏng thử nghiệm tối đa 80 ứng viên/khe
     * để đề xuất các lựa chọn thay thế xóa sạch lỗi và không phát sinh lỗi mới.
     */
    @Transactional(readOnly = true)
    public QuickFixResponse suggestFixes(QuickFixRequest request) {
        long startNs = System.nanoTime();

        if (request == null || request.getViolationRuleId() == null || request.getViolationRuleId().isBlank()) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR,
                    "Mã quy tắc vi phạm (violation_rule_id) không được để trống"
            );
        }

        String preferredSlot = normalizeAndValidatePreferredSlot(request.getPreferredReplaceSlot());
        Map<String, Integer> qtyMap = requestValidator.validateEvaluateItems(request.getCurrentItems(), true);
        int limit = clampLimit(request.getLimitPerStrategy());
        String targetRuleId = request.getViolationRuleId().trim();

        List<Product> fetched = productRepository.findAllActiveWithCategoryByIds(qtyMap.keySet());
        List<Product> currentProducts = fetched != null ? fetched : Collections.emptyList();
        if (currentProducts.isEmpty()) {
            return QuickFixResponse.builder()
                    .violationRuleId(targetRuleId)
                    .strategies(Collections.emptyList())
                    .guidanceMessage("Không tìm thấy linh kiện hợp lệ trong cấu hình hiện tại.")
                    .evaluationTimeMs(computeElapsedMs(startNs))
                    .build();
        }

        Map<String, Product> productById = new LinkedHashMap<>();
        for (Product product : currentProducts) {
            if (product != null && product.getProductId() != null) {
                productById.put(product.getProductId(), product);
            }
        }

        List<String> unresolvedIds = qtyMap.keySet().stream()
                .filter(id -> !productById.containsKey(id))
                .toList();

        List<ProductItemContext> baseContexts = buildBaseContexts(currentProducts, qtyMap);
        CompatibilityResult baseResult = compatibilityService.evaluateContexts(baseContexts, unresolvedIds);

        Optional<ViolationDetail> matchedOpt = findTargetViolation(
                baseResult,
                targetRuleId,
                request.getSourceProductId(),
                request.getTargetProductId()
        );

        if (matchedOpt.isEmpty()) {
            return QuickFixResponse.builder()
                    .violationRuleId(targetRuleId)
                    .strategies(Collections.emptyList())
                    .guidanceMessage("Vi phạm này không còn xuất hiện trong cấu hình hiện tại.")
                    .evaluationTimeMs(computeElapsedMs(startNs))
                    .build();
        }

        ViolationDetail targetViolation = matchedOpt.get();
        List<ReplaceTarget> replaceTargets = resolveCandidateSlots(targetViolation, preferredSlot, productById);

        if (replaceTargets.isEmpty()) {
            return QuickFixResponse.builder()
                    .violationRuleId(targetRuleId)
                    .strategies(Collections.emptyList())
                    .guidanceMessage("Vi phạm ở cấp toàn cấu hình không gắn với linh kiện đơn lẻ. Vui lòng kiểm tra và bổ sung linh kiện còn thiếu.")
                    .evaluationTimeMs(computeElapsedMs(startNs))
                    .build();
        }

        List<QuickFixStrategyGroupDTO> strategies = new ArrayList<>();
        for (ReplaceTarget replaceTarget : replaceTargets) {
            QuickFixStrategyGroupDTO group = simulateAndRankForSlot(
                    replaceTarget,
                    targetViolation,
                    targetRuleId,
                    productById,
                    qtyMap,
                    baseContexts,
                    baseResult,
                    limit
            );
            if (group != null && !group.getOptions().isEmpty()) {
                strategies.add(group);
            }
        }

        String guidanceMessage = strategies.isEmpty()
                ? "Không tìm thấy linh kiện thay thế khả dụng trong kho để khắc phục xung đột này."
                : null;

        return QuickFixResponse.builder()
                .violationRuleId(targetRuleId)
                .strategies(strategies)
                .guidanceMessage(guidanceMessage)
                .evaluationTimeMs(computeElapsedMs(startNs))
                .build();
    }

    private QuickFixStrategyGroupDTO simulateAndRankForSlot(
            ReplaceTarget replaceTarget,
            ViolationDetail targetViolation,
            String targetRuleId,
            Map<String, Product> productById,
            Map<String, Integer> qtyMap,
            List<ProductItemContext> baseContexts,
            CompatibilityResult baseResult,
            int limit
    ) {
        Product oldProduct = productById.get(replaceTarget.oldProductId());
        if (oldProduct == null) {
            return null;
        }

        String replaceSlot = replaceTarget.slotCode();
        int qty = Math.max(1, qtyMap.getOrDefault(oldProduct.getProductId(), 1));
        int oldPrice = oldProduct.getPrice() != null ? oldProduct.getPrice() : 0;

        List<Product> pool = queryBoundedCandidatePool(replaceSlot, oldProduct.getProductId(), qty, oldPrice);
        if (pool.isEmpty()) {
            return null;
        }

        List<RankedCandidate> accepted = new ArrayList<>();
        boolean mustClearInfo = targetViolation.getSeverity() == RuleSeverity.INFO;

        for (Product candidate : pool) {
            if (!isEligibleCandidate(candidate, oldProduct.getProductId(), qty)) {
                continue;
            }

            List<ProductItemContext> hypothetical = buildHypotheticalContexts(
                    baseContexts,
                    oldProduct.getProductId(),
                    candidate,
                    replaceSlot,
                    qty
            );

            CompatibilityResult simResult = compatibilityService.evaluateContexts(hypothetical, Collections.emptyList());
            if (!passesAcceptancePredicate(simResult, targetRuleId, mustClearInfo)) {
                continue;
            }

            int remainingWarnings = simResult.getWarnings() != null ? simResult.getWarnings().size() : 0;
            int candidatePrice = candidate.getPrice() != null ? candidate.getPrice() : 0;
            long priceDelta = (long) candidatePrice - (long) oldPrice;
            double benchmark = candidate.getBenchmarkScore() != null ? candidate.getBenchmarkScore() : 0.0;
            int clearedCount = countClearedViolations(baseResult, simResult);

            accepted.add(new RankedCandidate(
                    candidate,
                    priceDelta,
                    remainingWarnings,
                    clearedCount,
                    benchmark
            ));
        }

        if (accepted.isEmpty()) {
            return null;
        }

        accepted.sort(
                Comparator.comparingInt(RankedCandidate::remainingWarnings)
                        .thenComparingLong(opt -> Math.abs(opt.priceDelta()))
                        .thenComparing(Comparator.comparingDouble(RankedCandidate::benchmarkScore).reversed())
                        .thenComparing(opt -> opt.product().getProductId())
        );

        List<QuickFixOptionDTO> topOptions = accepted.stream()
                .limit(limit)
                .map(opt -> QuickFixOptionDTO.builder()
                        .product(productMapper.toSummaryDto(opt.product()))
                        .priceDelta(opt.priceDelta())
                        .resultingStatus(opt.remainingWarnings() > 0 ? SlotStatusLevel.WARNING : SlotStatusLevel.COMPATIBLE)
                        .remainingWarningsCount(opt.remainingWarnings())
                        .clearedViolationCount(opt.clearedViolations())
                        .build())
                .toList();

        return QuickFixStrategyGroupDTO.builder()
                .replaceSlot(replaceSlot)
                .currentProductId(oldProduct.getProductId())
                .currentProductName(oldProduct.getName())
                .strategyLabel(buildStrategyLabel(replaceSlot, replaceTarget.otherProduct()))
                .options(topOptions)
                .build();
    }

    private List<Product> queryBoundedCandidatePool(
            String replaceSlot,
            String oldProductId,
            int minStockQty,
            int oldPrice
    ) {
        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .category(replaceSlot)
                .isActive(true)
                .includeDeleted(false)
                .build();

        Specification<Product> spec = ProductSpecifications.of(criteria)
                .and((root, query, cb) -> {
                    if (oldPrice > 0
                            && query != null
                            && query.getResultType() != Long.class
                            && query.getResultType() != long.class) {
                        Expression<Integer> diffExpr = cb.abs(cb.diff(root.get("price"), oldPrice));
                        query.orderBy(
                                cb.asc(diffExpr),
                                cb.desc(root.get("benchmarkScore")),
                                cb.asc(root.get("productId"))
                        );
                    }
                    return cb.and(
                            cb.greaterThanOrEqualTo(root.get("stockQuantity"), minStockQty),
                            cb.notEqual(root.get("productId"), oldProductId)
                    );
                });

        PageRequest pageRequest = oldPrice > 0
                ? PageRequest.of(0, MAX_QUICKFIX_POOL)
                : PageRequest.of(
                        0,
                        MAX_QUICKFIX_POOL,
                        Sort.by(Sort.Order.desc("benchmarkScore"), Sort.Order.asc("productId"))
                );

        Page<Product> page = productRepository.findAll(spec, pageRequest);
        if (page == null || page.getContent() == null) {
            return Collections.emptyList();
        }
        return page.getContent();
    }

    private boolean isEligibleCandidate(Product candidate, String oldProductId, int requiredQty) {
        if (candidate == null || candidate.getProductId() == null) {
            return false;
        }
        if (candidate.getProductId().equals(oldProductId)) {
            return false;
        }
        if (!Boolean.TRUE.equals(candidate.getIsActive()) || candidate.getDeletedAt() != null) {
            return false;
        }
        int stock = candidate.getStockQuantity() != null ? candidate.getStockQuantity() : 0;
        return stock >= requiredQty;
    }

    private List<ProductItemContext> buildHypotheticalContexts(
            List<ProductItemContext> baseContexts,
            String oldProductId,
            Product candidate,
            String replaceSlot,
            int replaceQty
    ) {
        List<ProductItemContext> result = new ArrayList<>(baseContexts.size());
        Map<String, Object> candidateSpecs = candidate.getSpecs() != null
                ? new LinkedHashMap<>(candidate.getSpecs())
                : new LinkedHashMap<>();

        boolean alreadyPresent = false;
        for (ProductItemContext ctx : baseContexts) {
            if (ctx.getProductId().equals(candidate.getProductId())) {
                alreadyPresent = true;
                break;
            }
        }

        if (alreadyPresent) {
            for (ProductItemContext ctx : baseContexts) {
                if (ctx.getProductId().equals(oldProductId)) {
                    continue;
                }
                if (ctx.getProductId().equals(candidate.getProductId())) {
                    int mergedQty = Math.min(CompatibilityService.MAX_QUANTITY_PER_PRODUCT, ctx.getQuantity() + replaceQty);
                    result.add(ProductItemContext.builder()
                            .productId(ctx.getProductId())
                            .productName(ctx.getProductName())
                            .categoryCode(ctx.getCategoryCode())
                            .specs(new LinkedHashMap<>(ctx.getSpecs()))
                            .quantity(mergedQty)
                            .build());
                } else {
                    result.add(ctx);
                }
            }
            return result;
        }

        boolean replaced = false;
        for (ProductItemContext ctx : baseContexts) {
            if (ctx.getProductId().equals(oldProductId)) {
                result.add(ProductItemContext.builder()
                        .productId(candidate.getProductId())
                        .productName(candidate.getName())
                        .categoryCode(replaceSlot)
                        .specs(candidateSpecs)
                        .quantity(replaceQty)
                        .build());
                replaced = true;
            } else {
                result.add(ctx);
            }
        }

        if (!replaced) {
            result.add(ProductItemContext.builder()
                    .productId(candidate.getProductId())
                    .productName(candidate.getName())
                    .categoryCode(replaceSlot)
                    .specs(candidateSpecs)
                    .quantity(replaceQty)
                    .build());
        }

        return result;
    }

    private boolean passesAcceptancePredicate(CompatibilityResult simResult, String targetRuleId, boolean mustClearInfo) {
        if (simResult == null) {
            return false;
        }
        List<ViolationDetail> errors = simResult.getErrors() != null ? simResult.getErrors() : Collections.emptyList();
        if (!errors.isEmpty()) {
            return false;
        }
        if (containsRule(errors, targetRuleId)) {
            return false;
        }
        if (containsRule(simResult.getWarnings(), targetRuleId)) {
            return false;
        }
        if (mustClearInfo && containsRule(simResult.getInfo(), targetRuleId)) {
            return false;
        }
        return true;
    }

    private boolean containsRule(List<ViolationDetail> violations, String targetRuleId) {
        if (violations == null || violations.isEmpty()) {
            return false;
        }
        for (ViolationDetail detail : violations) {
            if (detail != null && targetRuleId.equals(detail.getRuleId())) {
                return true;
            }
        }
        return false;
    }

    private int countClearedViolations(CompatibilityResult baseResult, CompatibilityResult simResult) {
        List<ViolationDetail> baseViolations = new ArrayList<>();
        if (baseResult.getErrors() != null) {
            baseViolations.addAll(baseResult.getErrors());
        }
        if (baseResult.getWarnings() != null) {
            baseViolations.addAll(baseResult.getWarnings());
        }
        if (baseResult.getInfo() != null) {
            baseViolations.addAll(baseResult.getInfo());
        }

        Set<String> simRuleIds = new HashSet<>();
        collectRuleIds(simResult.getErrors(), simRuleIds);
        collectRuleIds(simResult.getWarnings(), simRuleIds);
        collectRuleIds(simResult.getInfo(), simRuleIds);

        int cleared = 0;
        for (ViolationDetail v : baseViolations) {
            if (v != null && v.getRuleId() != null && !simRuleIds.contains(v.getRuleId())) {
                cleared++;
            }
        }
        return Math.max(1, cleared);
    }

    private void collectRuleIds(List<ViolationDetail> list, Set<String> sink) {
        if (list == null) {
            return;
        }
        for (ViolationDetail v : list) {
            if (v != null && v.getRuleId() != null) {
                sink.add(v.getRuleId());
            }
        }
    }

    private Optional<ViolationDetail> findTargetViolation(
            CompatibilityResult baseResult,
            String targetRuleId,
            String sourceProductId,
            String targetProductId
    ) {
        if (baseResult == null) {
            return Optional.empty();
        }
        List<ViolationDetail> all = new ArrayList<>();
        if (baseResult.getErrors() != null) {
            all.addAll(baseResult.getErrors());
        }
        if (baseResult.getWarnings() != null) {
            all.addAll(baseResult.getWarnings());
        }
        if (baseResult.getInfo() != null) {
            all.addAll(baseResult.getInfo());
        }

        String cleanSourceId = sourceProductId != null && !sourceProductId.isBlank() ? sourceProductId.trim() : null;
        String cleanTargetId = targetProductId != null && !targetProductId.isBlank() ? targetProductId.trim() : null;

        ViolationDetail firstRuleMatch = null;
        for (ViolationDetail detail : all) {
            if (detail == null || !targetRuleId.equals(detail.getRuleId())) {
                continue;
            }
            if (firstRuleMatch == null) {
                firstRuleMatch = detail;
            }
            boolean srcMatch = cleanSourceId == null
                    || (detail.getSourceProduct() != null && cleanSourceId.equals(detail.getSourceProduct().getId()));
            boolean tgtMatch = cleanTargetId == null
                    || (detail.getTargetProduct() != null && cleanTargetId.equals(detail.getTargetProduct().getId()));
            if (srcMatch && tgtMatch) {
                return Optional.of(detail);
            }
        }
        return Optional.ofNullable(firstRuleMatch);
    }

    private List<ReplaceTarget> resolveCandidateSlots(
            ViolationDetail violation,
            String preferredSlot,
            Map<String, Product> productById
    ) {
        ProductReference targetRef = violation.getTargetProduct();
        ProductReference sourceRef = violation.getSourceProduct();

        String targetSlot = resolveSlotFromReference(targetRef, productById);
        String sourceSlot = resolveSlotFromReference(sourceRef, productById);

        List<ReplaceTarget> ordered = new ArrayList<>(2);
        // Thứ tự mặc định: Target trước, Source sau (DD-UC2-Quick-Fix §2.2 & §3.1)
        if (targetSlot != null && targetRef != null && productById.containsKey(targetRef.getId())) {
            ordered.add(new ReplaceTarget(targetSlot, targetRef.getId(), sourceRef));
        }
        if (sourceSlot != null
                && sourceRef != null
                && !sourceSlot.equals(targetSlot)
                && productById.containsKey(sourceRef.getId())) {
            ordered.add(new ReplaceTarget(sourceSlot, sourceRef.getId(), targetRef));
        }

        if (preferredSlot != null && ordered.size() > 1) {
            for (int i = 1; i < ordered.size(); i++) {
                if (preferredSlot.equals(ordered.get(i).slotCode())) {
                    ReplaceTarget preferred = ordered.remove(i);
                    ordered.add(0, preferred);
                    break;
                }
            }
        }
        return ordered;
    }

    private String resolveSlotFromReference(ProductReference ref, Map<String, Product> productById) {
        if (ref == null) {
            return null;
        }
        if (ref.getCategoryCode() != null && !ref.getCategoryCode().isBlank()) {
            String normalized = ref.getCategoryCode().trim().toUpperCase();
            if (BuilderSlotCode.isValidBuilderSlotOrPeripheral(normalized)) {
                return normalized;
            }
        }
        if (ref.getId() != null && productById.containsKey(ref.getId())) {
            String cat = resolveCategoryCode(productById.get(ref.getId()));
            if (BuilderSlotCode.isValidBuilderSlotOrPeripheral(cat)) {
                return cat;
            }
        }
        return null;
    }

    private List<ProductItemContext> buildBaseContexts(List<Product> products, Map<String, Integer> qtyMap) {
        List<ProductItemContext> contexts = new ArrayList<>(products.size());
        for (Product product : products) {
            if (product == null || product.getProductId() == null) {
                continue;
            }
            Map<String, Object> defensiveSpecs = product.getSpecs() != null
                    ? new LinkedHashMap<>(product.getSpecs())
                    : new LinkedHashMap<>();
            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(resolveCategoryCode(product))
                    .specs(defensiveSpecs)
                    .quantity(Math.max(1, qtyMap.getOrDefault(product.getProductId(), 1)))
                    .build());
        }
        return contexts;
    }

    private String normalizeAndValidatePreferredSlot(String preferredSlot) {
        if (preferredSlot == null || preferredSlot.isBlank()) {
            return null;
        }
        String normalized = preferredSlot.trim().toUpperCase();
        if (!BuilderSlotCode.isValidBuilderSlotOrPeripheral(normalized)) {
            throw new BusinessException(
                    ErrorCode.BUILDER_INVALID_SLOT,
                    "Mã khe linh kiện '" + preferredSlot + "' không hợp lệ cho PC Builder"
            );
        }
        return normalized;
    }

    private int clampLimit(Integer rawLimit) {
        if (rawLimit == null) {
            return DEFAULT_LIMIT_PER_STRATEGY;
        }
        return Math.max(1, Math.min(MAX_LIMIT_PER_STRATEGY, rawLimit));
    }

    private String resolveCategoryCode(Product product) {
        if (product.getCategory() != null && product.getCategory().getCategoryCode() != null) {
            return product.getCategory().getCategoryCode().trim().toUpperCase();
        }
        return "UNKNOWN";
    }

    private String buildStrategyLabel(String replaceSlot, ProductReference otherProduct) {
        String replaceLabel = slotDisplayLabel(replaceSlot);
        if (otherProduct != null && otherProduct.getName() != null && !otherProduct.getName().isBlank()) {
            String otherSlotLabel = otherProduct.getCategoryCode() != null
                    ? slotDisplayLabel(otherProduct.getCategoryCode().trim().toUpperCase()) + " "
                    : "";
            return "Đổi " + replaceLabel + " tương thích với " + otherSlotLabel + otherProduct.getName();
        }
        return "Đổi " + replaceLabel + " phù hợp với cấu hình hiện tại";
    }

    private String slotDisplayLabel(String slotCode) {
        return switch (slotCode) {
            case "CPU" -> "CPU";
            case "MOTHERBOARD" -> "Mainboard";
            case "RAM" -> "RAM";
            case "GPU" -> "Card đồ họa (GPU)";
            case "SSD_M2" -> "SSD M.2";
            case "SSD_SATA" -> "SSD SATA 2.5\"";
            case "PSU" -> "Nguồn (PSU)";
            case "CASE" -> "Vỏ Case";
            case "CPU_COOLER" -> "Tản nhiệt CPU";
            default -> slotCode;
        };
    }

    private double computeElapsedMs(long startNs) {
        double raw = (System.nanoTime() - startNs) / 1_000_000.0;
        return Math.round(raw * 100.0) / 100.0;
    }

    private record ReplaceTarget(String slotCode, String oldProductId, ProductReference otherProduct) {
    }

    private record RankedCandidate(
            Product product,
            long priceDelta,
            int remainingWarnings,
            int clearedViolations,
            double benchmarkScore
    ) {
    }
}
