import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { pcBuilderService } from '@/services/pcBuilderService';
import { productService } from '@/services/productService';
import { ComponentPickerModal } from './ComponentPickerModal';

describe('ComponentPickerModal Sort (Product Sort Rule)', () => {
  beforeEach(() => {
    vi.spyOn(productService, 'getFacets').mockResolvedValue({
      success: true,
      status_code: 200,
      message: 'OK',
      data: [],
      timestamp: new Date().toISOString(),
    });
    vi.spyOn(pcBuilderService, 'searchSlotCandidates').mockResolvedValue({
      success: true,
      status_code: 200,
      message: 'OK',
      data: {
        content: [],
        page: 0,
        size: 12,
        total_elements: 0,
        total_pages: 0,
        first: true,
        last: true,
      },
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hiển thị đúng 4 tùy chọn sắp xếp theo thứ tự cố định và gọi API với sort mới nhất / cũ nhất / giá tăng dần / giá giảm dần', async () => {
    render(
      <ComponentPickerModal
        isOpen={true}
        slotCode="CPU"
        currentItems={[]}
        onSelectProduct={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Sắp xếp ứng viên') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => ({
      value: opt.value,
      label: opt.textContent?.trim(),
    }));

    expect(options).toEqual([
      { value: 'newest', label: 'Mới nhất' },
      { value: 'oldest', label: 'Cũ nhất' },
      { value: 'price_asc', label: 'Giá tăng dần' },
      { value: 'price_desc', label: 'Giá giảm dần' },
    ]);

    fireEvent.change(select, { target: { value: 'oldest' } });
    await waitFor(() => {
      expect(pcBuilderService.searchSlotCandidates).toHaveBeenLastCalledWith(
        'CPU',
        expect.objectContaining({ sort: 'oldest' }),
        expect.any(AbortSignal)
      );
    });
  });
});
