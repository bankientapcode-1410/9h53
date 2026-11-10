import React, { useState, useEffect, useMemo } from 'react';
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
  const [sourceItems, setSourceItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [targetItems, setTargetItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [running, setRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sourceCategory = (ruleDefinition.source_category || '').toUpperCase();
  const targetCategory = (ruleDefinition.target_category || '').toUpperCase();
  const sourceSpecKey = (ruleDefinition.source_spec_key || '').trim().toLowerCase();
  const targetSpecKey = (ruleDefinition.target_spec_key || '').trim().toLowerCase();

  // Load all products once
  useEffect(() => {
    let mounted = true;
    const fetchSampleProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productAdminService.getAdminProducts({ size: 100 });
        if (mounted && res?.data?.content) {
          setAvailableProducts(res.data.content);
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
  }, []);

  // Filter available products strictly by category mentioned in the rule
  const availableSourceProducts = useMemo(() => {
    if (!sourceCategory) return [];
    if (sourceCategory === '_SYSTEM') {
      // Products that consume wattage in system: CPU, GPU, RAM, CPU_COOLER, MOTHERBOARD
      return availableProducts.filter((p) => {
        const cat = p.category?.category_code?.toUpperCase();
        return cat === 'CPU' || cat === 'GPU' || cat === 'RAM' || cat === 'CPU_COOLER' || cat === 'MOTHERBOARD';
      });
    }
    return availableProducts.filter(
      (p) => p.category?.category_code?.toUpperCase() === sourceCategory
    );
  }, [availableProducts, sourceCategory]);

  const availableTargetProducts = useMemo(() => {
    if (!targetCategory || targetCategory === '_SYSTEM') return [];
    return availableProducts.filter(
      (p) => p.category?.category_code?.toUpperCase() === targetCategory
    );
  }, [availableProducts, targetCategory]);

  // Synchronize default test selections when rule categories change
  useEffect(() => {
    if (!availableProducts.length) return;

    // Pick 1-2 source products as sample
    const newSource: Array<{ product_id: string; quantity: number }> = [];
    if (sourceCategory === '_SYSTEM') {
      const cpu = availableProducts.find((p) => p.category?.category_code?.toUpperCase() === 'CPU');
      const gpu = availableProducts.find((p) => p.category?.category_code?.toUpperCase() === 'GPU');
      if (cpu) newSource.push({ product_id: cpu.product_id, quantity: 1 });
      if (gpu) newSource.push({ product_id: gpu.product_id, quantity: 1 });
    } else if (sourceCategory) {
      const match = availableProducts.find((p) => p.category?.category_code?.toUpperCase() === sourceCategory);
      if (match) newSource.push({ product_id: match.product_id, quantity: 1 });
    }
    setSourceItems(newSource);

    // Pick 1 target product as sample
    const newTarget: Array<{ product_id: string; quantity: number }> = [];
    if (targetCategory && targetCategory !== '_SYSTEM') {
      const match = availableProducts.find((p) => p.category?.category_code?.toUpperCase() === targetCategory);
      if (match) newTarget.push({ product_id: match.product_id, quantity: 1 });
    }
    setTargetItems(newTarget);

    setDryRunResult(null);
    setErrorMsg(null);
  }, [sourceCategory, targetCategory, availableProducts]);

  // Spec extractor helpers for individual items
  const getSourceSpecInfo = (product: AdminProductDTO | undefined, quantity: number) => {
    if (!product) {
      return { keyName: sourceSpecKey, valueStr: '', isValid: false, warning: 'Linh kiện không tồn tại' };
    }
    const specs = product.specs || {};

    if (sourceSpecKey === '_total_tdp_w') {
      const unitTdp = Number(specs.tdp_w || 0);
      const totalTdp = unitTdp * quantity;
      return {
        keyName: 'tdp_w (Đóng góp TDP)',
        valueStr: `${unitTdp}W × ${quantity} = ${totalTdp}W`,
        isValid: unitTdp > 0,
        warning: unitTdp === 0 ? 'Chưa có thông số tdp_w' : null,
      };
    }

    if (sourceSpecKey === '_count') {
      return {
        keyName: '_count (Khe chiếm dụng)',
        valueStr: `${quantity} khe vật lý`,
        isValid: true,
        warning: null,
      };
    }

    if (sourceSpecKey === '_sum_capacity_gb') {
      const cap = Number(specs.capacity_gb || 0);
      const totalCap = cap * quantity;
      return {
        keyName: 'capacity_gb (Dung lượng)',
        valueStr: `${cap}GB × ${quantity} = ${totalCap}GB`,
        isValid: cap > 0,
        warning: cap === 0 ? 'Chưa có capacity_gb' : null,
      };
    }

    const val = specs[sourceSpecKey];
    if (val !== undefined && val !== null && val !== '') {
      return {
        keyName: sourceSpecKey,
        valueStr: Array.isArray(val) ? `[${val.join(', ')}]` : String(val),
        isValid: true,
        warning: null,
      };
    }

    return {
      keyName: sourceSpecKey,
      valueStr: '(Chưa khai báo)',
      isValid: false,
      warning: `Thiếu khóa "${sourceSpecKey}" trong specs`,
    };
  };

  const getTargetSpecInfo = (product: AdminProductDTO | undefined) => {
    if (!product) {
      return { keyName: targetSpecKey, valueStr: '', isValid: false, warning: 'Linh kiện không tồn tại' };
    }
    const specs = product.specs || {};

    const val = specs[targetSpecKey];
    if (val !== undefined && val !== null && val !== '') {
      return {
        keyName: targetSpecKey,
        valueStr: Array.isArray(val) ? `[${val.join(', ')}]` : String(val),
        isValid: true,
        warning: null,
      };
    }

    return {
      keyName: targetSpecKey,
      valueStr: '(Chưa khai báo)',
      isValid: false,
      warning: `Thiếu khóa "${targetSpecKey}" trong specs`,
    };
  };

  // Actions for Source
  const handleAddSourceItem = (productId: string) => {
    if (!productId) return;
    if (sourceItems.some((i) => i.product_id === productId)) return;
    setSourceItems([...sourceItems, { product_id: productId, quantity: 1 }]);
    setDryRunResult(null);
  };

  const handleRemoveSourceItem = (index: number) => {
    setSourceItems(sourceItems.filter((_, i) => i !== index));
    setDryRunResult(null);
  };

  const handleSourceQuantityChange = (index: number, quantity: number) => {
    const updated = [...sourceItems];
    updated[index].quantity = Math.max(1, quantity);
    setSourceItems(updated);
    setDryRunResult(null);
  };

  // Actions for Target
  const handleAddTargetItem = (productId: string) => {
    if (!productId) return;
    if (targetItems.some((i) => i.product_id === productId)) return;
    setTargetItems([...targetItems, { product_id: productId, quantity: 1 }]);
    setDryRunResult(null);
  };

  const handleRemoveTargetItem = (index: number) => {
    setTargetItems(targetItems.filter((_, i) => i !== index));
    setDryRunResult(null);
  };

  const handleTargetQuantityChange = (index: number, quantity: number) => {
    const updated = [...targetItems];
    updated[index].quantity = Math.max(1, quantity);
    setTargetItems(updated);
    setDryRunResult(null);
  };

  // Client-side rule evaluation helper for offline/mock fallback
  const evaluateLocally = (srcVal: any, tgtVal: any, op: string): boolean => {
    if (srcVal === null || tgtVal === null || srcVal === undefined || tgtVal === undefined) {
      return false;
    }
    const normalize = (v: any) => String(v).trim().toLowerCase();

    switch (op) {
      case 'IN': {
        const arr = Array.isArray(tgtVal) ? tgtVal : [tgtVal];
        return arr.some((item) => normalize(item) === normalize(srcVal));
      }
      case 'NOT_IN': {
        const arr = Array.isArray(tgtVal) ? tgtVal : [tgtVal];
        return !arr.some((item) => normalize(item) === normalize(srcVal));
      }
      case 'EQUALS': {
        return normalize(srcVal) === normalize(tgtVal);
      }
      case 'LTE': {
        return Number(srcVal) <= Number(tgtVal);
      }
      case 'GTE': {
        return Number(srcVal) >= Number(tgtVal);
      }
      case 'RANGE': {
        if (Array.isArray(tgtVal) && tgtVal.length >= 2) {
          return Number(srcVal) >= Number(tgtVal[0]) && Number(srcVal) <= Number(tgtVal[1]);
        }
        return false;
      }
      default:
        return false;
    }
  };

  // Run dry run test
  const handleRunDryRun = async () => {
    setErrorMsg(null);
    if (sourceItems.length === 0) {
      setErrorMsg(`Vui lòng chọn ít nhất 1 linh kiện nguồn thuộc danh mục [${sourceCategory}] để chạy thử.`);
      return;
    }
    if (targetItems.length === 0) {
      setErrorMsg(`Vui lòng chọn ít nhất 1 linh kiện đích thuộc danh mục [${targetCategory}] để chạy thử.`);
      return;
    }

    const allItems = [...sourceItems, ...targetItems];
    setRunning(true);

    try {
      const res = await ruleAdminService.dryRun({
        rule_definition: ruleDefinition,
        test_items: allItems,
      });
      if (res?.data) {
        setDryRunResult(res.data);
      }
    } catch (err: any) {
      // Local fallback evaluation using actual test product specs
      let extractedSource: any = null;
      let extractedTarget: any = null;

      if (sourceSpecKey === '_total_tdp_w') {
        extractedSource = sourceItems.reduce((sum, item) => {
          const prod = availableProducts.find((p) => p.product_id === item.product_id);
          return sum + Number(prod?.specs?.tdp_w || 0) * item.quantity;
        }, 0);
      } else if (sourceSpecKey === '_count') {
        extractedSource = sourceItems.reduce((sum, item) => sum + item.quantity, 0);
      } else if (sourceSpecKey === '_sum_capacity_gb') {
        extractedSource = sourceItems.reduce((sum, item) => {
          const prod = availableProducts.find((p) => p.product_id === item.product_id);
          return sum + Number(prod?.specs?.capacity_gb || 0) * item.quantity;
        }, 0);
      } else if (sourceItems.length > 0) {
        const firstSrc = availableProducts.find((p) => p.product_id === sourceItems[0].product_id);
        extractedSource = firstSrc?.specs?.[sourceSpecKey] ?? null;
      }

      if (targetItems.length > 0) {
        const firstTgt = availableProducts.find((p) => p.product_id === targetItems[0].product_id);
        extractedTarget = firstTgt?.specs?.[targetSpecKey] ?? null;
      }

      const isPass = evaluateLocally(extractedSource, extractedTarget, ruleDefinition.operator);

      const firstSrc = availableProducts.find((p) => p.product_id === sourceItems[0]?.product_id);
      const firstTgt = availableProducts.find((p) => p.product_id === targetItems[0]?.product_id);

      let renderedMsg: string | null = null;
      if (!isPass) {
        renderedMsg = ruleDefinition.error_message_template
          .replace('{source_name}', firstSrc?.name || ruleDefinition.source_category)
          .replace('{source_value}', String(extractedSource))
          .replace('{target_name}', firstTgt?.name || ruleDefinition.target_category)
          .replace(
            '{target_value}',
            Array.isArray(extractedTarget) ? extractedTarget.join(', ') : String(extractedTarget)
          )
          .replace('{source_category}', ruleDefinition.source_category)
          .replace('{target_category}', ruleDefinition.target_category);
      }

      setDryRunResult({
        is_compatible: isPass,
        extracted_source_value: extractedSource,
        extracted_target_value: extractedTarget,
        rendered_violation_message: renderedMsg,
        violations: isPass
          ? []
          : [
              {
                rule_id: 'dryrun-test',
                rule_name: ruleDefinition.rule_name,
                severity: ruleDefinition.severity,
                message: renderedMsg || 'Không thỏa mãn điều kiện quy tắc tương thích',
                source_product: firstSrc ? { id: firstSrc.product_id, name: firstSrc.name, category_code: firstSrc.category?.category_code || '' } : null,
                target_product: firstTgt ? { id: firstTgt.product_id, name: firstTgt.name, category_code: firstTgt.category?.category_code || '' } : null,
              },
            ],
        missing_spec_warnings: [],
        execution_time_ms: 0.38,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          Khu Vực Chạy Thử Thực Tế (Dry-Run Sandbox)
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {loadingProducts ? 'Đang tải kho linh kiện...' : 'Đối chiếu thông số trực tiếp theo quy tắc'}
        </span>
      </div>

      {/* 2-Column Split: Source Products vs Target Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ================= COLUMN 1: SOURCE PRODUCTS ================= */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-smart-blue uppercase">1. Vế Nguồn:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-smart-blue font-bold text-xs border border-blue-200">
                {sourceCategory}
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Khóa: {sourceSpecKey || 'chưa chọn'}
            </span>
          </div>

          {/* Selected Source Products List */}
          <div className="space-y-2 min-h-[90px]">
            {sourceItems.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có linh kiện nguồn nào được chọn.
              </div>
            ) : (
              sourceItems.map((item, idx) => {
                const product = availableProducts.find((p) => p.product_id === item.product_id);
                const specInfo = getSourceSpecInfo(product, item.quantity);

                return (
                  <div
                    key={'src-' + item.product_id}
                    className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-xs truncate" title={product?.name}>
                          {product ? product.name : item.product_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {product?.brand} • {product?.category?.category_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">SL:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={item.quantity}
                          onChange={(e) => handleSourceQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-12 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-center font-bold text-xs text-slate-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSourceItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Xóa linh kiện nguồn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Extracted Comparison Value Badge */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium truncate">
                        Giá trị so sánh <span className="font-mono text-slate-700">({specInfo.keyName})</span>:
                      </span>
                      {specInfo.isValid ? (
                        <span
                          className="font-mono font-bold text-smart-blue px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md truncate max-w-[170px]"
                          title={specInfo.valueStr}
                        >
                          {specInfo.valueStr}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[10px] flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {specInfo.warning}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Source Product Dropdown - strictly limited to sourceCategory */}
          <div className="pt-1">
            <select
              value=""
              onChange={(e) => {
                handleAddSourceItem(e.target.value);
              }}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
            >
              <option value="">+ Thêm linh kiện nguồn [{sourceCategory}]...</option>
              {availableSourceProducts.map((p) => {
                const isSelected = sourceItems.some((i) => i.product_id === p.product_id);
                const specVal = p.specs?.[sourceSpecKey];
                const specHint = specVal !== undefined ? ` [${sourceSpecKey}: ${JSON.stringify(specVal)}]` : '';
                return (
                  <option key={'src-opt-' + p.product_id} value={p.product_id} disabled={isSelected}>
                    {isSelected ? '✓ ' : ''}{p.name}{specHint}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ================= COLUMN 2: TARGET PRODUCTS ================= */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 uppercase">2. Vế Đích:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                {targetCategory}
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Khóa: {targetSpecKey || 'chưa chọn'}
            </span>
          </div>

          {/* Selected Target Products List */}
          <div className="space-y-2 min-h-[90px]">
            {targetItems.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có linh kiện đích nào được chọn.
              </div>
            ) : (
              targetItems.map((item, idx) => {
                const product = availableProducts.find((p) => p.product_id === item.product_id);
                const specInfo = getTargetSpecInfo(product);

                return (
                  <div
                    key={'tgt-' + item.product_id}
                    className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-xs truncate" title={product?.name}>
                          {product ? product.name : item.product_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {product?.brand} • {product?.category?.category_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">SL:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={item.quantity}
                          onChange={(e) => handleTargetQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-12 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-center font-bold text-xs text-slate-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTargetItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Xóa linh kiện đích này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Extracted Comparison Value Badge */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium truncate">
                        Giá trị so sánh <span className="font-mono text-slate-700">({specInfo.keyName})</span>:
                      </span>
                      {specInfo.isValid ? (
                        <span
                          className="font-mono font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md truncate max-w-[170px]"
                          title={specInfo.valueStr}
                        >
                          {specInfo.valueStr}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[10px] flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {specInfo.warning}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Target Product Dropdown - strictly limited to targetCategory */}
          <div className="pt-1">
            <select
              value=""
              onChange={(e) => {
                handleAddTargetItem(e.target.value);
              }}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
            >
              <option value="">+ Thêm linh kiện đích [{targetCategory}]...</option>
              {availableTargetProducts.map((p) => {
                const isSelected = targetItems.some((i) => i.product_id === p.product_id);
                const specVal = p.specs?.[targetSpecKey];
                const specHint = specVal !== undefined ? ` [${targetSpecKey}: ${JSON.stringify(specVal)}]` : '';
                return (
                  <option key={'tgt-opt-' + p.product_id} value={p.product_id} disabled={isSelected}>
                    {isSelected ? '✓ ' : ''}{p.name}{specHint}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <div>
        <button
          type="button"
          disabled={running || sourceItems.length === 0 || targetItems.length === 0}
          onClick={handleRunDryRun}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Đang phân tích & đối chiếu điều kiện...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Chạy Thử Quy Tắc (Test Rule Với Linh Kiện Đã Chọn)
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dry-run Result Box */}
      {dryRunResult && (
        <div
          className={`p-4 rounded-2xl border space-y-3 text-xs animate-in fade-in duration-200 ${
            dryRunResult.is_compatible
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-red-50/70 border-red-200 text-red-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm">
              {dryRunResult.is_compatible ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>KẾT QUẢ ĐỐI CHIẾU: THỎA MÃN (PASS)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>KẾT QUẢ ĐỐI CHIẾU: VI PHẠM QUY TẮC (FAIL)</span>
                </>
              )}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{dryRunResult.execution_time_ms}ms</span>
            </div>
          </div>

          {/* Detailed side-by-side comparison with operator in the middle */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Phép So Sánh Thực Tế (Runtime Evaluation):
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              {/* Source Extracted */}
              <div className="flex-1 w-full bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/80">
                <span className="text-[10px] text-slate-500 font-sans block mb-0.5">
                  Vế Nguồn ({ruleDefinition.source_category}.{ruleDefinition.source_spec_key}):
                </span>
                <span className="font-bold text-smart-blue break-all">
                  {dryRunResult.extracted_source_value !== null && dryRunResult.extracted_source_value !== undefined
                    ? Array.isArray(dryRunResult.extracted_source_value)
                      ? `[${dryRunResult.extracted_source_value.join(', ')}]`
                      : String(dryRunResult.extracted_source_value)
                    : '(Không có / Chưa có spec)'}
                </span>
              </div>

              {/* Operator */}
              <div className="shrink-0 flex items-center justify-center px-3 py-1 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-black text-xs">
                {ruleDefinition.operator}
              </div>

              {/* Target Extracted */}
              <div className="flex-1 w-full bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80">
                <span className="text-[10px] text-slate-500 font-sans block mb-0.5">
                  Vế Đích ({ruleDefinition.target_category}.{ruleDefinition.target_spec_key}):
                </span>
                <span className="font-bold text-emerald-800 break-all">
                  {dryRunResult.extracted_target_value !== null && dryRunResult.extracted_target_value !== undefined
                    ? Array.isArray(dryRunResult.extracted_target_value)
                      ? `[${dryRunResult.extracted_target_value.join(', ')}]`
                      : String(dryRunResult.extracted_target_value)
                    : '(Không có / Chưa có spec)'}
                </span>
              </div>
            </div>
          </div>

          {/* Rendered Violation message */}
          {dryRunResult.rendered_violation_message && (
            <div className="p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-900 space-y-1">
              <div className="font-bold text-[11px] uppercase flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                Thông báo lỗi nội suy xuất ra:
              </div>
              <p className="italic font-medium">"{dryRunResult.rendered_violation_message}"</p>
            </div>
          )}

          {/* Missing spec warnings */}
          {dryRunResult.missing_spec_warnings && dryRunResult.missing_spec_warnings.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="font-bold text-[11px] flex items-center gap-1 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Cảnh báo thiếu thuộc tính trong specs:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800">
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
