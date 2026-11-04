import React, { useState, useEffect } from 'react';
import { CreateCompatRuleRequest, DryRunResult } from '../types/rule.types';
import { ruleAdminService } from '../../../../services/ruleAdminService';
import { productAdminService } from '../../../../services/productAdminService';
import { AdminProductDTO } from '../../../product-catalog/types/product.types';
import { Play, CheckCircle2, AlertTriangle, AlertCircle, Clock, Trash2 } from 'lucide-react';

interface Props {
  ruleDefinition: CreateCompatRuleRequest;
}

export const DryRunSandboxPanel: React.FC<Props> = ({ ruleDefinition }) => {
  const [availableProducts, setAvailableProducts] = useState<AdminProductDTO[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [running, setRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load sample products when source or target categories change
  useEffect(() => {
    let mounted = true;
    const fetchSampleProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productAdminService.getAdminProducts({ size: 100 });
        if (mounted && res?.data?.content) {
          setAvailableProducts(res.data.content);

          // Auto-select 1 source item and 1 target item as default samples
          const srcCat = ruleDefinition.source_category?.toUpperCase();
          const tgtCat = ruleDefinition.target_category?.toUpperCase();

          const initialSelected: Array<{ product_id: string; quantity: number }> = [];
          if (srcCat && srcCat !== '_SYSTEM') {
            const srcProd = res.data.content.find(
              (p: AdminProductDTO) => p.category?.category_code?.toUpperCase() === srcCat
            );
            if (srcProd) initialSelected.push({ product_id: srcProd.product_id, quantity: 1 });
          }
          if (tgtCat) {
            const tgtProd = res.data.content.find(
              (p: AdminProductDTO) => p.category?.category_code?.toUpperCase() === tgtCat
            );
            if (tgtProd) initialSelected.push({ product_id: tgtProd.product_id, quantity: 1 });
          }
          setSelectedItems(initialSelected);
        }
      } catch (err) {
        console.warn('Failed to load sample products for sandbox:', err);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };

    fetchSampleProducts();
    return () => {
      mounted = false;
    };
  }, [ruleDefinition.source_category, ruleDefinition.target_category]);

  const handleAddItem = (productId: string) => {
    if (!productId) return;
    if (selectedItems.some((item) => item.product_id === productId)) return;
    setSelectedItems([...selectedItems, { product_id: productId, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, quantity);
    setSelectedItems(updated);
  };

  const handleRunDryRun = async () => {
    setErrorMsg(null);
    if (selectedItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một linh kiện mẫu để chạy thử.');
      return;
    }
    setRunning(true);
    try {
      const res = await ruleAdminService.dryRun({
        rule_definition: ruleDefinition,
        test_items: selectedItems,
      });
      setDryRunResult(res.data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Chạy thử thất bại');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          Khu Vực Chạy Thử (Dry-Run Sandbox)
        </div>
        <span className="text-[11px] text-slate-400">
          {loadingProducts ? 'Đang tải kho linh kiện...' : 'Kiểm tra kết quả trước khi lưu DB'}
        </span>
      </div>

      {/* Selected Products list */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-600">
          Linh kiện mẫu trong cấu hình test ({selectedItems.length}):
        </label>

        {selectedItems.map((item, idx) => {
          const product = availableProducts.find((p) => p.product_id === item.product_id);
          return (
            <div
              key={item.product_id}
              className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">
                  {product ? product.name : item.product_id}
                </div>
                <div className="text-[11px] text-slate-400">
                  {product?.category?.category_name} ({product?.category?.category_code})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">SL:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add more products dropdown */}
        <div className="flex gap-2 pt-1">
          <select
            defaultValue=""
            onChange={(e) => {
              handleAddItem(e.target.value);
              e.target.value = '';
            }}
            className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">+ Thêm linh kiện mẫu khác vào cấu hình test...</option>
            {availableProducts.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                [{p.category?.category_code}] {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trigger button */}
      <div>
        <button
          type="button"
          disabled={running || selectedItems.length === 0}
          onClick={handleRunDryRun}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {running ? (
            <>
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Đang chạy thử...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Chạy Thử Quy Tắc (Test Rule)
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Dry-run Result Box */}
      {dryRunResult && (
        <div
          className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
            dryRunResult.is_compatible
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-red-50/70 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {dryRunResult.is_compatible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  KẾT QUẢ: PASS (Tương thích)
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  KẾT QUẢ: FAIL (Vi phạm quy tắc)
                </>
              )}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3 h-3" />
              {dryRunResult.execution_time_ms}ms
            </div>
          </div>

          {/* Extracted values */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2 rounded-lg border border-slate-200/60 font-mono">
            <div>
              <span className="text-slate-500 font-sans block">Giá trị Nguồn trích xuất:</span>
              <span className="font-bold text-smart-blue">
                {dryRunResult.extracted_source_value !== null
                  ? String(dryRunResult.extracted_source_value)
                  : '(Không có / Thiếu spec)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block">Giá trị Đích trích xuất:</span>
              <span className="font-bold text-emerald-700">
                {dryRunResult.extracted_target_value !== null
                  ? JSON.stringify(dryRunResult.extracted_target_value)
                  : '(Không có / Thiếu spec)'}
              </span>
            </div>
          </div>

          {/* Violation message */}
          {dryRunResult.rendered_violation_message && (
            <div className="p-2.5 bg-red-100/70 border border-red-300/80 rounded-lg text-red-800">
              <div className="font-bold text-[11px] uppercase mb-0.5">Thông báo lỗi xuất ra:</div>
              <p className="italic">"{dryRunResult.rendered_violation_message}"</p>
            </div>
          )}

          {/* Missing spec warnings */}
          {dryRunResult.missing_spec_warnings && dryRunResult.missing_spec_warnings.length > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
              <div className="font-bold text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Cảnh báo thiếu thuộc tính trong specs:
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-0.5">
                {dryRunResult.missing_spec_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DryRunSandboxPanel;
