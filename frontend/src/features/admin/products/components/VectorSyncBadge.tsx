import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { ProductSyncStatus } from '../../../product-catalog/types/product.types';

interface VectorSyncBadgeProps {
  status: ProductSyncStatus;
  showIcon?: boolean;
}

export const VectorSyncBadge: React.FC<VectorSyncBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'SYNCED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          <span>SYNCED</span>
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          {showIcon && <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
          <span>PENDING</span>
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          <span>FAILED</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
};
