package com.smartpc.modules.product.service;

import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import com.smartpc.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductSyncRecoveryJob {

    private static final Logger log = LoggerFactory.getLogger(ProductSyncRecoveryJob.class);

    private final ProductRepository productRepository;
    private final ProductVectorSyncService syncService;

    @Scheduled(fixedDelay = 600000) // 10 minutes
    public void recoverStalePending() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(10);
        List<Product> staleProducts = productRepository.findStalePending(
                ProductSyncStatus.PENDING, threshold, PageRequest.of(0, 50));

        if (!staleProducts.isEmpty()) {
            log.info("ProductSyncRecoveryJob found {} stale PENDING products, triggering async re-sync",
                    staleProducts.size());
            for (Product product : staleProducts) {
                syncService.syncProductVectorAsync(product.getProductId());
            }
        }
    }
}
