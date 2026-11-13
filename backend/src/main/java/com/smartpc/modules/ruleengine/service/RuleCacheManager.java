package com.smartpc.modules.ruleengine.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.smartpc.modules.ruleengine.config.RuleEngineConfig;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class RuleCacheManager {

    private final CompatRuleRepository ruleRepository;

    @Qualifier("ruleCaffeineCache")
    private final Cache<String, PreIndexedRuleCache> ruleCaffeineCache;

    public PreIndexedRuleCache getPreIndexedRules() {
        return ruleCaffeineCache.get(RuleEngineConfig.RULE_CACHE_KEY, k -> loadAndIndexFromDb());
    }

    public List<CompatRule> getRulesForPair(String sourceCat, String targetCat) {
        if (sourceCat == null || targetCat == null) {
            return Collections.emptyList();
        }
        return getPreIndexedRules().getRulesForPair(sourceCat.toUpperCase(), targetCat.toUpperCase());
    }

    public void evictAll() {
        log.info("Evicting all rules from in-memory Caffeine cache");
        ruleCaffeineCache.invalidateAll();
    }

    /**
     * Xóa cache sau khi transaction hiện tại commit thành công (DD-UC6 §4.5.B.3).
     * Nếu không có transaction nào đang active, xóa cache ngay lập tức.
     */
    public void evictAllAfterCommit() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evictAll();
                }
            });
        } else {
            evictAll();
        }
    }

    private PreIndexedRuleCache loadAndIndexFromDb() {
        log.info("Loading active compatibility rules from DB into in-memory cache");
        List<CompatRule> activeRules = ruleRepository.findByIsActiveTrueOrderByPriorityAscCreatedAtAsc();
        Map<String, List<CompatRule>> rulesByPair = new LinkedHashMap<>();

        for (CompatRule rule : activeRules) {
            if (rule.getSourceCategory() == null || rule.getTargetCategory() == null) continue;
            String key = rule.getSourceCategory().trim().toUpperCase() + ":" + rule.getTargetCategory().trim().toUpperCase();
            rulesByPair.computeIfAbsent(key, k -> new ArrayList<>()).add(rule);
        }

        return new PreIndexedRuleCache(rulesByPair, activeRules);
    }
}
