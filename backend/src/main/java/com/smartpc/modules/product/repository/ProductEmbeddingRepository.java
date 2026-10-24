package com.smartpc.modules.product.repository;

import com.smartpc.modules.product.entity.ProductEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductEmbeddingRepository extends JpaRepository<ProductEmbedding, String> {

    void deleteByProductId(String productId);
}
