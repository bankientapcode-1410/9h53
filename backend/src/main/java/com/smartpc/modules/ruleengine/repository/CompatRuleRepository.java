package com.smartpc.modules.ruleengine.repository;

import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompatRuleRepository extends JpaRepository<CompatRule, String>, JpaSpecificationExecutor<CompatRule> {

    List<CompatRule> findByIsActiveTrueOrderByPriorityAscCreatedAtAsc();

    List<CompatRule> findBySourceCategoryAndTargetCategoryAndIsActiveTrueOrderByPriorityAsc(
            String sourceCategory,
            String targetCategory
    );

    long countBySourceCategoryIgnoreCaseOrTargetCategoryIgnoreCase(String sourceCategory, String targetCategory);

    @Query("""
        SELECT (COUNT(r) > 0) FROM CompatRule r
        WHERE UPPER(r.sourceCategory) = UPPER(:sourceCategory)
          AND UPPER(r.targetCategory) = UPPER(:targetCategory)
          AND LOWER(r.sourceSpecKey) = LOWER(:sourceSpecKey)
          AND LOWER(r.targetSpecKey) = LOWER(:targetSpecKey)
          AND r.operator = :operator
          AND (:excludeRuleId IS NULL OR r.ruleId <> :excludeRuleId)
    """)
    boolean existsDuplicateRule(
            @Param("sourceCategory") String sourceCategory,
            @Param("targetCategory") String targetCategory,
            @Param("sourceSpecKey") String sourceSpecKey,
            @Param("targetSpecKey") String targetSpecKey,
            @Param("operator") RuleOperator operator,
            @Param("excludeRuleId") String excludeRuleId
    );
}
