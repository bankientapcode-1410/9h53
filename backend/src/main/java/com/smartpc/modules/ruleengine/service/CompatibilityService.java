package com.smartpc.modules.ruleengine.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.validator.RuleValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CompatibilityService {

    public static final int MAX_DISTINCT_PRODUCTS = 30;
    public static final int MAX_QUANTITY_PER_PRODUCT = 16;

    private final ProductRepository productRepository;
    private final RuleCacheManager ruleCacheManager;
    private final AggregateCalculator aggregateCalculator;
    private final RuleEvaluator ruleEvaluator;

    public CompatibilityService(
            ProductRepository productRepository,
            RuleCacheManager ruleCacheManager,
            AggregateCalculator aggregateCalculator,
            RuleEvaluator ruleEvaluator
    ) {
        this.productRepository = productRepository;
        this.ruleCacheManager = ruleCacheManager;
        this.aggregateCalculator = aggregateCalculator;
        this.ruleEvaluator = ruleEvaluator;
    }

    /**
     * Constructor tương thích ngược cho các Unit/Benchmark Test cũ truyền Executor.
     */
    public CompatibilityService(
            ProductRepository productRepository,
            RuleCacheManager ruleCacheManager,
            AggregateCalculator aggregateCalculator,
            RuleEvaluator ruleEvaluator,
            Executor ignored
    ) {
        this(productRepository, ruleCacheManager, aggregateCalculator, ruleEvaluator);
    }

    /**
     * Kiểm tra tính hợp lệ và chặn tràn số / DoS cho các yêu cầu kiểm tra tương thích (DD-UC6 §4.6.A).
     */
    public static void validateRequestBounds(Map<String, Integer> productQuantities) {
        if (productQuantities == null || productQuantities.isEmpty()) {
            return;
        }

        if (productQuantities.size() > MAX_DISTINCT_PRODUCTS) {
            throw new BusinessException(ErrorCode.RULE_CHECK_TOO_MANY_PRODUCTS,
                    "Số lượng sản phẩm khác nhau (" + productQuantities.size()
                            + ") trong một lần kiểm tra tương thích vượt quá giới hạn " + MAX_DISTINCT_PRODUCTS);
        }

        for (Map.Entry<String, Integer> entry : productQuantities.entrySet()) {
            String pid = entry.getKey();
            Integer qty = entry.getValue();

            if (pid != null && pid.length() > 64) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Mã sản phẩm không được vượt quá 64 ký tự: " + pid);
            }

            if (qty != null && qty > MAX_QUANTITY_PER_PRODUCT) {
                throw new BusinessException(ErrorCode.RULE_CHECK_QUANTITY_EXCEEDED,
                        "Số lượng của sản phẩm '" + pid + "' (" + qty
                                + ") vượt quá giới hạn tối đa cho phép là " + MAX_QUANTITY_PER_PRODUCT);
            }
        }
    }

    public CompatibilityResult checkCompatibility(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }
        Map<String, Integer> productQuantities = new LinkedHashMap<>();
        for (String pid : productIds) {
            if (pid != null && !pid.isBlank()) {
                String cleanId = pid.trim();
                long current = productQuantities.getOrDefault(cleanId, 0);
                long updated = Math.min((long) MAX_QUANTITY_PER_PRODUCT + 1, current + 1);
                productQuantities.put(cleanId, (int) updated);
            }
        }
        return checkCompatibilityWithQuantities(productQuantities);
    }

    public CompatibilityResult checkCompatibilityWithQuantities(Map<String, Integer> productQuantities) {
        if (productQuantities == null || productQuantities.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }

        // 1. Chặn vượt ngưỡng (DD-UC6 §4.6.A)
        validateRequestBounds(productQuantities);

        // 2. Tải sản phẩm từ DB (transaction ngắn hạn của Repository, không giữ connection khi tính toán)
        List<Product> products = productRepository.findAllActiveWithCategoryByIds(productQuantities.keySet());

        // 3. Ghi nhận các ID không tìm thấy hoặc inactive/deleted
        Set<String> foundIds = products.stream()
                .map(Product::getProductId)
                .collect(Collectors.toSet());
        List<String> unresolvedIds = productQuantities.keySet().stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (products.isEmpty()) {
            return CompatibilityResult.builder()
                    .isCompatible(true)
                    .unresolvedProductIds(unresolvedIds)
                    .build();
        }

        // 4. Chuyển đổi an toàn sang ProductItemContext với defensive copy của specs
        List<ProductItemContext> contexts = new ArrayList<>();
        for (Product product : products) {
            String catCode = (product.getCategory() != null && product.getCategory().getCategoryCode() != null)
                    ? product.getCategory().getCategoryCode().trim().toUpperCase()
                    : "UNKNOWN";
            int quantity = productQuantities.getOrDefault(product.getProductId(), 1);
            Map<String, Object> defensiveSpecs = product.getSpecs() != null
                    ? new LinkedHashMap<>(product.getSpecs())
                    : new LinkedHashMap<>();

            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(catCode)
                    .specs(defensiveSpecs)
                    .quantity(quantity)
                    .build());
        }

        return evaluateContexts(contexts, unresolvedIds);
    }

    public CompatibilityResult evaluateContexts(List<ProductItemContext> contexts) {
        return evaluateContexts(contexts, Collections.emptyList());
    }

    public CompatibilityResult evaluateContexts(List<ProductItemContext> contexts, List<String> unresolvedProductIds) {
        if (contexts == null || contexts.isEmpty()) {
            return CompatibilityResult.builder()
                    .isCompatible(true)
                    .unresolvedProductIds(unresolvedProductIds != null ? unresolvedProductIds : Collections.emptyList())
                    .build();
        }

        // 1. Calculate aggregated specs
        Map<String, Object> aggregates = aggregateCalculator.calculateAggregates(contexts);

        // 2. Group items by category (null-safe, fast direct loop without stream overhead)
        Map<String, List<ProductItemContext>> itemsByCategory = new HashMap<>(contexts.size());
        for (ProductItemContext item : contexts) {
            if (item == null) continue;
            String cat = item.getCategoryCode() != null ? item.getCategoryCode().trim().toUpperCase() : "UNKNOWN";
            itemsByCategory.computeIfAbsent(cat, k -> new ArrayList<>(2)).add(item);
        }

        // 3. Get pre-indexed rules from Caffeine cache
        PreIndexedRuleCache ruleCache = ruleCacheManager.getPreIndexedRules();

        // 4. Identify rules applicable to this PC configuration
        Set<String> presentCategories = itemsByCategory.keySet();
        List<CompatRule> rulesToEvaluate = new ArrayList<>();

        // Add rules for present category pairs
        for (String srcCat : presentCategories) {
            for (String tgtCat : presentCategories) {
                if (!srcCat.equals(tgtCat)) {
                    rulesToEvaluate.addAll(ruleCache.getRulesForPair(srcCat, tgtCat));
                }
            }
        }

        // Add system-level rules (_SYSTEM -> targetCategory)
        for (String tgtCat : presentCategories) {
            rulesToEvaluate.addAll(ruleCache.getRulesForPair(RuleValidator.SYSTEM_CATEGORY, tgtCat));
        }

        if (rulesToEvaluate.isEmpty()) {
            return CompatibilityResult.builder()
                    .isCompatible(true)
                    .unresolvedProductIds(unresolvedProductIds != null ? unresolvedProductIds : Collections.emptyList())
                    .build();
        }

        // Sort rules in-place by priority ASC (fast, 0 stream overhead)
        rulesToEvaluate.sort(Comparator.comparingInt(CompatRule::getPriority));

        // 5. Evaluate rules sequentially in priority order on calling thread (v1.2)
        List<ViolationDetail> allViolations = new ArrayList<>();
        for (CompatRule rule : rulesToEvaluate) {
            List<ProductItemContext> sources = RuleValidator.SYSTEM_CATEGORY.equalsIgnoreCase(rule.getSourceCategory())
                    ? Collections.emptyList()
                    : itemsByCategory.getOrDefault(rule.getSourceCategory().toUpperCase(), Collections.emptyList());
            List<ProductItemContext> targets = itemsByCategory.getOrDefault(rule.getTargetCategory().toUpperCase(), Collections.emptyList());

            if (targets.isEmpty()) continue;

            allViolations.addAll(ruleEvaluator.evaluateRule(rule, sources, targets, aggregates));
        }

        List<ViolationDetail> errors = new ArrayList<>();
        List<ViolationDetail> warnings = new ArrayList<>();
        List<ViolationDetail> info = new ArrayList<>();

        for (ViolationDetail v : allViolations) {
            if (v.getSeverity() == RuleSeverity.ERROR) {
                errors.add(v);
            } else if (v.getSeverity() == RuleSeverity.WARNING) {
                warnings.add(v);
            } else {
                info.add(v);
            }
        }

        return CompatibilityResult.builder()
                .isCompatible(errors.isEmpty())
                .errors(errors)
                .warnings(warnings)
                .info(info)
                .unresolvedProductIds(unresolvedProductIds != null ? unresolvedProductIds : Collections.emptyList())
                .build();
    }
}
