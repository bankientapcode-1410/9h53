package com.smartpc.modules.pcbuilder.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.FieldErrorDTO;
import com.smartpc.modules.pcbuilder.dto.request.AddBuildToCartRequest;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.request.ResolveBuildRequest;
import com.smartpc.modules.pcbuilder.dto.response.AddBuildToCartResponseDTO;
import com.smartpc.modules.pcbuilder.dto.response.PCBuilderEvaluateResponse;
import com.smartpc.modules.pcbuilder.dto.response.ResolveBuildResponseDTO;
import com.smartpc.modules.pcbuilder.dto.response.ResolveBuildResponseDTO.ResolvedSlotItemDTO;
import com.smartpc.modules.pcbuilder.dto.response.StockIssueDTO;
import com.smartpc.modules.pcbuilder.dto.response.ValidatedCartItemDTO;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service kiểm soát cổng an toàn (Risk Gatekeeper) phía Server và cầu nối giỏ hàng PC Builder (WBS 7.5.4 & 7.5.6).
 * Tuyệt đối không tin cờ gate_status từ client mà luôn nạp lại sản phẩm thực tế từ DB và chạy Rule Engine.
 */
@Slf4j
@Service
public class PCBuilderCartService {

    private final ProductRepository productRepository;
    private final PCBuilderEvaluationService evaluationService;
    private final PCBuilderRequestValidator requestValidator;
    private final ProductMapper productMapper;

    @Autowired
    public PCBuilderCartService(
            ProductRepository productRepository,
            PCBuilderEvaluationService evaluationService,
            PCBuilderRequestValidator requestValidator,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.evaluationService = evaluationService;
        this.requestValidator = requestValidator;
        this.productMapper = productMapper;
    }

    /**
     * Constructor 3 tham số giữ tương thích ngược cho các unit test Gatekeeper (WBS 7.5.4).
     */
    public PCBuilderCartService(
            ProductRepository productRepository,
            PCBuilderEvaluationService evaluationService,
            PCBuilderRequestValidator requestValidator
    ) {
        this(productRepository, evaluationService, requestValidator, null);
    }

    /**
     * Ngữ cảnh cấu hình đã qua xác thực server-side (dùng làm đầu vào trực tiếp cho WBS 7.5.6 addBuildToCart).
     */
    public record ValidatedBuildContext(
            Map<String, Integer> quantityMap,
            List<Product> products,
            PCBuilderEvaluateResponse evaluation
    ) {
    }

    /**
     * Nạp mới dữ liệu sản phẩm từ DB, đánh giá tương thích + tồn kho và cưỡng chế Risk Gatekeeper (WBS 7.5.4).
     *
     * @param items                danh sách linh kiện do client gửi lên
     * @param acknowledgedWarnings cờ người dùng đã tích xác nhận rủi ro WARNING trong RiskConfirmationModal
     * @return ngữ cảnh cấu hình đã xác thực hợp lệ từ DB và Rule Engine
     */
    public ValidatedBuildContext enforceGatekeeper(List<BuildItemInput> items, boolean acknowledgedWarnings) {
        Map<String, Integer> qtyMap = requestValidator.validateEvaluateItems(items, true);

        List<Product> fetched = productRepository.findAllActiveWithCategoryByIds(qtyMap.keySet());
        List<Product> products = fetched != null ? fetched : Collections.emptyList();

        Set<String> foundIds = products.stream()
                .filter(Objects::nonNull)
                .map(Product::getProductId)
                .collect(Collectors.toSet());

        List<String> unavailableIds = qtyMap.keySet().stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (!unavailableIds.isEmpty()) {
            List<FieldErrorDTO> fieldErrors = unavailableIds.stream()
                    .map(id -> FieldErrorDTO.builder()
                            .field(id)
                            .message("Linh kiện không tồn tại hoặc đã ngừng kinh doanh: " + id)
                            .build())
                    .toList();
            throw new BusinessException(
                    ErrorCode.BUILDER_PRODUCT_UNAVAILABLE,
                    ErrorCode.BUILDER_PRODUCT_UNAVAILABLE.getDefaultMessage(),
                    fieldErrors
            );
        }

        PCBuilderEvaluateResponse evaluation = evaluationService.evaluateFetchedProducts(
                products,
                qtyMap,
                Collections.emptyList()
        );

        assertGateAllowsCheckout(evaluation, acknowledgedWarnings);
        return new ValidatedBuildContext(qtyMap, products, evaluation);
    }

    /**
     * WBS 7.5.6: Xác thực Gatekeeper lần cuối, tính đơn giá & tổng tiền chuẩn DB rồi chuẩn bị payload giỏ hàng.
     * Hỗ trợ Guest Mode (`userId == null`) trả về `cart_persisted = false` cho `useCartStore` lưu cục bộ;
     * chữ ký giữ sẵn `userId` để gắn persistent cart khi `UC0`/`UC4` hoàn thiện.
     */
    @Transactional
    public AddBuildToCartResponseDTO addBuildToCart(AddBuildToCartRequest request, String userId) {
        List<BuildItemInput> items = request != null && request.getItems() != null
                ? request.getItems()
                : Collections.emptyList();
        boolean acknowledgedWarnings = request != null && request.isAcknowledgedWarnings();

        ValidatedBuildContext context = enforceGatekeeper(items, acknowledgedWarnings);

        Map<String, Product> productById = new LinkedHashMap<>();
        for (Product product : context.products()) {
            if (product != null && product.getProductId() != null) {
                productById.put(product.getProductId(), product);
            }
        }

        Map<String, String> requestedSlotMap = extractRequestedSlotCodes(items);
        List<ValidatedCartItemDTO> validatedItems = new ArrayList<>(context.quantityMap().size());
        long subtotalPrice = 0L;
        int addedItemsCount = 0;

        for (Map.Entry<String, Integer> entry : context.quantityMap().entrySet()) {
            Product product = productById.get(entry.getKey());
            if (product == null) {
                throw new BusinessException(ErrorCode.BUILDER_PRODUCT_UNAVAILABLE);
            }

            int qty = entry.getValue() != null ? entry.getValue() : 1;
            long unitPrice = product.getPrice() != null ? Math.max(0L, product.getPrice().longValue()) : 0L;
            long lineTotal = unitPrice * qty;
            subtotalPrice += lineTotal;
            addedItemsCount += qty;

            int availableStock = product.getStockQuantity() != null ? Math.max(0, product.getStockQuantity()) : 0;
            String categoryCode = resolveCategoryCode(product);
            String slotCode = BuilderSlotCode.isValidBuilderSlotOrPeripheral(categoryCode)
                    ? categoryCode
                    : requestedSlotMap.getOrDefault(product.getProductId(), categoryCode);

            validatedItems.add(ValidatedCartItemDTO.builder()
                    .productId(product.getProductId())
                    .slotCode(slotCode)
                    .name(product.getName())
                    .categoryCode(categoryCode)
                    .imageUrl(product.getImageUrl() != null ? product.getImageUrl() : "")
                    .unitPrice(unitPrice)
                    .quantity(qty)
                    .lineTotal(lineTotal)
                    .availableStock(availableStock)
                    .build());
        }

        // UC0/UC4 chưa kích hoạt persistent cart -> Guest Mode hoặc fallback an toàn trả cart_persisted = false
        if (userId != null && !userId.isBlank()) {
            log.debug("Authenticated cart persistence (UC4) chưa kích hoạt, tạm trả Guest payload cho userId={}", userId);
        }

        return AddBuildToCartResponseDTO.builder()
                .cartPersisted(false)
                .cartId(null)
                .gateStatus(context.evaluation().getGateStatus())
                .addedItemsCount(addedItemsCount)
                .subtotalPrice(subtotalPrice)
                .items(validatedItems)
                .build();
    }

    /**
     * WBS 7.5.6: Khôi phục cấu hình chia sẻ từ URL (?items=id:qty,...) qua 1 lần fetch DB duy nhất,
     * lọc bỏ linh kiện đã ngừng bán vào `dropped_product_ids` và đánh giá lại tương thích ngay.
     */
    public ResolveBuildResponseDTO resolveShareBuild(ResolveBuildRequest request) {
        List<BuildItemInput> items = request != null && request.getItems() != null
                ? request.getItems()
                : Collections.emptyList();

        Map<String, Integer> qtyMap = requestValidator.validateEvaluateItems(items, true);

        List<Product> fetched = productRepository.findAllActiveWithCategoryByIds(qtyMap.keySet());
        List<Product> activeProducts = fetched != null ? fetched : Collections.emptyList();

        Map<String, Product> productById = new LinkedHashMap<>();
        for (Product product : activeProducts) {
            if (product != null && product.getProductId() != null) {
                productById.put(product.getProductId(), product);
            }
        }

        List<ResolvedSlotItemDTO> resolvedItems = new ArrayList<>();
        List<String> droppedProductIds = new ArrayList<>();
        List<Product> resolvedProducts = new ArrayList<>();
        Map<String, Integer> resolvedQtyMap = new LinkedHashMap<>();

        ProductMapper mapper = Objects.requireNonNull(productMapper, "ProductMapper is required for resolveShareBuild");

        for (Map.Entry<String, Integer> entry : qtyMap.entrySet()) {
            String productId = entry.getKey();
            Product product = productById.get(productId);
            if (product == null) {
                droppedProductIds.add(productId);
                continue;
            }

            String categoryCode = resolveCategoryCode(product);
            int rawQty = entry.getValue() != null ? entry.getValue() : 1;
            int effectiveQty = BuilderSlotCode.fromCode(categoryCode)
                    .filter(BuilderSlotCode::isSingleSlot)
                    .isPresent() ? 1 : rawQty;

            ProductSummaryDTO summary = mapper.toSummaryDto(product);
            resolvedItems.add(ResolvedSlotItemDTO.builder()
                    .slotCode(categoryCode)
                    .quantity(effectiveQty)
                    .product(summary)
                    .build());

            resolvedProducts.add(product);
            resolvedQtyMap.put(productId, effectiveQty);
        }

        PCBuilderEvaluateResponse evaluation = evaluationService.evaluateFetchedProducts(
                resolvedProducts,
                resolvedQtyMap,
                Collections.emptyList()
        );

        return ResolveBuildResponseDTO.builder()
                .resolvedItems(resolvedItems)
                .droppedProductIds(droppedProductIds)
                .evaluation(evaluation)
                .build();
    }

    private Map<String, String> extractRequestedSlotCodes(List<BuildItemInput> items) {
        Map<String, String> slotMap = new LinkedHashMap<>();
        for (BuildItemInput item : items) {
            if (item == null || item.getProductId() == null || item.getProductId().isBlank()) {
                continue;
            }
            if (item.getSlotCode() != null && !item.getSlotCode().isBlank()) {
                slotMap.putIfAbsent(item.getProductId().trim(), item.getSlotCode().trim().toUpperCase());
            }
        }
        return slotMap;
    }

    private String resolveCategoryCode(Product product) {
        if (product != null && product.getCategory() != null && product.getCategory().getCategoryCode() != null) {
            return product.getCategory().getCategoryCode().trim().toUpperCase();
        }
        return "UNKNOWN";
    }

    /**
     * Kiểm tra kết quả đánh giá theo máy trạng thái 5 bước của BuilderGateStatus.
     * Chặn cứng cấu hình rỗng, hết hàng, có lỗi ERROR; yêu cầu acknowledgedWarnings=true khi có WARNING.
     */
    public void assertGateAllowsCheckout(PCBuilderEvaluateResponse evaluation, boolean acknowledgedWarnings) {
        if (evaluation == null || evaluation.getGateStatus() == null) {
            throw new BusinessException(ErrorCode.BUILDER_EMPTY_CONFIG);
        }

        BuilderGateStatus gateStatus = evaluation.getGateStatus();
        switch (gateStatus) {
            case BLOCKED_EMPTY -> throw new BusinessException(ErrorCode.BUILDER_EMPTY_CONFIG);
            case BLOCKED_OUT_OF_STOCK -> throw new BusinessException(
                    ErrorCode.PROD_OUT_OF_STOCK,
                    ErrorCode.PROD_OUT_OF_STOCK.getDefaultMessage(),
                    buildStockFieldErrors(evaluation)
            );
            case BLOCKED_COMPATIBILITY_ERROR -> {
                List<ViolationDetail> errors = evaluation.getCompatibility() != null
                        ? evaluation.getCompatibility().getErrors()
                        : null;
                throw new BusinessException(
                        ErrorCode.BUILDER_COMPATIBILITY_CONFLICT,
                        ErrorCode.BUILDER_COMPATIBILITY_CONFLICT.getDefaultMessage(),
                        buildViolationFieldErrors(errors)
                );
            }
            case WARNING_CONFIRM_REQUIRED -> {
                if (!acknowledgedWarnings) {
                    List<ViolationDetail> warnings = evaluation.getCompatibility() != null
                            ? evaluation.getCompatibility().getWarnings()
                            : null;
                    throw new BusinessException(
                            ErrorCode.BUILDER_WARNING_ACK_REQUIRED,
                            ErrorCode.BUILDER_WARNING_ACK_REQUIRED.getDefaultMessage(),
                            buildViolationFieldErrors(warnings)
                    );
                }
            }
            case READY_SAFE -> {
                // Cấu hình hợp lệ và an toàn tuyệt đối
            }
        }
    }

    private List<FieldErrorDTO> buildStockFieldErrors(PCBuilderEvaluateResponse evaluation) {
        List<FieldErrorDTO> result = new ArrayList<>();
        if (evaluation.getStockIssues() != null) {
            for (StockIssueDTO issue : evaluation.getStockIssues()) {
                if (issue == null) {
                    continue;
                }
                result.add(FieldErrorDTO.builder()
                        .field(issue.getProductId() != null ? issue.getProductId() : issue.getSlotCode())
                        .message(issue.getReason() != null ? issue.getReason() : ErrorCode.PROD_OUT_OF_STOCK.getDefaultMessage())
                        .build());
            }
        }
        if (evaluation.getCompatibility() != null
                && evaluation.getCompatibility().getUnresolvedProductIds() != null) {
            for (String unresolvedId : evaluation.getCompatibility().getUnresolvedProductIds()) {
                result.add(FieldErrorDTO.builder()
                        .field(unresolvedId)
                        .message("Linh kiện không tồn tại hoặc đã ngừng kinh doanh: " + unresolvedId)
                        .build());
            }
        }
        return result;
    }

    private List<FieldErrorDTO> buildViolationFieldErrors(List<ViolationDetail> violations) {
        if (violations == null || violations.isEmpty()) {
            return Collections.emptyList();
        }
        List<FieldErrorDTO> result = new ArrayList<>(violations.size());
        for (ViolationDetail detail : violations) {
            if (detail == null) {
                continue;
            }
            String field = detail.getRuleId() != null && !detail.getRuleId().isBlank()
                    ? detail.getRuleId()
                    : "compatibility";
            result.add(FieldErrorDTO.builder()
                    .field(field)
                    .message(detail.getMessage())
                    .build());
        }
        return result;
    }
}
