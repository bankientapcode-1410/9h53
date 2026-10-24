import { useState, useEffect, useCallback } from 'react';
import { ProductDetailDTO } from '../types/product.types';
import { productService } from '../../../services/productService';

export function useProductDetail(productId?: string) {
  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getProductById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        setError(response.message || 'Không tìm thấy sản phẩm');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { product, isLoading, error, refetch: fetchDetail };
}
