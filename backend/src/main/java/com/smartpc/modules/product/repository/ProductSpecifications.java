package com.smartpc.modules.product.repository;

import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.entity.Product;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class ProductSpecifications {

    private ProductSpecifications() {}

    public static Specification<Product> of(ProductFilterCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria == null) {
                predicates.add(cb.isTrue(root.get("isActive")));
                predicates.add(cb.isNull(root.get("deletedAt")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // 1. Soft delete filter
            if (criteria.getIncludeDeleted() == null || !criteria.getIncludeDeleted()) {
                predicates.add(cb.isNull(root.get("deletedAt")));
            }

            // 2. Active status filter
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            } else if (criteria.getIncludeDeleted() == null || !criteria.getIncludeDeleted()) {
                predicates.add(cb.isTrue(root.get("isActive")));
            }

            // 3. Category code filter
            if (criteria.getCategory() != null && !criteria.getCategory().isBlank()) {
                predicates.add(cb.equal(
                        cb.upper(root.get("category").get("categoryCode")),
                        criteria.getCategory().trim().toUpperCase()
                ));
            }

            // 4. Brand filter (OR within brands)
            if (criteria.getBrand() != null && !criteria.getBrand().isEmpty()) {
                List<String> upperBrands = criteria.getBrand().stream()
                        .filter(b -> b != null && !b.isBlank())
                        .map(b -> b.trim().toUpperCase())
                        .toList();
                if (!upperBrands.isEmpty()) {
                    predicates.add(cb.upper(root.get("brand")).in(upperBrands));
                }
            }

            // 5. Price range
            if (criteria.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), criteria.getMinPrice()));
            }
            if (criteria.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), criteria.getMaxPrice()));
            }

            // 6. Admin sync status filter
            if (criteria.getSyncStatus() != null) {
                predicates.add(cb.equal(root.get("syncStatus"), criteria.getSyncStatus()));
            }

            // 7. Dynamic specs filters
            if (criteria.getSpecs() != null && !criteria.getSpecs().isEmpty()) {
                for (Map.Entry<String, String> entry : criteria.getSpecs().entrySet()) {
                    String key = entry.getKey();
                    String rawValue = entry.getValue();
                    if (rawValue == null || rawValue.isBlank()) {
                        continue;
                    }

                    List<String> values = Arrays.stream(rawValue.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .toList();

                    if (values.isEmpty()) {
                        continue;
                    }

                    // Virtual columns mapping for high performance indexing
                    switch (key) {
                        case "socket_type" -> {
                            predicates.add(buildInOrEqualPredicate(root.get("vSocketType"), values, cb));
                        }
                        case "form_factor" -> {
                            predicates.add(buildInOrEqualPredicate(root.get("vFormFactor"), values, cb));
                        }
                        case "memory_type" -> {
                            predicates.add(buildInOrEqualPredicate(root.get("vMemoryType"), values, cb));
                        }
                        case "vram_gb" -> {
                            List<Integer> intValues = values.stream().map(Integer::parseInt).toList();
                            predicates.add(root.get("vVramGb").in(intValues));
                        }
                        case "supported_sockets" -> {
                            // Multi-valued array: JSON_CONTAINS(specs->'$.supported_sockets', '"LGA1700"')
                            List<Predicate> socketPredicates = new ArrayList<>();
                            for (String v : values) {
                                socketPredicates.add(cb.isTrue(cb.function(
                                        "JSON_CONTAINS",
                                        Boolean.class,
                                        cb.function("JSON_EXTRACT", String.class, root.get("specs"), cb.literal("$.supported_sockets")),
                                        cb.literal("\"" + v + "\"")
                                )));
                            }
                            predicates.add(cb.or(socketPredicates.toArray(new Predicate[0])));
                        }
                        default -> {
                            // General filterable spec key via JSON_UNQUOTE(JSON_EXTRACT(specs, '$.key'))
                            List<Predicate> orPredicates = new ArrayList<>();
                            for (String v : values) {
                                orPredicates.add(cb.equal(
                                        cb.function(
                                                "JSON_UNQUOTE",
                                                String.class,
                                                cb.function("JSON_EXTRACT", String.class, root.get("specs"), cb.literal("$." + key))
                                        ),
                                        v
                                ));
                            }
                            predicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
                        }
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate buildInOrEqualPredicate(Path<String> path, List<String> values, jakarta.persistence.criteria.CriteriaBuilder cb) {
        if (values.size() == 1) {
            return cb.equal(path, values.get(0));
        } else {
            return path.in(values);
        }
    }
}
