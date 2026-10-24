import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Wrench, Flame, CheckCircle, AlertTriangle } from 'lucide-react';
import { ProductSummaryDTO } from '../types/product.types';

interface ProductCardProps {
  product: ProductSummaryDTO;
  onAddToCart?: (product: ProductSummaryDTO) => void;
  onAddToBuilder?: (product: ProductSummaryDTO) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onAddToBuilder,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock) return;

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Local toast fallback
      setToastMessage('Đã thêm vào giỏ hàng!');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleAddToBuilder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToBuilder) {
      onAddToBuilder(product);
    } else {
      // Local toast fallback
      setToastMessage(`Đã thêm vào cấu hình PC Builder (${product.category_code})!`);
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  // Format individual spec key-value into a clear human-readable label with units
  const formatSpecBadge = (key: string, value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null;

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const joined = value.join(', ');
      if (key === 'supported_sockets') return `Socket ${joined}`;
      if (key === 'supported_memory_types') return `RAM ${joined}`;
      if (key === 'supported_form_factors') return `Main ${joined}`;
      return joined;
    }

    if (typeof value === 'boolean') {
      if (key === 'integrated_graphics') return value ? 'Có iGPU' : 'Không iGPU';
      return value ? `Có ${key.replace(/_/g, ' ')}` : null;
    }

    switch (key) {
      case 'socket_type':
        return `Socket ${value}`;
      case 'tdp_w':
        return `TDP ${value}W`;
      case 'rated_wattage_w':
        return `${value}W`;
      case 'recommended_psu_w':
        return `Nguồn ≥ ${value}W`;
      case 'core_count':
        return `${value} Nhân`;
      case 'thread_count':
        return `${value} Luồng`;
      case 'vram_gb':
        return `${value}GB VRAM`;
      case 'capacity_gb':
        return Number(value) >= 1000 && Number(value) % 1000 === 0
          ? `${Number(value) / 1000}TB (${value}GB)`
          : `${value}GB`;
      case 'max_ram_gb':
        return `Max ${value}GB RAM`;
      case 'bus_speed_mhz':
        return `${value}MHz`;
      case 'modules_per_kit':
        return Number(value) > 1 ? `Kit ${value} thanh` : `${value} thanh`;
      case 'ram_slots':
        return `${value} khe RAM`;
      case 'm2_slots':
        return `${value} khe M.2`;
      case 'length_mm':
        return `Dài ${value}mm`;
      case 'max_gpu_length_mm':
        return `VGA tối đa ${value}mm`;
      case 'max_cooler_height_mm':
        return `Tản tối đa ${value}mm`;
      case 'height_mm':
        return `Cao ${value}mm`;
      case 'pcie_gen':
      case 'max_pcie_gen':
        return `PCIe ${value}`;
      case 'read_speed_mbps':
        return `Đọc ${value} MB/s`;
      case 'chipset':
        return `Chipset ${value}`;
      case 'form_factor':
        return `Chuẩn ${value}`;
      case 'cooler_type': {
        const str = String(value);
        if (str === 'AIR') return 'Tản khí';
        if (str.startsWith('AIO_')) return `AIO ${str.replace('AIO_', '')}mm`;
        return str;
      }
      default: {
        // Fallback suffix-based unit detection so numbers never render without a unit
        if (key.endsWith('_gb')) return `${value}GB`;
        if (key.endsWith('_mhz')) return `${value}MHz`;
        if (key.endsWith('_w')) return `${value}W`;
        if (key.endsWith('_mm')) return `${value}mm`;
        if (key.endsWith('_mbps')) return `${value} MB/s`;
        if (typeof value === 'number') {
          const readableKey = key.replace(/_/g, ' ');
          return `${readableKey}: ${value}`;
        }
        return String(value);
      }
    }
  };

  // Format key_specs into readable tags
  const renderKeySpecs = () => {
    if (!product.key_specs) return null;
    const badges = Object.entries(product.key_specs)
      .map(([key, value]) => ({ key, label: formatSpecBadge(key, value) }))
      .filter((item): item is { key: string; label: string } => Boolean(item.label))
      .slice(0, 4);

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center content-start gap-1.5 mt-2">
        {badges.map(({ key, label }) => (
          <span
            key={key}
            className="inline-flex items-center bg-slate-100 text-slate-700 text-[11px] font-medium leading-none px-2 py-1 rounded-md border border-slate-200/80"
          >
            {label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-smart-blue/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Toast Overlay */}
      {toastMessage && (
        <div className="absolute top-2 inset-x-2 z-20 bg-smart-navy/95 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-50 p-4 flex items-center justify-center overflow-hidden border-b border-slate-100">
        <Link to={`/products/${product.product_id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 shadow-sm uppercase tracking-wider">
            {product.brand}
          </span>
          {product.benchmark_score > 0 && (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-white" />
              {product.benchmark_score} pts
            </span>
          )}
        </div>

        {/* Out of Stock Overlay / Badge */}
        {!product.in_stock && (
          <div className="absolute top-3 right-3 bg-smart-red text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            HẾT HÀNG
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
            {product.category_name}
          </div>
          <Link
            to={`/products/${product.product_id}`}
            className="block font-bold text-sm text-slate-800 hover:text-smart-blue transition line-clamp-2 mt-1 leading-snug min-h-[2.5rem]"
            title={product.name}
          >
            {product.name}
          </Link>
          {renderKeySpecs()}
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-base md:text-lg font-black text-smart-blue">
              {formatVND(product.price)}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                product.in_stock ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {product.in_stock ? 'Còn hàng' : 'Tạm hết'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition shadow-sm ${
                product.in_stock
                  ? 'bg-smart-blue hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={product.in_stock ? 'Thêm vào giỏ hàng' : 'Sản phẩm tạm thời hết hàng'}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{product.in_stock ? 'Thêm giỏ' : 'Hết hàng'}</span>
            </button>

            <button
              onClick={handleAddToBuilder}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-smart-cyan transition shadow-sm border border-slate-800 active:scale-95"
              title="Đưa vào PC Builder để kiểm tra tương thích phần cứng"
            >
              <Wrench className="w-3.5 h-3.5 text-smart-cyan" />
              <span>+ Builder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
