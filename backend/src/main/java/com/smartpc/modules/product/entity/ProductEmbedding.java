package com.smartpc.modules.product.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_embeddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductEmbedding {

    @Id
    @Column(name = "product_id", length = 36, nullable = false)
    private String productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Convert(converter = FloatListJsonConverter.class)
    @Column(name = "embedding_vector", columnDefinition = "json", nullable = false)
    @Builder.Default
    private List<Float> embeddingVector = new ArrayList<>();

    @Column(name = "embedding_model", length = 100, nullable = false)
    @Builder.Default
    private String embeddingModel = "text-embedding-004";

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "dimensions", columnDefinition = "smallint unsigned", nullable = false)
    @Builder.Default
    private Integer dimensions = 768;

    @Column(name = "content_hash", columnDefinition = "char(64)", length = 64, nullable = false)
    private String contentHash;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    @PreUpdate
    public void prePersistOrUpdate() {
        if (this.syncedAt == null) {
            this.syncedAt = LocalDateTime.now();
        }
        if (this.dimensions == null && this.embeddingVector != null) {
            this.dimensions = this.embeddingVector.size();
        }
    }
}
