import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductSummaryDTO, ApiResponse } from '@/features/product-catalog/types/product.types';
import type { PCBuilderEvaluateResponse } from '@/features/pc-builder/types/builder.types';
import {
  ALL_SLOT_CONFIG_MAP,
  TOTAL_CORE_SLOTS,
  isBuilderSlotCode,
  isCoreSlotCode,
  isPeripheralSlotCode,
} from '@/features/pc-builder/constants/slotConfig';
import { BuilderSlotList } from '@/features/pc-builder/components/BuilderSlotList';
import { MOCK_PRODUCTS } from '@/services/mockData';
import {
  evaluateBuildOffline,
  pcBuilderService,
  resolveShareBuildOffline,
  searchSlotCandidatesOffline,
} from '@/services/pcBuilderService';
import {
  EVALUATE_DEBOUNCE_MS,
  PC_BUILDER_STORAGE_KEY,
  usePCBuilderStore,
} from './usePCBuilderStore';

const makeProduct = (
  overrides: Partial<ProductSummaryDTO> & { product_id: string; category_code: string }
): ProductSummaryDTO => ({
  name: `Sản phẩm ${overrides.product_id}`,
  brand: 'ASUS',
  category_name: overrides.category_code,
  image_url: '',
  price: 5_000_000,
  in_stock: true,
  benchmark_score: 85,
  key_specs: {},
  ...overrides,
});

const makeEvalResponse = (
  totalPrice: number,
  label: string
): ApiResponse<PCBuilderEvaluateResponse> => ({
  success: true,
  status_code: 200,
  message: 'OK',
  data: {
    compatibility: {
      is_compatible: true,
      errors: [],
      warnings: [],
      info: [],
      unresolved_product_ids: [],
    },
    telemetry: {
      total_price: totalPrice,
      estimated_tdp_w: 175,
      recommended_psu_w: 450,
      selected_psu_wattage_w: null,
      psu_load_percent: null,
      balance_index: 82,
      balance_label: label,
      selected_core_slots: 2,
      total_core_slots: 8,
      evaluation_time_ms: 1.5,
    },
    slot_statuses: {},
    gate_status: 'READY_SAFE',
    stock_issues: [],
    missing_recommended_slots: [],
  },
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePCBuilderStore (WBS 7.5.1 & 7.5.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    usePCBuilderStore.getState().clearBuild();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    usePCBuilderStore.getState().clearBuild();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('TC-UC2-03: Ghi đè slot SINGLE (CPU) và cộng dồn / kẹp giới hạn 16 trên slot MULTI (RAM)', () => {
    vi.spyOn(pcBuilderService, 'evaluateBuild').mockResolvedValue(
      makeEvalResponse(10_000_000, 'CÂN BẰNG TỐT')
    );

    const cpu1 = makeProduct({
      product_id: 'cpu-1',
      name: 'Intel Core i5-14600K',
      category_code: 'CPU',
      price: 7_990_000,
    });
    const cpu2 = makeProduct({
      product_id: 'cpu-2',
      name: 'Intel Core i7-14700K',
      category_code: 'CPU',
      price: 10_890_000,
    });
    const ram1 = makeProduct({
      product_id: 'ram-1',
      name: 'Corsair Vengeance 16GB DDR5',
      category_code: 'RAM',
      price: 1_890_000,
    });

    const store = usePCBuilderStore.getState();

    // Chọn 2 CPU liên tiếp -> slot SINGLE chỉ giữ CPU mới nhất
    store.selectProduct('CPU', cpu1);
    store.selectProduct('CPU', cpu2);

    const cpuSlot = usePCBuilderStore.getState().coreSlots.CPU;
    expect(cpuSlot).toHaveLength(1);
    expect(cpuSlot[0].product.product_id).toBe('cpu-2');
    expect(cpuSlot[0].quantity).toBe(1);

    // Không cho tăng quantity trên slot SINGLE
    store.updateSlotQuantity('CPU', 'cpu-2', 1);
    expect(usePCBuilderStore.getState().coreSlots.CPU[0].quantity).toBe(1);

    // Thêm 2 lần cùng 1 kit RAM -> quantity = 2
    store.selectProduct('RAM', ram1);
    store.selectProduct('RAM', ram1);

    let ramSlot = usePCBuilderStore.getState().coreSlots.RAM;
    expect(ramSlot).toHaveLength(1);
    expect(ramSlot[0].quantity).toBe(2);

    // Tăng vượt biên -> kẹp tối đa 16
    store.updateSlotQuantity('RAM', 'ram-1', 20);
    ramSlot = usePCBuilderStore.getState().coreSlots.RAM;
    expect(ramSlot[0].quantity).toBe(16);

    // Giảm về 0 -> tự động xóa khỏi slot
    store.updateSlotQuantity('RAM', 'ram-1', -16);
    expect(usePCBuilderStore.getState().coreSlots.RAM).toHaveLength(0);
  });

  it('TC-UC2-04: Lưu bền vững state coreSlots trên localStorage (smartpc_builder_v1) và khôi phục khi reload', async () => {
    vi.spyOn(pcBuilderService, 'evaluateBuild').mockResolvedValue(
      makeEvalResponse(25_000_000, 'CÂN BẰNG TỐT')
    );

    const cpu = makeProduct({
      product_id: 'e0000001-0000-0000-0000-000000000001',
      name: 'Intel Core i5-14600K',
      category_code: 'CPU',
      price: 7_990_000,
    });
    const gpu = makeProduct({
      product_id: 'e0000001-0000-0000-0000-000000000011',
      name: 'ASUS Dual RTX 4060',
      category_code: 'GPU',
      price: 8_490_000,
    });

    usePCBuilderStore.getState().selectProduct('CPU', cpu);
    usePCBuilderStore.getState().selectProduct('GPU', gpu);

    const rawPersisted = localStorage.getItem(PC_BUILDER_STORAGE_KEY);
    expect(rawPersisted).not.toBeNull();
    expect(rawPersisted).toContain(cpu.product_id);
    expect(rawPersisted).toContain(gpu.product_id);

    // Mô phỏng reload trang: reset module cache và import lại store từ localStorage
    vi.resetModules();
    const { usePCBuilderStore: reloadedStore } = await import('./usePCBuilderStore');
    const restored = reloadedStore.getState();

    expect(restored.coreSlots.CPU).toHaveLength(1);
    expect(restored.coreSlots.CPU[0].product.product_id).toBe(cpu.product_id);
    expect(restored.coreSlots.GPU).toHaveLength(1);
    expect(restored.coreSlots.GPU[0].product.product_id).toBe(gpu.product_id);

    // clearBuild xóa sạch localStorage và reset evaluation = null
    restored.clearBuild();
    expect(localStorage.getItem(PC_BUILDER_STORAGE_KEY)).toBeNull();
    expect(reloadedStore.getState().coreSlots.CPU).toHaveLength(0);
    expect(reloadedStore.getState().evaluation).toBeNull();
  });

  it('TC-UC2-10: Sequence guard + AbortController + debounce 150ms loại bỏ stale response đến muộn', async () => {
    vi.useFakeTimers();
    const initialSeq = usePCBuilderStore.getState().evaluationSeq;

    const deferred1 = createDeferred<ApiResponse<PCBuilderEvaluateResponse>>();
    const deferred2 = createDeferred<ApiResponse<PCBuilderEvaluateResponse>>();
    const capturedSignals: Array<AbortSignal | undefined> = [];

    const evalSpy = vi
      .spyOn(pcBuilderService, 'evaluateBuild')
      .mockImplementationOnce((_req, signal) => {
        capturedSignals.push(signal);
        return deferred1.promise;
      })
      .mockImplementationOnce((_req, signal) => {
        capturedSignals.push(signal);
        return deferred2.promise;
      });

    const cpu = makeProduct({
      product_id: 'cpu-seq-1',
      name: 'Intel Core i5-14600K',
      category_code: 'CPU',
      price: 7_990_000,
    });
    const mb = makeProduct({
      product_id: 'mb-seq-2',
      name: 'ASUS ROG STRIX B760-A',
      category_code: 'MOTHERBOARD',
      price: 5_490_000,
    });

    // Thao tác 1: Chọn CPU -> chưa gọi API ngay do debounce 150ms
    usePCBuilderStore.getState().selectProduct('CPU', cpu);
    expect(evalSpy).not.toHaveBeenCalled();

    // Hết 150ms -> gửi Eval #1 (chậm)
    await vi.advanceTimersByTimeAsync(EVALUATE_DEBOUNCE_MS);
    expect(evalSpy).toHaveBeenCalledTimes(1);
    expect(usePCBuilderStore.getState().isEvaluating).toBe(true);
    expect(capturedSignals[0]?.aborted).toBe(false);

    // Thao tác 2: Chọn thêm Mainboard -> hết 150ms gửi Eval #2 (nhanh), abort request #1
    usePCBuilderStore.getState().selectProduct('MOTHERBOARD', mb);
    await vi.advanceTimersByTimeAsync(EVALUATE_DEBOUNCE_MS);

    expect(evalSpy).toHaveBeenCalledTimes(2);
    expect(capturedSignals[0]?.aborted).toBe(true);
    expect(capturedSignals[1]?.aborted).toBe(false);
    expect(usePCBuilderStore.getState().evaluationSeq).toBe(initialSeq + 2);

    // Eval #2 (mới nhất) trả về TRƯỚC
    const latestPayload = makeEvalResponse(13_480_000, 'EVAL_2_LATEST');
    deferred2.resolve(latestPayload);
    await Promise.resolve();
    await Promise.resolve();

    expect(usePCBuilderStore.getState().evaluation?.telemetry.total_price).toBe(13_480_000);
    expect(usePCBuilderStore.getState().evaluation?.telemetry.balance_label).toBe('EVAL_2_LATEST');
    expect(usePCBuilderStore.getState().isEvaluating).toBe(false);

    // Eval #1 (stale) trả về SAU (giả lập mạng không hủy được promise đang chờ) -> phải bị bỏ qua
    const stalePayload = makeEvalResponse(7_990_000, 'EVAL_1_STALE');
    deferred1.resolve(stalePayload);
    await Promise.resolve();
    await Promise.resolve();

    expect(usePCBuilderStore.getState().evaluation?.telemetry.total_price).toBe(13_480_000);
    expect(usePCBuilderStore.getState().evaluation?.telemetry.balance_label).toBe('EVAL_2_LATEST');
    expect(usePCBuilderStore.getState().isEvaluating).toBe(false);
  });

  it('TC-UC2-31: Hỗ trợ slot nội bộ tùy chọn SSD_SATA (MULTI 1..16) trong danh sách chính, migrate localStorage cũ & giữ 8 core slots', async () => {
    vi.spyOn(pcBuilderService, 'evaluateBuild').mockResolvedValue(
      makeEvalResponse(3_870_000, 'CHƯA ĐỦ DỮ LIỆU')
    );

    expect(TOTAL_CORE_SLOTS).toBe(8);
    expect(isCoreSlotCode('SSD_SATA')).toBe(true);
    expect(isPeripheralSlotCode('SSD_SATA')).toBe(false);
    expect(isBuilderSlotCode('SSD_SATA')).toBe(true);

    const sataMeta = ALL_SLOT_CONFIG_MAP.SSD_SATA;
    expect(sataMeta.is_core).toBe(false);
    expect(sataMeta.required_hint).toBe('Tùy chọn');
    expect(sataMeta.selection_mode).toBe('MULTI');
    expect(sataMeta.display_order).toBe(6);

    const sataSsd = makeProduct({
      product_id: 'e0000001-0000-0000-0000-000000000091',
      name: 'SSD Crucial MX500 500GB 2.5" SATA III',
      brand: 'CRUCIAL',
      category_code: 'SSD_SATA',
      category_name: 'Ổ cứng SSD SATA 2.5"',
      price: 1_290_000,
    });

    // Tương thích ngược nếu localStorage cũ thiếu coreSlots.SSD_SATA hoặc đang lưu trong peripherals.SSD_SATA
    localStorage.setItem(
      PC_BUILDER_STORAGE_KEY,
      JSON.stringify({
        state: {
          coreSlots: {
            CPU: [],
            MOTHERBOARD: [],
            RAM: [],
            GPU: [],
            SSD_M2: [],
            PSU: [],
            CASE: [],
            CPU_COOLER: [],
          },
          peripherals: {
            SSD_SATA: [{ product: sataSsd, quantity: 2 }],
            MONITOR: [],
            KEYBOARD: [],
            MOUSE: [],
          },
        },
        version: 0,
      })
    );
    await usePCBuilderStore.persist.rehydrate();
    expect(usePCBuilderStore.getState().coreSlots.SSD_SATA).toHaveLength(1);
    expect(usePCBuilderStore.getState().coreSlots.SSD_SATA[0].quantity).toBe(2);
    expect('SSD_SATA' in usePCBuilderStore.getState().peripherals).toBe(false);

    // Xóa sạch rồi chọn lại 2 lần + tăng thêm 1 = 3 ổ SSD_SATA mà không chạm tiến độ 8 core slots
    usePCBuilderStore.getState().clearBuild();
    usePCBuilderStore.getState().selectProduct('SSD_SATA', sataSsd);
    usePCBuilderStore.getState().selectProduct('SSD_SATA', sataSsd);
    usePCBuilderStore.getState().updateSlotQuantity('SSD_SATA', sataSsd.product_id, 1);

    const state = usePCBuilderStore.getState();
    expect(state.coreSlots.SSD_SATA).toHaveLength(1);
    expect(state.coreSlots.SSD_SATA[0].quantity).toBe(3);
    expect(state.getSelectedItemsInput()).toEqual([
      { product_id: sataSsd.product_id, quantity: 3, slot_code: 'SSD_SATA' },
    ]);

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(BuilderSlotList, {
          coreSlots: state.coreSlots,
          peripherals: state.peripherals,
          onOpenPicker: vi.fn(),
          onRemoveItem: vi.fn(),
          onUpdateQuantity: vi.fn(),
        })
      )
    );
    // SSD_SATA hiển thị trực tiếp ngay trong danh sách chính, không cần mở khối ngoại vi
    expect(screen.getByText('Ổ cứng SSD SATA 2.5"')).toBeInTheDocument();
    expect(screen.getByText(sataSsd.name)).toBeInTheDocument();
    expect(screen.getByText(/Linh kiện cốt lõi \(0\/8\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Thiết bị ngoại vi tùy chọn \(Màn hình, Bàn phím, Chuột\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Không tính vào tiến độ 0\/8 linh kiện cốt lõi/i)
    ).toBeInTheDocument();
  });

  it('TC-UC2-32: Offline picker, evaluation & resolve hỗ trợ SSD_SATA mà không kích hoạt Rule 9 hay đổi 8 core slots', () => {
    const candidates = searchSlotCandidatesOffline('ssd_sata', {
      specs: { capacity_gb: '1000' },
    });
    expect(candidates.content.length).toBeGreaterThanOrEqual(3);
    expect(candidates.content.every((c) => c.product.category_code === 'SSD_SATA')).toBe(true);

    const mb = MOCK_PRODUCTS.find((p) => p.category.category_code === 'MOTHERBOARD')!;
    const ssdM2 = MOCK_PRODUCTS.find((p) => p.category.category_code === 'SSD_M2')!;
    const ssdSata = MOCK_PRODUCTS.find((p) => p.category.category_code === 'SSD_SATA')!;

    const evalRes = evaluateBuildOffline([
      { product_id: mb.product_id, quantity: 1, slot_code: 'MOTHERBOARD' },
      { product_id: ssdM2.product_id, quantity: 1, slot_code: 'SSD_M2' },
      { product_id: ssdSata.product_id, quantity: 3, slot_code: 'SSD_SATA' },
    ]);

    expect(evalRes.telemetry.total_core_slots).toBe(8);
    expect(evalRes.telemetry.selected_core_slots).toBe(2);
    expect(evalRes.compatibility.warnings).toHaveLength(0);
    expect(evalRes.telemetry.total_price).toBe(mb.price + ssdM2.price + ssdSata.price * 3);

    const resolved = resolveShareBuildOffline({
      items: [{ product_id: ssdSata.product_id, quantity: 3 }],
    });
    expect(resolved.resolved_items).toHaveLength(1);
    expect(resolved.resolved_items[0].slot_code).toBe('SSD_SATA');
    expect(resolved.resolved_items[0].quantity).toBe(3);
  });
});
