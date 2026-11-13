/**
 * Intelligent Image Fallback Helper by Category Code
 * Prevents non-GPU products from falling back to generic GPU images.
 */
export const getProductImageFallback = (categoryCode?: string): string => {
  switch (categoryCode?.toUpperCase()) {
    case 'CPU':
      return 'https://tpucdn.com/cpu-specs/images/chips/2829-front.jpg';
    case 'GPU':
      return 'https://tpucdn.com/gpu-specs/images/b/11382-front.jpg';
    case 'MOTHERBOARD':
      return 'https://storage-asset.msi.com/global/picture/product/product_1664265391459c76c55d481a806150407f1b07a6bb.webp';
    case 'RAM':
      return 'https://philong.com.vn/media/product/18792-ram-corsair-vengeance-lpx-16gb-ddr4-3200mhz-philong-1.png';
    case 'SSD_M2':
      return 'https://philong.com.vn/media/product/28243-ssd-samsung-990-pro-1tb-pcie-gen4-nvme-philong-1.png';
    case 'PSU':
      return 'https://philong.com.vn/media/product/23012-nguon-corsair-cv650-650w-philong-1.png';
    case 'CASE':
      return 'https://philong.com.vn/media/product/30419-vo-case-nzxt-h5-flow-rgb-black-philong-1.png';
    case 'CPU_COOLER':
      return 'https://philong.com.vn/media/product/28734-tan-nhiet-nuoc-deepcool-lt720-black-philong-1.png';
    case 'MONITOR':
      return 'https://philong.com.vn/media/product/29424-man-hinh-lg-ultragear-24gn65r-b-philong-1.png';
    case 'KEYBOARD':
      return 'https://philong.com.vn/media/product/27170-ban-phim-co-corsair-k70-rgb-pro-cherry-mx-red-philong-1.png';
    case 'MOUSE':
      return 'https://philong.com.vn/media/product/31096-chuot-khong-day-logitech-g-pro-x-superlight-2-black-philong--1-.png';
    default:
      return 'https://tpucdn.com/gpu-specs/images/b/11382-front.jpg';
  }
};
