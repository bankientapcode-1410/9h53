import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { productAdminService } from '../../../../services/productAdminService';

interface ManualSyncButtonProps {
  productId: string;
  onSyncComplete?: () => void;
  disabled?: boolean;
}

export const ManualSyncButton: React.FC<ManualSyncButtonProps> = ({
  productId,
  onSyncComplete,
  disabled = false,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const response = await productAdminService.triggerSyncVector(productId);
      if (response.success) {
        if (onSyncComplete) onSyncComplete();
      }
    } catch (err: any) {
      console.error('Lỗi khi kích hoạt đồng bộ vector:', err);
      alert(err?.response?.data?.message || err?.message || 'Không thể đồng bộ Vector');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleManualSync}
      disabled={isSyncing || disabled}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-smart-blue hover:border-smart-blue/40 disabled:opacity-50 transition shadow-sm active:scale-95"
      title="Đồng bộ lại Vector Embedding cho AI Semantic Search (UC1)"
    >
      <RefreshCw className={`w-3.5 h-3.5 text-smart-blue ${isSyncing ? 'animate-spin' : ''}`} />
      <span>{isSyncing ? 'Đang sync...' : 'Sync AI'}</span>
    </button>
  );
};
