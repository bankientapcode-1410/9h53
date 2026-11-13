package com.smartpc.modules.ruleengine.repository;

import com.smartpc.modules.ruleengine.dto.request.RuleFilterCriteria;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class CompatRuleSpecifications {

    private CompatRuleSpecifications() {
    }

    public static Specification<CompatRule> withSourceCategory(String sourceCategory) {
        return (root, query, cb) -> {
            if (sourceCategory == null || sourceCategory.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.upper(root.get("sourceCategory")), sourceCategory.trim().toUpperCase());
        };
    }

    public static Specification<CompatRule> withTargetCategory(String targetCategory) {
        return (root, query, cb) -> {
            if (targetCategory == null || targetCategory.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.upper(root.get("targetCategory")), targetCategory.trim().toUpperCase());
        };
    }

    public static Specification<CompatRule> withSeverity(RuleSeverity severity) {
        return (root, query, cb) -> {
            if (severity == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("severity"), severity);
        };
    }

    public static Specification<CompatRule> withIsActive(Boolean isActive) {
        return (root, query, cb) -> {
            if (isActive == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("isActive"), isActive);
        };
    }

    public static Specification<CompatRule> withKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(root.get("ruleName")), pattern);
            Predicate srcKeyPredicate = cb.like(cb.lower(root.get("sourceSpecKey")), pattern);
            Predicate tgtKeyPredicate = cb.like(cb.lower(root.get("targetSpecKey")), pattern);
            Predicate templatePredicate = cb.like(cb.lower(root.get("errorMessageTemplate")), pattern);
            return cb.or(namePredicate, srcKeyPredicate, tgtKeyPredicate, templatePredicate);
        };
    }

    public static Specification<CompatRule> build(RuleFilterCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null) {
                return cb.conjunction();
            }
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getSourceCategory() != null && !criteria.getSourceCategory().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("sourceCategory")), criteria.getSourceCategory().trim().toUpperCase()));
            }
            if (criteria.getTargetCategory() != null && !criteria.getTargetCategory().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("targetCategory")), criteria.getTargetCategory().trim().toUpperCase()));
            }
            if (criteria.getSeverity() != null) {
                predicates.add(cb.equal(root.get("severity"), criteria.getSeverity()));
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String pattern = "%" + criteria.getKeyword().trim().toLowerCase() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("ruleName")), pattern);
                Predicate srcPred = cb.like(cb.lower(root.get("sourceSpecKey")), pattern);
                Predicate tgtPred = cb.like(cb.lower(root.get("targetSpecKey")), pattern);
                Predicate msgPred = cb.like(cb.lower(root.get("errorMessageTemplate")), pattern);
                predicates.add(cb.or(namePred, srcPred, tgtPred, msgPred));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
