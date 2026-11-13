package com.smartpc.modules.ruleengine.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class RuleEngineConfig {

    public static final String RULE_CACHE_KEY = "ACTIVE_RULES";

    @Bean(name = "ruleCaffeineCache")
    public Cache<String, PreIndexedRuleCache> ruleCaffeineCache() {
        return Caffeine.newBuilder()
                .maximumSize(16)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build();
    }

    @Bean(name = "ruleEngineExecutor")
    public Executor ruleEngineExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("rule-eval-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
