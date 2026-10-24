package com.smartpc.modules.product.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.cache.ProductListCacheManager;
import com.smartpc.modules.product.dto.request.CreateProductRequest;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.dto.request.UpdateProductRequest;
import com.smartpc.modules.product.dto.response.AdminProductDTO;
import com.smartpc.modules.product.dto.response.BatchRejectedItem;
import com.smartpc.modules.product.dto.response.BatchSyncAcceptedDTO;
import com.smartpc.modules.product.dto.response.VectorSyncResultDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import com.smartpc.modules.product.event.ProductSavedEvent;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductEmbeddingRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.repository.ProductSpecifications;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.validator.SpecSchemaValidator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductAdminService {

    private static final Logger log = LoggerFactory.getLogger(ProductAdminService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductEmbeddingRepository embeddingRepository;
    private final SpecSchemaValidator specValidator;
    private final ProductMapper productMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final ProductVectorSyncService syncService;
    private final ProductListCacheManager listCache;
    private final CategorySpecSchemaRegistry schemaRegistry;

    @Transactional(readOnly = true)
    public PageResponse<AdminProductDTO> getAdminProducts(ProductFilterCriteria criteria, Pageable pageable) {
        if (criteria == null) {
            criteria = new ProductFilterCriteria();
        }

        int pageNum = pageable != null ? pageable.getPageNumber() : 0;
        int pageSize = pageable != null ? pageable.getSize() : 20;

        Sort sort = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        PageRequest pageRequest = PageRequest.of(pageNum, pageSize, sort);

        Page<Product> page = productRepository.findAll(ProductSpecifications.of(criteria), pageRequest);
        return PageResponse.from(page, productMapper::toAdminDto);
    }

    @Transactional
    public AdminProductDTO createProduct(CreateProductRequest request) {
        String categoryCode = request.getCategoryCode().trim().toUpperCase();
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Không tìm thấy danh mục với mã: " + categoryCode));

        if (!schemaRegistry.hasCategory(categoryCode)) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_NOT_LEAF,
                    "Danh mục " + categoryCode + " không phải danh mục lá hoặc chưa có schema thông số kỹ thuật");
        }

        Map<String, Object> normalizedSpecs = specValidator.validateSpecs(categoryCode, request.getSpecs());

        Product product = Product.builder()
                .name(request.getName().trim())
                .brand(request.getBrand().trim().toUpperCase())
                .category(category)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .galleryUrls(request.getGalleryUrls() != null ? request.getGalleryUrls() : new ArrayList<>())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .benchmarkScore(request.getBenchmarkScore() != null ? request.getBenchmarkScore() : 0.0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .specs(normalizedSpecs)
                .syncStatus(ProductSyncStatus.PENDING)
                .syncRequestedAt(LocalDateTime.now())
                .version(0L)
                .build();

        Product saved = productRepository.save(product);

        eventPublisher.publishEvent(new ProductSavedEvent(saved.getProductId()));
        listCache.evictAll();

        return productMapper.toAdminDto(saved);
    }

    @Transactional
    public AdminProductDTO updateProduct(String productId, UpdateProductRequest request) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND,
                        "Không tìm thấy sản phẩm với ID: " + productId));

        if (existing.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND, "Sản phẩm đã bị xóa");
        }

        // Optimistic locking verification
        if (!Objects.equals(existing.getVersion(), request.getVersion())) {
            throw new BusinessException(ErrorCode.PROD_CONCURRENT_MODIFICATION,
                    "Sản phẩm đã được người khác cập nhật. Vui lòng tải lại dữ liệu mới nhất.");
        }

        String categoryCode = request.getCategoryCode().trim().toUpperCase();
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Không tìm thấy danh mục với mã: " + categoryCode));

        if (!schemaRegistry.hasCategory(categoryCode)) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_NOT_LEAF,
                    "Danh mục " + categoryCode + " không phải danh mục lá hoặc chưa có schema thông số kỹ thuật");
        }

        Map<String, Object> normalizedSpecs = specValidator.validateSpecs(categoryCode, request.getSpecs());
        boolean semanticChange = isSemanticChange(existing, request, normalizedSpecs);

        existing.setName(request.getName().trim());
        existing.setBrand(request.getBrand().trim().toUpperCase());
        existing.setCategory(category);
        existing.setDescription(request.getDescription());
        existing.setImageUrl(request.getImageUrl());
        existing.setGalleryUrls(request.getGalleryUrls() != null ? request.getGalleryUrls() : new ArrayList<>());
        existing.setPrice(request.getPrice());
        existing.setStockQuantity(request.getStockQuantity());
        existing.setBenchmarkScore(request.getBenchmarkScore() != null ? request.getBenchmarkScore() : 0.0);
        if (request.getIsActive() != null) {
            existing.setIsActive(request.getIsActive());
        }
        existing.setSpecs(normalizedSpecs);

        if (semanticChange) {
            existing.setSyncStatus(ProductSyncStatus.PENDING);
            existing.setSyncRequestedAt(LocalDateTime.now());
            eventPublisher.publishEvent(new ProductSavedEvent(existing.getProductId()));
        }

        Product saved = productRepository.save(existing);
        listCache.evictAll();

        return productMapper.toAdminDto(saved);
    }

    @Transactional
    public void updateStatus(String productId, boolean isActive) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND,
                        "Không tìm thấy sản phẩm với ID: " + productId));

        if (existing.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND, "Sản phẩm đã bị xóa");
        }

        existing.setIsActive(isActive);
        productRepository.save(existing);
        listCache.evictAll();
    }

    @Transactional
    public void softDeleteProduct(String productId) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND,
                        "Không tìm thấy sản phẩm với ID: " + productId));

        if (existing.getDeletedAt() != null) {
            return;
        }

        existing.setDeletedAt(LocalDateTime.now());
        existing.setIsActive(false);
        productRepository.save(existing);

        // Remove embedding and cart items
        embeddingRepository.deleteById(productId);
        try {
            productRepository.deleteCartItemsByProductId(productId);
        } catch (Exception e) {
            log.warn("Error cleaning up cart items for soft-deleted product: {}", productId, e);
        }

        listCache.evictAll();
    }

    @Transactional
    public VectorSyncResultDTO triggerManualSync(String productId) {
        Product existing = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND,
                        "Không tìm thấy sản phẩm với ID: " + productId));

        if (existing.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND, "Sản phẩm đã bị xóa");
        }

        if (existing.getSyncStatus() == ProductSyncStatus.PENDING
                && existing.getSyncRequestedAt() != null
                && existing.getSyncRequestedAt().isAfter(LocalDateTime.now().minusMinutes(2))) {
            throw new BusinessException(ErrorCode.PROD_SYNC_IN_PROGRESS,
                    "Sản phẩm đang trong quá trình đồng bộ vector, vui lòng thử lại sau ít phút");
        }

        productRepository.updateSyncStatus(productId, ProductSyncStatus.PENDING, LocalDateTime.now());
        return syncService.syncProductVector(productId);
    }

    @Transactional
    public BatchSyncAcceptedDTO triggerBatchSync(List<String> productIds) {
        if (productIds == null || productIds.isEmpty() || productIds.size() > 100) {
            throw new BusinessException(ErrorCode.PROD_BATCH_TOO_LARGE,
                    "Số lượng sản phẩm yêu cầu đồng bộ phải từ 1 đến 100");
        }

        String jobId = UUID.randomUUID().toString();
        List<String> accepted = new ArrayList<>();
        List<BatchRejectedItem> rejected = new ArrayList<>();

        for (String pid : productIds) {
            Optional<Product> pOpt = productRepository.findById(pid);
            if (pOpt.isEmpty() || pOpt.get().getDeletedAt() != null) {
                rejected.add(new BatchRejectedItem(pid, ErrorCode.PROD_NOT_FOUND.getCode()));
            } else if (pOpt.get().getSyncStatus() == ProductSyncStatus.PENDING
                    && pOpt.get().getSyncRequestedAt() != null
                    && pOpt.get().getSyncRequestedAt().isAfter(LocalDateTime.now().minusMinutes(2))) {
                rejected.add(new BatchRejectedItem(pid, ErrorCode.PROD_SYNC_IN_PROGRESS.getCode()));
            } else {
                accepted.add(pid);
                productRepository.updateSyncStatus(pid, ProductSyncStatus.PENDING, LocalDateTime.now());
            }
        }

        if (!accepted.isEmpty()) {
            syncService.processBatchSyncAsync(jobId, accepted);
        }

        return BatchSyncAcceptedDTO.builder()
                .jobId(jobId)
                .accepted(accepted.size())
                .rejected(rejected)
                .build();
    }

    boolean isSemanticChange(Product before, UpdateProductRequest req, Map<String, Object> newNormalizedSpecs) {
        if (!before.getName().equals(req.getName().trim())) {
            return true;
        }
        if (!before.getBrand().equalsIgnoreCase(req.getBrand().trim())) {
            return true;
        }
        String oldCatCode = before.getCategory() != null ? before.getCategory().getCategoryCode() : "";
        if (!oldCatCode.equalsIgnoreCase(req.getCategoryCode().trim())) {
            return true;
        }
        String oldDesc = before.getDescription() != null ? before.getDescription().strip() : "";
        String newDesc = req.getDescription() != null ? req.getDescription().strip() : "";
        if (!oldDesc.equals(newDesc)) {
            return true;
        }
        Map<String, Object> oldSpecs = before.getSpecs() != null ? before.getSpecs() : Collections.emptyMap();
        return !oldSpecs.equals(newNormalizedSpecs);
    }
}
