package com.smartpc.modules.ruleengine;

import com.github.benmanes.caffeine.cache.Cache;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RuleCacheManagerTest {

    @Mock
    private CompatRuleRepository ruleRepository;

    @Mock
    private Cache<String, PreIndexedRuleCache> caffeineCache;

    @Test
    @DisplayName("TC-RE-17: evictAllAfterCommit xóa cache ngay khi không có transaction active")
    void testEvictAllWithoutTransaction() {
        RuleCacheManager cacheManager = new RuleCacheManager(ruleRepository, caffeineCache);

        cacheManager.evictAllAfterCommit();
        verify(caffeineCache, times(1)).invalidateAll();
    }

    @Test
    @DisplayName("TC-RE-17b: evictAllAfterCommit đăng ký TransactionSynchronization và chỉ xóa cache sau commit")
    void testEvictAllWithActiveTransaction() {
        RuleCacheManager cacheManager = new RuleCacheManager(ruleRepository, caffeineCache);

        TransactionSynchronizationManager.initSynchronization();
        try {
            cacheManager.evictAllAfterCommit();
            // Cache must NOT be evicted before commit
            verify(caffeineCache, never()).invalidateAll();

            // Simulate transaction commit
            TransactionSynchronizationUtils.triggerAfterCommit();

            // Now cache must be evicted!
            verify(caffeineCache, times(1)).invalidateAll();
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
