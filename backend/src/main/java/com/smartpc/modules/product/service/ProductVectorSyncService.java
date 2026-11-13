package com.smartpc.modules.product.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.dto.response.VectorSyncResultDTO;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.entity.ProductEmbedding;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import com.smartpc.modules.product.repository.ProductEmbeddingRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ProductVectorSyncService {

    private static final Logger log = LoggerFactory.getLogger(ProductVectorSyncService.class);
    private static final String EMBEDDING_MODEL_NAME = "text-embedding-004";
    private static final int TARGET_DIMENSIONS = 768;

    @Autowired(required = false)
    private EmbeddingModel embeddingModel;

    private final ProductRepository productRepository;
    private final ProductEmbeddingRepository embeddingRepository;
    private final CategorySpecSchemaRegistry schemaRegistry;

    public ProductVectorSyncService(ProductRepository productRepository,
                                  ProductEmbeddingRepository embeddingRepository,
                                  CategorySpecSchemaRegistry schemaRegistry) {
        this.productRepository = productRepository;
        this.embeddingRepository = embeddingRepository;
        this.schemaRegistry = schemaRegistry;
    }

    public String buildEmbeddingContent(Product p) {
        StringBuilder sb = new StringBuilder();
        sb.append("Linh kiện máy tính: ").append(p.getName()).append('\n');
        sb.append("Thương hiệu: ").append(p.getBrand()).append('\n');
        if (p.getCategory() != null) {
            sb.append("Danh mục: ").append(p.getCategory().getCategoryName()).append('\n');
        }
        sb.append("Thông số kỹ thuật: ");

        String categoryCode = p.getCategory() != null ? p.getCategory().getCategoryCode() : "";
        Map<String, FieldDefinition> defs = schemaRegistry.getSchemaAsMap(categoryCode);

        if (p.getSpecs() != null) {
            new TreeMap<>(p.getSpecs()).forEach((key, val) -> {
                FieldDefinition def = defs.get(key);
                String label = (def != null) ? def.getLabel() : key;
                String unit = (def != null && def.getUnit() != null) ? " " + def.getUnit() : "";
                String value = (val instanceof Collection<?> c)
                        ? String.join(", ", c.stream().map(String::valueOf).toList())
                        : String.valueOf(val);
                sb.append(label).append(": ").append(value).append(unit).append("; ");
            });
        }

        if (p.getDescription() != null && !p.getDescription().isBlank()) {
            sb.append("\nMô tả: ").append(p.getDescription().strip());
        }
        return sb.toString();
    }

    public String computeContentHash(String content) {
        String input = EMBEDDING_MODEL_NAME + "|" + content;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public VectorSyncResultDTO syncProductVector(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND, "Không tìm thấy sản phẩm"));

        if (product.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND, "Sản phẩm đã bị xóa");
        }

        String content = buildEmbeddingContent(product);
        String hash = computeContentHash(content);

        // Check if content hash matches existing embedding
        Optional<ProductEmbedding> existingOpt = embeddingRepository.findById(productId);
        if (existingOpt.isPresent() && hash.equals(existingOpt.get().getContentHash())) {
            log.info("Content hash unchanged for productId: {}. Updating sync_status to SYNCED", productId);
            productRepository.updateSyncStatus(productId, ProductSyncStatus.SYNCED, LocalDateTime.now());
            return VectorSyncResultDTO.builder()
                    .productId(productId)
                    .syncStatus(ProductSyncStatus.SYNCED)
                    .embeddingModel(EMBEDDING_MODEL_NAME)
                    .vectorDimensions(existingOpt.get().getDimensions())
                    .syncedAt(existingOpt.get().getSyncedAt())
                    .build();
        }

        // Generate embedding vector
        List<Float> vector;
        try {
            if (embeddingModel != null) {
                float[] response = embeddingModel.embed(content);
                vector = new ArrayList<>(response.length);
                for (float f : response) {
                    vector.add(f);
                }
            } else {
                vector = generateMockVector(hash, TARGET_DIMENSIONS);
            }
        } catch (Exception ex) {
            log.warn("AI Embedding generation failed for productId: {}: {}", productId, ex.getMessage());
            productRepository.updateSyncStatus(productId, ProductSyncStatus.FAILED, LocalDateTime.now());
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            if (msg.contains("timeout") || msg.contains("Timeout") || ex instanceof java.util.concurrent.TimeoutException) {
                throw new BusinessException(ErrorCode.PROD_AI_GATEWAY_TIMEOUT, "Dịch vụ AI Embedding phản hồi quá chậm");
            }
            throw new BusinessException(ErrorCode.PROD_AI_GATEWAY_ERROR, "Không thể kết nối đến dịch vụ AI Embedding: " + msg);
        }

        if (vector.size() != TARGET_DIMENSIONS) {
            log.error("AI Embedding returned invalid dimensions for productId {}: expected {}, got {}",
                    productId, TARGET_DIMENSIONS, vector.size());
            productRepository.updateSyncStatus(productId, ProductSyncStatus.FAILED, LocalDateTime.now());
            throw new BusinessException(ErrorCode.PROD_AI_GATEWAY_ERROR,
                    "Kích thước vector không hợp lệ (yêu cầu " + TARGET_DIMENSIONS + " chiều)");
        }

        // Re-read product to guard against concurrent modification during AI generation
        Product currentProduct = productRepository.findById(productId).orElse(null);
        if (currentProduct != null && currentProduct.getDeletedAt() == null) {
            String currentHash = computeContentHash(buildEmbeddingContent(currentProduct));
            if (hash.equals(currentHash)) {
                ProductEmbedding embedding = ProductEmbedding.builder()
                        .productId(productId)
                        .product(currentProduct)
                        .embeddingVector(vector)
                        .embeddingModel(EMBEDDING_MODEL_NAME)
                        .dimensions(TARGET_DIMENSIONS)
                        .contentHash(hash)
                        .syncedAt(LocalDateTime.now())
                        .build();
                embeddingRepository.save(embedding);
                productRepository.updateSyncStatus(productId, ProductSyncStatus.SYNCED, LocalDateTime.now());

                return VectorSyncResultDTO.builder()
                        .productId(productId)
                        .syncStatus(ProductSyncStatus.SYNCED)
                        .embeddingModel(EMBEDDING_MODEL_NAME)
                        .vectorDimensions(TARGET_DIMENSIONS)
                        .syncedAt(embedding.getSyncedAt())
                        .build();
            } else {
                log.info("Product {} changed concurrently while generating embedding; discarding obsolete vector", productId);
            }
        }

        return VectorSyncResultDTO.builder()
                .productId(productId)
                .syncStatus(ProductSyncStatus.PENDING)
                .embeddingModel(EMBEDDING_MODEL_NAME)
                .vectorDimensions(TARGET_DIMENSIONS)
                .syncedAt(LocalDateTime.now())
                .build();
    }

    @Async("vectorSyncExecutor")
    public void syncProductVectorAsync(String productId) {
        try {
            syncProductVector(productId);
        } catch (Exception e) {
            log.warn("Async vector sync encountered error for productId: {}: {}", productId, e.getMessage());
        }
    }

    @Async("vectorSyncExecutor")
    public void processBatchSyncAsync(String jobId, List<String> productIds) {
        log.info("Starting batch vector sync job: {} with {} products", jobId, productIds.size());

        int batchSize = 10;
        for (int i = 0; i < productIds.size(); i += batchSize) {
            int end = Math.min(i + batchSize, productIds.size());
            List<String> chunk = productIds.subList(i, end);

            boolean quotaExceeded = false;
            for (String pid : chunk) {
                try {
                    syncProductVector(pid);
                } catch (BusinessException be) {
                    if (ErrorCode.PROD_AI_GATEWAY_ERROR.getCode().equals(be.getErrorCode())
                            && be.getMessage() != null && be.getMessage().contains("429")) {
                        quotaExceeded = true;
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Error syncing product {} in batch {}: {}", pid, jobId, e.getMessage());
                }
            }

            if (quotaExceeded) {
                log.warn("AI Quota (429) hit during batch sync {}. Marking remaining products as FAILED", jobId);
                for (int j = i; j < productIds.size(); j++) {
                    productRepository.updateSyncStatus(productIds.get(j), ProductSyncStatus.FAILED, LocalDateTime.now());
                }
                break;
            }

            if (end < productIds.size()) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        log.info("Finished batch vector sync job: {}", jobId);
    }

    private List<Float> generateMockVector(String seed, int dimensions) {
        long s = seed.hashCode();
        Random random = new Random(s);
        List<Float> vector = new ArrayList<>(dimensions);
        for (int i = 0; i < dimensions; i++) {
            vector.add((float) random.nextGaussian());
        }
        return vector;
    }
}
