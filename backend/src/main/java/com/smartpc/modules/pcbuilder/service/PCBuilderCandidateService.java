package com.smartpc.modules.pcbuilder.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.request.SlotCandidateSearchRequest;
import com.smartpc.modules.pcbuilder.dto.response.CandidateProductDTO;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.repository.ProductSpecifications;
import com.smartpc.modules.product.validator.ProductFilterValidator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service truy vấn và lọc linh kiện ứng viên theo từng slot trong PC Builder (WBS 7.5.1 & 7.5.5).
 */
@Service
public class PCBuilderCandidateService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 48;
    public static final int MAX_PREFILTER_SCAN = 120;
    private static final int MAX_COMPAT_REASONS = 2;

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ProductFilterValidator filterValidator;
    private final CompatibilityService compatibilityService;
    private final PCBuilderRequestValidator requestValidator;

    @Autowired
    public PCBuilderCandidateService(
            ProductRepository productRepository,
            ProductMapper productMapper,
            ProductFilterValidator filterValidator,
            CompatibilityService compatibilityService,
            PCBuilderRequestValidator requestValidator
    ) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.filterValidator = filterValidator;
        this.compatibilityService = compatibilityService;
        this.requestValidator = requestValidator != null ? requestValidator : new PCBuilderRequestValidator();
    }

    /**
     * Constructor tương thích ngược cho các Unit Test chỉ khởi tạo 3 dependency của WBS 7.5.1.
     */
    public PCBuilderCandidateService(
            ProductRepository productRepository,
            ProductMapper productMapper,
            ProductFilterValidator filterValidator
    ) {
        this(productRepository, productMapper, filterValidator, null, new PCBuilderRequestValidator());
    }

    /**
     * Lọc danh sách sản phẩm ứng viên cho một slot cốt lõi hoặc thiết bị ngoại vi hợp lệ.
     */
    @Transactional(readOnly = true)
    public PageResponse<CandidateProductDTO> findCandidates(String categoryCode, SlotCandidateSearchRequest request) {
        if (!BuilderSlotCode.isValidBuilderSlotOrPeripheral(categoryCode)) {
            throw new BusinessException(
                    ErrorCode.BUILDER_INVALID_SLOT,
                    "Mã khe linh kiện '" + categoryCode + "' không hợp lệ cho PC Builder"
            );
        }

        String normalizedCategory = categoryCode.trim().toUpperCase();
        SlotCandidateSearchRequest safeRequest = request != null ? request : new SlotCandidateSearchRequest();

        int page = safeRequest.getPage() != null ? Math.max(DEFAULT_PAGE, safeRequest.getPage()) : DEFAULT_PAGE;
        int rawSize = safeRequest.getSize() != null ? safeRequest.getSize() : DEFAULT_SIZE;
        int size = Math.max(1, Math.min(MAX_SIZE, rawSize));

        String rawSort = (safeRequest.getSort() != null && !safeRequest.getSort().isBlank())
                ? safeRequest.getSort().trim().toLowerCase()
                : "newest";

        List<String> normalizedBrands = normalizeBrands(safeRequest.getBrand());
        Map<String, String> cleanSpecs = cleanSpecs(safeRequest.getSpecs());
        String cleanSearch = (safeRequest.getSearch() != null && !safeRequest.getSearch().isBlank())
                ? safeRequest.getSearch().trim()
                : null;

        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .category(normalizedCategory)
                .brand(normalizedBrands)
                .minPrice(safeRequest.getMinPrice())
                .maxPrice(safeRequest.getMaxPrice())
                .specs(cleanSpecs)
                .search(cleanSearch)
                .sort(rawSort)
                .page(page)
                .size(size)
                .isActive(true)
                .includeDeleted(false)
                .build();

        filterValidator.validate(criteria);

        Specification<Product> spec = ProductSpecifications.of(criteria);
        if (Boolean.TRUE.equals(safeRequest.getInStockOnly())) {
            spec = spec.and((root, query, cb) -> cb.greaterThan(root.get("stockQuantity"), 0));
        }

        boolean compatibleOnly = Boolean.TRUE.equals(safeRequest.getCompatibleOnly());
        boolean evaluateCompat = compatibleOnly || Boolean.TRUE.equals(safeRequest.getEvaluateCompatibility());

        boolean isSingleSlot = BuilderSlotCode.fromCode(normalizedCategory)
                .map(BuilderSlotCode::isSingleSlot)
                .orElse(false);

        List<ProductItemContext> baseContexts = resolveBaseContexts(
                evaluateCompat,
                safeRequest.getCurrentItems(),
                normalizedCategory,
                isSingleSlot
        );

        if (!evaluateCompat || compatibilityService == null || baseContexts.isEmpty()) {
            PageRequest pageRequest = PageRequest.of(page, size, buildSort(rawSort));
            Page<Product> productPage = productRepository.findAll(spec, pageRequest);
            return PageResponse.from(productPage, this::toDefaultCompatibleDto);
        }

        CompatibilityResult baseline = compatibilityService.evaluateContexts(baseContexts, Collections.emptyList());
        Set<String> baselineViolationSignatures = extractViolationSignatures(baseline);

        if (compatibleOnly) {
            PageRequest scanRequest = PageRequest.of(0, MAX_PREFILTER_SCAN, buildSort(rawSort));
            Page<Product> scannedPage = productRepository.findAll(spec, scanRequest);
            List<Product> scannedProducts = (scannedPage != null && scannedPage.getContent() != null)
                    ? scannedPage.getContent()
                    : Collections.emptyList();

            List<CandidateProductDTO> compatibleCandidates = new ArrayList<>();
            for (Product candidate : scannedProducts) {
                CandidateProductDTO dto = evaluateCandidateCompatibility(
                        candidate,
                        normalizedCategory,
                        isSingleSlot,
                        baseContexts,
                        baselineViolationSignatures
                );
                if (dto.getCompatStatus() != SlotStatusLevel.ERROR) {
                    compatibleCandidates.add(dto);
                }
            }

            return slicePageResponse(compatibleCandidates, page, size);
        }

        PageRequest pageRequest = PageRequest.of(page, size, buildSort(rawSort));
        Page<Product> productPage = productRepository.findAll(spec, pageRequest);
        return PageResponse.from(productPage, candidate -> evaluateCandidateCompatibility(
                candidate,
                normalizedCategory,
                isSingleSlot,
                baseContexts,
                baselineViolationSignatures
        ));
    }

    private CandidateProductDTO toDefaultCompatibleDto(Product product) {
        return CandidateProductDTO.builder()
                .product(productMapper.toSummaryDto(product))
                .compatStatus(SlotStatusLevel.COMPATIBLE)
                .compatSummary("Tương thích với cấu hình hiện tại")
                .blockingErrors(Collections.emptyList())
                .warnings(Collections.emptyList())
                .build();
    }

    private List<ProductItemContext> resolveBaseContexts(
            boolean evaluateCompat,
            List<BuildItemInput> currentItems,
            String targetCategory,
            boolean isSingleSlot
    ) {
        if (!evaluateCompat || compatibilityService == null || currentItems == null || currentItems.isEmpty()) {
            return Collections.emptyList();
        }

        List<BuildItemInput> filteredInputs = new ArrayList<>(currentItems.size());
        for (BuildItemInput item : currentItems) {
            if (item == null || item.getProductId() == null || item.getProductId().isBlank()) {
                continue;
            }
            if (isSingleSlot && item.getSlotCode() != null
                    && targetCategory.equalsIgnoreCase(item.getSlotCode().trim())) {
                continue;
            }
            filteredInputs.add(item);
        }

        Map<String, Integer> qtyMap = requestValidator.validateEvaluateItems(filteredInputs, false);
        if (qtyMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> fetched = productRepository.findAllActiveWithCategoryByIds(qtyMap.keySet());
        if (fetched == null || fetched.isEmpty()) {
            return Collections.emptyList();
        }

        List<ProductItemContext> contexts = new ArrayList<>(fetched.size());
        for (Product product : fetched) {
            if (product == null || product.getProductId() == null) {
                continue;
            }
            String catCode = resolveCategoryCode(product);
            if (isSingleSlot && targetCategory.equals(catCode)) {
                continue;
            }
            Map<String, Object> defensiveSpecs = product.getSpecs() != null
                    ? new LinkedHashMap<>(product.getSpecs())
                    : new LinkedHashMap<>();
            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(catCode)
                    .specs(defensiveSpecs)
                    .quantity(Math.max(1, qtyMap.getOrDefault(product.getProductId(), 1)))
                    .build());
        }
        return contexts;
    }

    private CandidateProductDTO evaluateCandidateCompatibility(
            Product candidate,
            String targetCategory,
            boolean isSingleSlot,
            List<ProductItemContext> baseContexts,
            Set<String> baselineViolationSignatures
    ) {
        List<ProductItemContext> simContexts = buildCandidateSimulationContexts(
                baseContexts,
                candidate,
                targetCategory,
                isSingleSlot
        );

        CompatibilityResult simResult = compatibilityService.evaluateContexts(simContexts, Collections.emptyList());
        String candidateId = candidate.getProductId();

        List<String> blockingErrors = extractRelevantMessages(
                simResult != null ? simResult.getErrors() : null,
                candidateId,
                baselineViolationSignatures
        );
        List<String> warnings = extractRelevantMessages(
                simResult != null ? simResult.getWarnings() : null,
                candidateId,
                baselineViolationSignatures
        );

        SlotStatusLevel status;
        String summary;
        if (!blockingErrors.isEmpty()) {
            status = SlotStatusLevel.ERROR;
            summary = blockingErrors.get(0);
        } else if (!warnings.isEmpty()) {
            status = SlotStatusLevel.WARNING;
            summary = warnings.get(0);
        } else {
            status = SlotStatusLevel.COMPATIBLE;
            summary = "Tương thích với cấu hình hiện tại";
        }

        return CandidateProductDTO.builder()
                .product(productMapper.toSummaryDto(candidate))
                .compatStatus(status)
                .compatSummary(summary)
                .blockingErrors(blockingErrors)
                .warnings(warnings)
                .build();
    }

    private List<ProductItemContext> buildCandidateSimulationContexts(
            List<ProductItemContext> baseContexts,
            Product candidate,
            String targetCategory,
            boolean isSingleSlot
    ) {
        List<ProductItemContext> simContexts = new ArrayList<>(baseContexts.size() + 1);
        String candidateId = candidate.getProductId();
        boolean incrementedExisting = false;

        for (ProductItemContext ctx : baseContexts) {
            if (!isSingleSlot && ctx.getProductId().equals(candidateId)) {
                int nextQty = Math.min(CompatibilityService.MAX_QUANTITY_PER_PRODUCT, ctx.getQuantity() + 1);
                simContexts.add(ProductItemContext.builder()
                        .productId(ctx.getProductId())
                        .productName(ctx.getProductName())
                        .categoryCode(ctx.getCategoryCode())
                        .specs(new LinkedHashMap<>(ctx.getSpecs()))
                        .quantity(nextQty)
                        .build());
                incrementedExisting = true;
            } else {
                simContexts.add(ctx);
            }
        }

        if (!incrementedExisting) {
            Map<String, Object> candidateSpecs = candidate.getSpecs() != null
                    ? new LinkedHashMap<>(candidate.getSpecs())
                    : new LinkedHashMap<>();
            simContexts.add(ProductItemContext.builder()
                    .productId(candidateId)
                    .productName(candidate.getName())
                    .categoryCode(targetCategory)
                    .specs(candidateSpecs)
                    .quantity(1)
                    .build());
        }

        return simContexts;
    }

    private List<String> extractRelevantMessages(
            List<ViolationDetail> violations,
            String candidateId,
            Set<String> baselineViolationSignatures
    ) {
        if (violations == null || violations.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> messages = new ArrayList<>(MAX_COMPAT_REASONS);
        for (ViolationDetail detail : violations) {
            if (detail == null || detail.getMessage() == null || detail.getMessage().isBlank()) {
                continue;
            }
            if (involvesProduct(detail, candidateId) || !baselineViolationSignatures.contains(violationSignature(detail))) {
                messages.add(detail.getMessage());
                if (messages.size() >= MAX_COMPAT_REASONS) {
                    break;
                }
            }
        }
        return messages;
    }

    private Set<String> extractViolationSignatures(CompatibilityResult baseline) {
        if (baseline == null) {
            return Collections.emptySet();
        }
        Set<String> signatures = new HashSet<>();
        if (baseline.getErrors() != null) {
            baseline.getErrors().stream().filter(Objects::nonNull).map(this::violationSignature).forEach(signatures::add);
        }
        if (baseline.getWarnings() != null) {
            baseline.getWarnings().stream().filter(Objects::nonNull).map(this::violationSignature).forEach(signatures::add);
        }
        return signatures;
    }

    private boolean involvesProduct(ViolationDetail detail, String productId) {
        if (productId == null) {
            return false;
        }
        boolean srcMatch = detail.getSourceProduct() != null && productId.equals(detail.getSourceProduct().getId());
        boolean tgtMatch = detail.getTargetProduct() != null && productId.equals(detail.getTargetProduct().getId());
        return srcMatch || tgtMatch;
    }

    private String violationSignature(ViolationDetail detail) {
        String ruleId = detail.getRuleId() != null ? detail.getRuleId() : "";
        String srcId = detail.getSourceProduct() != null && detail.getSourceProduct().getId() != null
                ? detail.getSourceProduct().getId() : "";
        String tgtId = detail.getTargetProduct() != null && detail.getTargetProduct().getId() != null
                ? detail.getTargetProduct().getId() : "";
        return ruleId + "|" + srcId + "|" + tgtId;
    }

    private PageResponse<CandidateProductDTO> slicePageResponse(
            List<CandidateProductDTO> allItems,
            int page,
            int size
    ) {
        int totalElements = allItems.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = page * size;
        List<CandidateProductDTO> pageContent = fromIndex >= totalElements
                ? Collections.emptyList()
                : new ArrayList<>(allItems.subList(fromIndex, Math.min(totalElements, fromIndex + size)));

        return PageResponse.<CandidateProductDTO>builder()
                .content(pageContent)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(page == 0)
                .last(totalElements == 0 || page >= totalPages - 1)
                .build();
    }

    private String resolveCategoryCode(Product product) {
        if (product.getCategory() != null && product.getCategory().getCategoryCode() != null) {
            return product.getCategory().getCategoryCode().trim().toUpperCase();
        }
        return "UNKNOWN";
    }

    private List<String> normalizeBrands(List<String> rawBrands) {
        if (rawBrands == null || rawBrands.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> normalized = new ArrayList<>();
        for (String brand : rawBrands) {
            if (brand == null) {
                continue;
            }
            for (String token : brand.split(",")) {
                String trimmed = token.trim();
                if (!trimmed.isBlank()) {
                    normalized.add(trimmed);
                }
            }
        }
        return normalized;
    }

    private Map<String, String> cleanSpecs(Map<String, String> rawSpecs) {
        if (rawSpecs == null || rawSpecs.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, String> cleaned = new LinkedHashMap<>();
        rawSpecs.forEach((key, value) -> {
            if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
                cleaned.put(key.trim(), value.trim());
            }
        });
        return cleaned;
    }

    private Sort buildSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        }
        return switch (sortParam.trim().toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("productId"));
            case "price_asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("productId"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("productId"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        };
    }
}
