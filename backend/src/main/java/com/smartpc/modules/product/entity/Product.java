package com.smartpc.modules.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "brand", length = 100, nullable = false)
    private String brand;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Convert(converter = SpecsJsonConverter.class)
    @Column(name = "specs", columnDefinition = "json", nullable = false)
    @Builder.Default
    private Map<String, Object> specs = new LinkedHashMap<>();

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "gallery_urls", columnDefinition = "json")
    @Builder.Default
    private List<String> galleryUrls = new ArrayList<>();

    @Column(name = "price", nullable = false)
    @Builder.Default
    private Integer price = 0;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "benchmark_score", nullable = false)
    @Builder.Default
    private Double benchmarkScore = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private ProductSyncStatus syncStatus = ProductSyncStatus.PENDING;

    @Column(name = "sync_requested_at")
    private LocalDateTime syncRequestedAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Generated Virtual Columns (MySQL 8.0)
    @Column(name = "v_socket_type", insertable = false, updatable = false)
    private String vSocketType;

    @Column(name = "v_form_factor", insertable = false, updatable = false)
    private String vFormFactor;

    @Column(name = "v_memory_type", insertable = false, updatable = false)
    private String vMemoryType;

    @Column(name = "v_vram_gb", insertable = false, updatable = false)
    private Integer vVramGb;

    @PrePersist
    public void prePersist() {
        if (this.productId == null || this.productId.isBlank()) {
            this.productId = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.syncRequestedAt == null) {
            this.syncRequestedAt = LocalDateTime.now();
        }
        if (this.version == null) {
            this.version = 0L;
        }
        if (this.price == null) {
            this.price = 0;
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        if (this.benchmarkScore == null) {
            this.benchmarkScore = 0.0;
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.syncStatus == null) {
            this.syncStatus = ProductSyncStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
