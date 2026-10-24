package com.smartpc.modules.product.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class ProductListCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ProductListCacheManager.class);
    private static final String NS_KEY = "prodlist:ns";
    private static final Duration CACHE_TTL = Duration.ofSeconds(120);

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Fallback in-memory storage if Redis is unavailable
    private final AtomicLong inMemoryNamespace = new AtomicLong(1);
    private final Map<String, CacheEntry> inMemoryCache = new ConcurrentHashMap<>();

    private record CacheEntry(String json, long expireAt) {}

    public Optional<PageResponse<ProductSummaryDTO>> get(ProductFilterCriteria criteria) {
        if (criteria == null || (criteria.getPage() != null && criteria.getPage() > 0)) {
            return Optional.empty();
        }

        try {
            long ns = currentNamespaceVersion();
            String key = buildCacheKey(ns, criteria);

            if (redisTemplate != null) {
                String json = redisTemplate.opsForValue().get(key);
                if (json != null) {
                    PageResponse<ProductSummaryDTO> res = objectMapper.readValue(
                            json, new TypeReference<PageResponse<ProductSummaryDTO>>() {});
                    return Optional.ofNullable(res);
                }
            } else {
                CacheEntry entry = inMemoryCache.get(key);
                if (entry != null) {
                    if (System.currentTimeMillis() <= entry.expireAt()) {
                        PageResponse<ProductSummaryDTO> res = objectMapper.readValue(
                                entry.json(), new TypeReference<PageResponse<ProductSummaryDTO>>() {});
                        return Optional.ofNullable(res);
                    } else {
                        inMemoryCache.remove(key);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error reading from product list cache: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void put(ProductFilterCriteria criteria, PageResponse<ProductSummaryDTO> response) {
        if (criteria == null || response == null || (criteria.getPage() != null && criteria.getPage() > 0)) {
            return;
        }

        try {
            long ns = currentNamespaceVersion();
            String key = buildCacheKey(ns, criteria);
            String json = objectMapper.writeValueAsString(response);

            if (redisTemplate != null) {
                redisTemplate.opsForValue().set(key, json, CACHE_TTL);
            } else {
                inMemoryCache.put(key, new CacheEntry(json, System.currentTimeMillis() + CACHE_TTL.toMillis()));
            }
        } catch (Exception e) {
            log.warn("Error writing to product list cache: {}", e.getMessage());
        }
    }

    public void evictAll() {
        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().increment(NS_KEY);
            } else {
                inMemoryNamespace.incrementAndGet();
                inMemoryCache.clear();
            }
            log.info("Product list cache evicted successfully (namespace version incremented).");
        } catch (Exception e) {
            log.warn("Error evicting product list cache: {}", e.getMessage());
            inMemoryNamespace.incrementAndGet();
            inMemoryCache.clear();
        }
    }

    public long currentNamespaceVersion() {
        try {
            if (redisTemplate != null) {
                String val = redisTemplate.opsForValue().get(NS_KEY);
                if (val == null) {
                    redisTemplate.opsForValue().set(NS_KEY, "1");
                    return 1L;
                }
                return Long.parseLong(val);
            }
        } catch (Exception e) {
            log.warn("Redis namespace check failed, falling back to in-memory: {}", e.getMessage());
        }
        return inMemoryNamespace.get();
    }

    private String buildCacheKey(long ns, ProductFilterCriteria criteria) {
        StringBuilder sb = new StringBuilder();
        sb.append("cat=").append(criteria.getCategory() != null ? criteria.getCategory().trim().toUpperCase() : "").append("&");

        if (criteria.getBrand() != null && !criteria.getBrand().isEmpty()) {
            List<String> sortedBrands = new ArrayList<>(criteria.getBrand().stream()
                    .filter(Objects::nonNull)
                    .map(b -> b.trim().toUpperCase())
                    .toList());
            Collections.sort(sortedBrands);
            sb.append("brands=").append(String.join(",", sortedBrands)).append("&");
        }

        sb.append("minPrice=").append(criteria.getMinPrice()).append("&");
        sb.append("maxPrice=").append(criteria.getMaxPrice()).append("&");

        if (criteria.getSpecs() != null && !criteria.getSpecs().isEmpty()) {
            Map<String, String> sortedSpecs = new TreeMap<>(criteria.getSpecs());
            sortedSpecs.forEach((k, v) -> sb.append(k).append("=").append(v).append("&"));
        }

        sb.append("sort=").append(criteria.getSort() != null ? criteria.getSort().trim().toLowerCase() : "newest").append("&");
        sb.append("size=").append(criteria.getSize() != null ? criteria.getSize() : 12);

        String canonical = sb.toString();
        String hash = sha1(canonical);
        return "prodlist:v" + ns + ":" + hash;
    }

    private String sha1(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
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
}
