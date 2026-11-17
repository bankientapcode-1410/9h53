import { describe, it, expect, vi, afterEach } from 'vitest';
import apiClient from './apiClient';
import { detectExplicitCategories, productService } from './productService';
import { MOCK_CATEGORY_TREE, MOCK_PRODUCTS, MOCK_SPECS_SCHEMA } from './mockData';

describe('TC-PROD-33: SSD_SATA Catalog, Schema & Search Intent Coverage', () => {
  it('routes storage search queries cleanly between SSD_M2, SSD_SATA, and both', () => {
    expect(detectExplicitCategories('ssd')).toEqual(['SSD_M2', 'SSD_SATA']);
    expect(detectExplicitCategories('ổ cứng')).toEqual(['SSD_M2', 'SSD_SATA']);
    expect(detectExplicitCategories('lưu trữ')).toEqual(['SSD_M2', 'SSD_SATA']);

    expect(detectExplicitCategories('ssd sata')).toEqual(['SSD_SATA']);
    expect(detectExplicitCategories('ổ cứng 2.5 inch')).toEqual(['SSD_SATA']);

    expect(detectExplicitCategories('ssd nvme')).toEqual(['SSD_M2']);
    expect(detectExplicitCategories('ổ cứng m.2 pcie 4.0')).toEqual(['SSD_M2']);

    // Không nhận nhầm kích thước màn hình 24.5" sang SSD_SATA
    expect(detectExplicitCategories('màn hình 24.5 inch')).toEqual([]);
  });

  it('includes SSD_SATA under STORAGE_DEVICES with schema and >= 2 items per brand and capacity', () => {
    const storageGroup = MOCK_CATEGORY_TREE.find((c) => c.category_code === 'STORAGE_DEVICES');
    expect(storageGroup).toBeDefined();
    const childCodes = storageGroup!.children.map((c) => c.category_code);
    expect(childCodes).toEqual(['SSD_M2', 'SSD_SATA']);

    const sataSchema = MOCK_SPECS_SCHEMA.SSD_SATA;
    expect(sataSchema).toBeDefined();
    expect(sataSchema.has_schema).toBe(true);
    expect(sataSchema.fields.filter((f) => f.filterable).map((f) => f.key)).toEqual([
      'interface_type',
      'capacity_gb',
    ]);

    const sataProducts = MOCK_PRODUCTS.filter((p) => p.category.category_code === 'SSD_SATA');
    expect(sataProducts.length).toBeGreaterThanOrEqual(12);

    const byBrand = new Map<string, number>();
    const byCap = new Map<number, number>();
    for (const p of sataProducts) {
      byBrand.set(p.brand, (byBrand.get(p.brand) ?? 0) + 1);
      const cap = Number(p.specs.capacity_gb);
      byCap.set(cap, (byCap.get(cap) ?? 0) + 1);
    }
    for (const count of byBrand.values()) {
      expect(count).toBeGreaterThanOrEqual(2);
    }
    for (const count of byCap.values()) {
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds SSD_SATA offline facets (interface_type & capacity_gb) for Catalog & PickerModal', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('offline'));
    const res = await productService.getFacets('SSD_SATA');
    expect(res.success).toBe(true);
    const codes = (res.data || []).map((g) => g.code);
    expect(codes).toEqual(expect.arrayContaining(['brand', 'interface_type', 'capacity_gb', 'price_ranges']));
    const capGroup = res.data!.find((g) => g.code === 'capacity_gb')!;
    expect(capGroup.options.map((o) => o.value)).toEqual(['240', '480', '500', '1000', '2000']);
  });
});
