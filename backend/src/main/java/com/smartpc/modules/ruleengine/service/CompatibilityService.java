package com.smartpc.modules.ruleengine.service;

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
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CompatibilityService {

    private final ProductRepository productRepository;
    private final RuleCacheManager ruleCacheManager;
    private final AggregateCalculator aggregateCalculator;
    private final RuleEvaluator ruleEvaluator;
    private final Executor ruleEngineExecutor;

    public CompatibilityService(
            ProductRepository productRepository,
            RuleCacheManager ruleCacheManager,
            AggregateCalculator aggregateCalculator,
            RuleEvaluator ruleEvaluator,
            @Qualifier("ruleEngineExecutor") Executor ruleEngineExecutor
    ) {
        this.productRepository = productRepository;
        this.ruleCacheManager = ruleCacheManager;
        this.aggregateCalculator = aggregateCalculator;
        this.ruleEvaluator = ruleEvaluator;
        this.ruleEngineExecutor = ruleEngineExecutor;
    }

    @Transactional(readOnly = true)
    public CompatibilityResult checkCompatibility(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }
        Map<String, Integer> productQuantities = new LinkedHashMap<>();
        for (String pid : productIds) {
            if (pid != null && !pid.isBlank()) {
                String cleanId = pid.trim();
                productQuantities.put(cleanId, productQuantities.getOrDefault(cleanId, 0) + 1);
            }
        }
        return checkCompatibilityWithQuantities(productQuantities);
    }

    @Transactional(readOnly = true)
    public CompatibilityResult checkCompatibilityWithQuantities(Map<String, Integer> productQuantities) {
        if (productQuantities == null || productQuantities.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }

        List<Product> products = productRepository.findAllActiveWithCategoryByIds(productQuantities.keySet());
        if (products.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }

        List<ProductItemContext> contexts = new ArrayList<>();
        for (Product product : products) {
            String catCode = product.getCategory() != null ? product.getCategory().getCategoryCode() : "UNKNOWN";
            int quantity = productQuantities.getOrDefault(product.getProductId(), 1);
            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(catCode)
                    .specs(product.getSpecs() != null ? product.getSpecs() : Collections.emptyMap())
                    .quantity(quantity)
                    .build());
        }

        return evaluateContexts(contexts);
    }

    public CompatibilityResult evaluateContexts(List<ProductItemContext> contexts) {
        if (contexts == null || contexts.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }

        // 1. Calculate aggregated specs
        Map<String, Object> aggregates = aggregateCalculator.calculateAggregates(contexts);

        // 2. Group items by category
        Map<String, List<ProductItemContext>> itemsByCategory = contexts.stream()
                .collect(Collectors.groupingBy(item -> item.getCategoryCode().toUpperCase()));

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

        // De-duplicate rules if any and sort by priority ASC
        List<CompatRule> distinctRules = rulesToEvaluate.stream()
                .distinct()
                .sorted(Comparator.comparingInt(CompatRule::getPriority))
                .toList();

        if (distinctRules.isEmpty()) {
            return CompatibilityResult.builder().isCompatible(true).build();
        }

        // 5. Evaluate rules in parallel on ruleEngineExecutor
        List<CompletableFuture<List<ViolationDetail>>> futures = new ArrayList<>();
        for (CompatRule rule : distinctRules) {
            List<ProductItemContext> sources = RuleValidator.SYSTEM_CATEGORY.equalsIgnoreCase(rule.getSourceCategory())
                    ? Collections.emptyList()
                    : itemsByCategory.getOrDefault(rule.getSourceCategory().toUpperCase(), Collections.emptyList());
            List<ProductItemContext> targets = itemsByCategory.getOrDefault(rule.getTargetCategory().toUpperCase(), Collections.emptyList());

            if (targets.isEmpty()) continue;

            futures.add(CompletableFuture.supplyAsync(
                    () -> ruleEvaluator.evaluateRule(rule, sources, targets, aggregates),
                    ruleEngineExecutor
            ));
        }

        List<ViolationDetail> allViolations = futures.stream()
                .map(CompletableFuture::join)
                .flatMap(List::stream)
                .toList();

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
                .build();
    }
}
