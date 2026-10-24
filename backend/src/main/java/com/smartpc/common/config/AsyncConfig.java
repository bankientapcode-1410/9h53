package com.smartpc.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Thread Pool dedicated to Vector Embedding synchronization (ProductVectorSyncService).
     * Requirements:
     * - corePoolSize = 2
     * - maxPoolSize = 4
     * - queueCapacity = 500
     * - RejectedExecutionHandler = DiscardPolicy (CallerRunsPolicy is strictly prohibited to protect HTTP threads)
     * Lost/rejected tasks will remain in PENDING state and be recovered by ProductSyncRecoveryJob.
     */
    @Bean(name = "vectorSyncExecutor")
    public Executor vectorSyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("vector-sync-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        executor.initialize();
        return executor;
    }
}
