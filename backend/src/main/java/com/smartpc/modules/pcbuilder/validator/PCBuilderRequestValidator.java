package com.smartpc.modules.pcbuilder.validator;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Kiểm tra biên và chuẩn hóa danh sách linh kiện đầu vào cho các API PC Builder.
 */
@Component
public class PCBuilderRequestValidator {

    /**
     * Làm sạch, gộp trùng product_id và kiểm tra ngưỡng DoS/số lượng của UC6 & slot đơn.
     *
     * @param items           danh sách linh kiện đầu vào
     * @param requireNonEmpty true nếu yêu cầu cấu hình không được rỗng (VD: add-to-cart)
     * @return map product_id -> tổng quantity đã hợp nhất theo thứ tự xuất hiện
     */
    public Map<String, Integer> validateEvaluateItems(List<BuildItemInput> items, boolean requireNonEmpty) {
        if (items == null || items.isEmpty()) {
            if (requireNonEmpty) {
                throw new BusinessException(ErrorCode.BUILDER_EMPTY_CONFIG);
            }
            return Collections.emptyMap();
        }

        Map<String, Long> mergedQuantities = new LinkedHashMap<>();
        Map<BuilderSlotCode, Long> singleSlotTotalQty = new EnumMap<>(BuilderSlotCode.class);
        Map<BuilderSlotCode, Set<String>> singleSlotProductIds = new EnumMap<>(BuilderSlotCode.class);
        Map<String, BuilderSlotCode> productSingleSlot = new HashMap<>();

        for (BuildItemInput item : items) {
            if (item == null || item.getProductId() == null || item.getProductId().isBlank()) {
                continue;
            }

            String cleanId = item.getProductId().trim();
            if (cleanId.length() > 64) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Mã sản phẩm không được vượt quá 64 ký tự: " + cleanId);
            }

            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            if (qty <= 0 || qty > CompatibilityService.MAX_QUANTITY_PER_PRODUCT) {
                throw new BusinessException(ErrorCode.RULE_CHECK_QUANTITY_EXCEEDED,
                        "Số lượng của sản phẩm '" + cleanId + "' (" + qty
                                + ") phải nằm trong khoảng 1.." + CompatibilityService.MAX_QUANTITY_PER_PRODUCT);
            }

            long updatedQty = mergedQuantities.getOrDefault(cleanId, 0L) + qty;
            if (updatedQty > CompatibilityService.MAX_QUANTITY_PER_PRODUCT) {
                throw new BusinessException(ErrorCode.RULE_CHECK_QUANTITY_EXCEEDED,
                        "Tổng số lượng của sản phẩm '" + cleanId + "' (" + updatedQty
                                + ") vượt quá giới hạn tối đa cho phép là " + CompatibilityService.MAX_QUANTITY_PER_PRODUCT);
            }
            mergedQuantities.put(cleanId, updatedQty);

            if (item.getSlotCode() != null && !item.getSlotCode().isBlank()) {
                String normalizedSlot = item.getSlotCode().trim().toUpperCase();
                if (!BuilderSlotCode.isValidBuilderSlotOrPeripheral(normalizedSlot)) {
                    throw new BusinessException(ErrorCode.BUILDER_INVALID_SLOT,
                            "Mã khe linh kiện '" + item.getSlotCode() + "' không hợp lệ cho PC Builder");
                }

                Optional<BuilderSlotCode> slotOpt = BuilderSlotCode.fromCode(normalizedSlot);
                if (slotOpt.isPresent() && slotOpt.get().isSingleSlot()) {
                    BuilderSlotCode slot = slotOpt.get();
                    long slotQty = singleSlotTotalQty.getOrDefault(slot, 0L) + qty;
                    singleSlotTotalQty.put(slot, slotQty);
                    Set<String> slotProducts = singleSlotProductIds.computeIfAbsent(slot, k -> new HashSet<>());
                    slotProducts.add(cleanId);
                    productSingleSlot.put(cleanId, slot);

                    if (slotQty > 1L || slotProducts.size() > 1) {
                        throw new BusinessException(ErrorCode.BUILDER_SLOT_CAPACITY_EXCEEDED);
                    }
                }
            }

            // Chặn trường hợp cùng product_id xuất hiện lại không kèm slot_code nhưng đã khai báo trên slot SINGLE
            if (productSingleSlot.containsKey(cleanId) && updatedQty > 1L) {
                throw new BusinessException(ErrorCode.BUILDER_SLOT_CAPACITY_EXCEEDED);
            }
        }

        if (mergedQuantities.isEmpty()) {
            if (requireNonEmpty) {
                throw new BusinessException(ErrorCode.BUILDER_EMPTY_CONFIG);
            }
            return Collections.emptyMap();
        }

        if (mergedQuantities.size() > CompatibilityService.MAX_DISTINCT_PRODUCTS) {
            throw new BusinessException(ErrorCode.RULE_CHECK_TOO_MANY_PRODUCTS,
                    "Số lượng sản phẩm khác nhau (" + mergedQuantities.size()
                            + ") trong một lần đánh giá vượt quá giới hạn " + CompatibilityService.MAX_DISTINCT_PRODUCTS);
        }

        Map<String, Integer> result = new LinkedHashMap<>(mergedQuantities.size());
        mergedQuantities.forEach((id, qty) -> result.put(id, qty.intValue()));
        return result;
    }
}
