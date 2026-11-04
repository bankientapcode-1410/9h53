package com.smartpc.modules.ruleengine.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.dto.request.*;
import com.smartpc.modules.ruleengine.dto.response.*;
import com.smartpc.modules.ruleengine.dto.response.RuleSchemaMetadataDTO.AggregateKeyItemDTO;
import com.smartpc.modules.ruleengine.dto.response.RuleSchemaMetadataDTO.CategoryItemDTO;
import com.smartpc.modules.ruleengine.dto.response.RuleSchemaMetadataDTO.SpecKeyItemDTO;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.mapper.CompatRuleMapper;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import com.smartpc.modules.ruleengine.repository.CompatRuleSpecifications;
import com.smartpc.modules.ruleengine.validator.RuleValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompatRuleAdminService {

    private final CompatRuleRepository ruleRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategorySpecSchemaRegistry specSchemaRegistry;
    private final RuleValidator ruleValidator;
    private final RuleCacheManager ruleCacheManager;
    private final AggregateCalculator aggregateCalculator;
    private final RuleEvaluator ruleEvaluator;
    private final CompatRuleMapper ruleMapper;

    @Transactional(readOnly = true)
    public PageResponse<CompatRuleDTO> getRules(RuleFilterCriteria criteria, Pageable pageable) {
        Specification<CompatRule> spec = CompatRuleSpecifications.build(criteria);
        Page<CompatRule> page = ruleRepository.findAll(spec, pageable);
        List<CompatRuleDTO> dtos = ruleMapper.toDTOList(page.getContent());
        return PageResponse.fromPage(page, dtos);
    }

    @Transactional(readOnly = true)
    public CompatRuleDTO getRuleById(String ruleId) {
        CompatRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RULE_NOT_FOUND,
                        "Không tìm thấy quy tắc tương thích với ID: " + ruleId));
        return ruleMapper.toDTO(rule);
    }

    @Transactional
    public CompatRuleDTO createRule(CreateCompatRuleRequest request) {
        ruleValidator.validateForCreate(request);

        CompatRule entity = ruleMapper.toEntity(request);
        CompatRule saved = ruleRepository.save(entity);

        ruleCacheManager.evictAll();
        log.info("Created new compatibility rule [{}] with ID [{}] and evicted rule cache",
                saved.getRuleName(), saved.getRuleId());

        return ruleMapper.toDTO(saved);
    }

    @Transactional
    public CompatRuleDTO updateRule(String ruleId, UpdateCompatRuleRequest request) {
        ruleValidator.validateForUpdate(ruleId, request);

        CompatRule entity = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RULE_NOT_FOUND,
                        "Không tìm thấy quy tắc tương thích với ID: " + ruleId));

        ruleMapper.updateEntity(entity, request);
        CompatRule saved = ruleRepository.save(entity);

        ruleCacheManager.evictAll();
        log.info("Updated compatibility rule [{}] with ID [{}] and evicted rule cache",
                saved.getRuleName(), saved.getRuleId());

        return ruleMapper.toDTO(saved);
    }

    @Transactional
    public CompatRuleDTO updateRuleStatus(String ruleId, boolean isActive) {
        CompatRule entity = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RULE_NOT_FOUND,
                        "Không tìm thấy quy tắc tương thích với ID: " + ruleId));

        entity.setIsActive(isActive);
        CompatRule saved = ruleRepository.save(entity);

        ruleCacheManager.evictAll();
        log.info("Updated status of rule [{}] to [{}] and evicted rule cache", ruleId, isActive);

        return ruleMapper.toDTO(saved);
    }

    @Transactional
    public void deleteRule(String ruleId) {
        CompatRule entity = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RULE_NOT_FOUND,
                        "Không tìm thấy quy tắc tương thích với ID: " + ruleId));

        ruleRepository.delete(entity);
        ruleCacheManager.evictAll();
        log.info("Deleted compatibility rule [{}] and evicted rule cache", ruleId);
    }

    @Transactional(readOnly = true)
    public DryRunResultDTO dryRun(DryRunRuleRequest request) {
        if (request == null || request.getRuleDefinition() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Payload chạy thử không hợp lệ");
        }

        long startTime = System.nanoTime();
        CreateCompatRuleRequest ruleDef = request.getRuleDefinition();
        ruleValidator.validateForDryRun(ruleDef);

        // Gather test products & quantities
        Map<String, Integer> productQuantities = new LinkedHashMap<>();
        if (request.getTestProductIds() != null) {
            for (String pid : request.getTestProductIds()) {
                if (pid != null && !pid.isBlank()) {
                    productQuantities.put(pid.trim(), productQuantities.getOrDefault(pid.trim(), 0) + 1);
                }
            }
        }
        if (request.getTestItems() != null) {
            for (CompatibilityItemRequest item : request.getTestItems()) {
                if (item != null && item.getProductId() != null && !item.getProductId().isBlank()) {
                    int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                    productQuantities.put(item.getProductId().trim(),
                            productQuantities.getOrDefault(item.getProductId().trim(), 0) + qty);
                }
            }
        }

        if (productQuantities.isEmpty()) {
            throw new BusinessException(ErrorCode.RULE_DRY_RUN_EMPTY_PRODUCTS);
        }

        List<Product> products = productRepository.findAllActiveWithCategoryByIds(productQuantities.keySet());
        if (products.isEmpty()) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND, "Không tìm thấy sản phẩm mẫu hợp lệ trong hệ thống");
        }

        List<ProductItemContext> contexts = new ArrayList<>();
        List<String> missingSpecWarnings = new ArrayList<>();

        String srcKey = ruleDef.getSourceSpecKey().trim().toLowerCase();
        String tgtKey = ruleDef.getTargetSpecKey().trim().toLowerCase();
        String srcCat = ruleDef.getSourceCategory().trim().toUpperCase();
        String tgtCat = ruleDef.getTargetCategory().trim().toUpperCase();

        for (Product product : products) {
            String catCode = product.getCategory() != null ? product.getCategory().getCategoryCode() : "UNKNOWN";
            int qty = productQuantities.getOrDefault(product.getProductId(), 1);
            Map<String, Object> specs = product.getSpecs() != null ? product.getSpecs() : Collections.emptyMap();

            contexts.add(ProductItemContext.builder()
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .categoryCode(catCode)
                    .specs(specs)
                    .quantity(qty)
                    .build());

            // Check missing spec warnings
            if (catCode.equalsIgnoreCase(srcCat) && !srcKey.startsWith("_") && !specs.containsKey(srcKey)) {
                missingSpecWarnings.add("Sản phẩm '" + product.getName() + "' chưa khai báo thông số '" + srcKey + "' trong JSON specs");
            }
            if (catCode.equalsIgnoreCase(tgtCat) && !specs.containsKey(tgtKey)) {
                missingSpecWarnings.add("Sản phẩm '" + product.getName() + "' chưa khai báo thông số '" + tgtKey + "' trong JSON specs");
            }
        }

        Map<String, Object> aggregates = aggregateCalculator.calculateAggregates(contexts);

        CompatRule tempRule = CompatRule.builder()
                .ruleName(ruleDef.getRuleName())
                .sourceCategory(srcCat)
                .targetCategory(tgtCat)
                .sourceSpecKey(srcKey)
                .targetSpecKey(tgtKey)
                .operator(ruleDef.getOperator())
                .severity(ruleDef.getSeverity())
                .errorMessageTemplate(ruleDef.getErrorMessageTemplate())
                .isActive(true)
                .priority(0)
                .build();

        List<ProductItemContext> sourceItems = contexts.stream()
                .filter(ctx -> ctx.getCategoryCode().equalsIgnoreCase(srcCat))
                .toList();
        List<ProductItemContext> targetItems = contexts.stream()
                .filter(ctx -> ctx.getCategoryCode().equalsIgnoreCase(tgtCat))
                .toList();

        List<ViolationDetail> violations = ruleEvaluator.evaluateRule(tempRule, sourceItems, targetItems, aggregates);

        Object extractedSourceValue = null;
        Object extractedTargetValue = null;

        if (srcKey.startsWith("_") || RuleValidator.SYSTEM_CATEGORY.equalsIgnoreCase(srcCat)) {
            extractedSourceValue = ruleEvaluator.extractAggregateSourceValue(tempRule, aggregates);
        } else if (!sourceItems.isEmpty()) {
            extractedSourceValue = sourceItems.get(0).getSpecs().get(srcKey);
        }

        if (!targetItems.isEmpty()) {
            extractedTargetValue = targetItems.get(0).getSpecs().get(tgtKey);
        }

        String renderedMessage = null;
        if (!violations.isEmpty()) {
            renderedMessage = violations.get(0).getMessage();
        }

        double executionTimeMs = (System.nanoTime() - startTime) / 1_000_000.0;

        return DryRunResultDTO.builder()
                .isCompatible(violations.isEmpty())
                .extractedSourceValue(extractedSourceValue)
                .extractedTargetValue(extractedTargetValue)
                .renderedViolationMessage(renderedMessage)
                .violations(violations)
                .missingSpecWarnings(missingSpecWarnings)
                .executionTimeMs(Math.round(executionTimeMs * 100.0) / 100.0)
                .build();
    }

    @Transactional(readOnly = true)
    public RuleSchemaMetadataDTO getMetadataSchema() {
        List<Category> allCategories = categoryRepository.findAll();
        List<CategoryItemDTO> categories = new ArrayList<>();
        Map<String, List<SpecKeyItemDTO>> specKeysByCategory = new LinkedHashMap<>();

        // Add standard leaf categories
        for (Category cat : allCategories) {
            if (specSchemaRegistry.hasCategory(cat.getCategoryCode())) {
                categories.add(CategoryItemDTO.builder()
                        .categoryCode(cat.getCategoryCode())
                        .categoryName(cat.getCategoryName())
                        .build());

                Map<String, FieldDefinition> schemaMap = specSchemaRegistry.getSchemaAsMap(cat.getCategoryCode());
                List<SpecKeyItemDTO> specKeys = new ArrayList<>();
                schemaMap.forEach((k, def) -> specKeys.add(SpecKeyItemDTO.builder()
                        .key(def.getFieldName())
                        .label(def.getDisplayName())
                        .type(def.getType().name())
                        .required(def.isRequired())
                        .build()));
                specKeysByCategory.put(cat.getCategoryCode(), specKeys);
            }
        }

        // Add _SYSTEM special category
        categories.add(CategoryItemDTO.builder()
                .categoryCode(RuleValidator.SYSTEM_CATEGORY)
                .categoryName("Toàn hệ thống (_SYSTEM)")
                .build());
        specKeysByCategory.put(RuleValidator.SYSTEM_CATEGORY, List.of(
                SpecKeyItemDTO.builder()
                        .key("_total_tdp_w")
                        .label("Tổng TDP toàn hệ thống (W)")
                        .type("NUMBER")
                        .required(true)
                        .build()
        ));

        List<AggregateKeyItemDTO> builtinAggregates = List.of(
                AggregateKeyItemDTO.builder()
                        .key("_count")
                        .label("Số lượng khe vật lý chiếm dụng (_count)")
                        .supportedOperators(List.of(RuleOperator.LTE, RuleOperator.GTE, RuleOperator.EQUALS, RuleOperator.RANGE))
                        .build(),
                AggregateKeyItemDTO.builder()
                        .key("_sum_capacity_gb")
                        .label("Tổng dung lượng bộ nhớ GB (_sum_capacity_gb)")
                        .supportedOperators(List.of(RuleOperator.LTE, RuleOperator.GTE, RuleOperator.EQUALS, RuleOperator.RANGE))
                        .build(),
                AggregateKeyItemDTO.builder()
                        .key("_total_tdp_w")
                        .label("Tổng công suất tiêu thụ hệ thống W (_total_tdp_w)")
                        .supportedOperators(List.of(RuleOperator.LTE, RuleOperator.GTE, RuleOperator.EQUALS, RuleOperator.RANGE))
                        .build()
        );

        return RuleSchemaMetadataDTO.builder()
                .categories(categories)
                .specKeysByCategory(specKeysByCategory)
                .builtinAggregateKeys(builtinAggregates)
                .operators(Arrays.asList(RuleOperator.values()))
                .severities(Arrays.asList(RuleSeverity.values()))
                .allowedPlaceholders(new ArrayList<>(RuleValidator.ALLOWED_PLACEHOLDERS))
                .build();
    }
}
