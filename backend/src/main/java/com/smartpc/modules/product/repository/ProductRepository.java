package com.smartpc.modules.product.repository;

import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.syncStatus = :status, p.syncRequestedAt = :time WHERE p.productId = :id")
    int updateSyncStatus(@Param("id") String id,
                         @Param("status") ProductSyncStatus status,
                         @Param("time") LocalDateTime time);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :qty, p.version = p.version + 1 " +
           "WHERE p.productId = :id AND p.stockQuantity >= :qty AND p.isActive = true AND p.deletedAt IS NULL")
    int decreaseStock(@Param("id") String id, @Param("qty") int qty);

    @Query("SELECT p FROM Product p WHERE p.syncStatus = :status AND p.syncRequestedAt < :time AND p.deletedAt IS NULL")
    List<Product> findStalePending(@Param("status") ProductSyncStatus status,
                                   @Param("time") LocalDateTime time,
                                   Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.categoryId = :categoryId")
    long countByCategoryId(@Param("categoryId") String categoryId);

    @Query(value = "SELECT COUNT(*) FROM compat_rules WHERE source_category = :code OR target_category = :code", nativeQuery = true)
    long countCompatRulesByCode(@Param("code") String code);

    @Modifying(clearAutomatically = true)
    @Query(value = "DELETE FROM cart_items WHERE product_id = :productId", nativeQuery = true)
    int deleteCartItemsByProductId(@Param("productId") String productId);
}
