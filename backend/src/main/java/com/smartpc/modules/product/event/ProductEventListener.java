package com.smartpc.modules.product.event;

import com.smartpc.modules.product.service.ProductVectorSyncService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ProductEventListener {

    private static final Logger log = LoggerFactory.getLogger(ProductEventListener.class);
    private final ProductVectorSyncService syncService;

    @Async("vectorSyncExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onProductSaved(ProductSavedEvent event) {
        log.info("Received ProductSavedEvent for productId: {}, triggering async vector sync", event.getProductId());
        syncService.syncProductVectorAsync(event.getProductId());
    }
}
