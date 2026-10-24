package com.smartpc.modules.product.repository;

import com.smartpc.modules.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    Optional<Category> findByCategoryCode(String categoryCode);

    boolean existsByCategoryCode(String categoryCode);

    long countByParentCategoryCategoryId(String parentCategoryId);

    List<Category> findByParentCategoryIsNullOrderByCategoryNameAsc();

    List<Category> findAllByOrderByCategoryNameAsc();
}
