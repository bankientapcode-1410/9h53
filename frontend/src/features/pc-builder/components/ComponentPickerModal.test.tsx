import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { pcBuilderService } from '@/services/pcBuilderService';
import { productService } from '@/services/productService';
import { ComponentPickerModal } from './ComponentPickerModal';

describe('ComponentPickerModal Header Toolbar & Reset State (WBS 7.5.1)', () => {
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

  it('TC-UC2-33: Luôn hiển thị cố định nút Đặt lại màu xám (disabled) khi chưa chọn gì và kích hoạt khi có lọc hoặc đổi sort', async () => {
    render(
      <ComponentPickerModal
        isOpen={true}
        slotCode="CPU"
        currentItems={[]}
        onSelectProduct={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm CPU/i) as HTMLInputElement;
    const sortSelect = screen.getByLabelText('Sắp xếp ứng viên') as HTMLSelectElement;
    const inStockBtn = screen.getByRole('button', { name: 'Còn hàng' });
    const compatBtn = screen.getByRole('button', { name: 'Chỉ hiện tương thích' });
    const resetBtn = screen.getByRole('button', { name: 'Đặt lại' });

    // Ban đầu nút Đặt lại luôn có mặt trong DOM, màu xám và bị vô hiệu hóa
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
    expect(resetBtn.className).toContain('bg-slate-100');
    expect(resetBtn.className).toContain('text-slate-400');
    expect(resetBtn.className).toContain('cursor-not-allowed');

    await waitFor(() => {
      expect(pcBuilderService.searchSlotCandidates).toHaveBeenCalled();
    });
    const callCountBeforeDisabledClick = vi.mocked(
      pcBuilderService.searchSlotCandidates
    ).mock.calls.length;
    // Bấm khi đang disabled không kích hoạt thao tác hay gọi lại API
    fireEvent.click(resetBtn);
    expect(pcBuilderService.searchSlotCandidates).toHaveBeenCalledTimes(
      callCountBeforeDisabledClick
    );

    // Nhập từ khóa tìm kiếm cũng bật Đặt lại; xóa từ khóa trả lại disabled tại chỗ
    fireEvent.change(searchInput, { target: { value: 'Core' } });
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toBe(resetBtn);
    expect(resetBtn).toBeEnabled();
    fireEvent.click(screen.getByLabelText('Xóa từ khóa tìm kiếm'));
    expect(searchInput.value).toBe('');
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toBe(resetBtn);
    expect(resetBtn).toBeDisabled();

    // Bật "Còn hàng": nút Đặt lại giữ nguyên node DOM, chuyển sang enabled
    fireEvent.click(inStockBtn);
    expect(inStockBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toBe(resetBtn);
    expect(resetBtn).toBeEnabled();
    expect(resetBtn.className).not.toContain('cursor-not-allowed');

    // Tắt "Còn hàng": nút Đặt lại vẫn không ẩn đi mà quay về màu xám disabled
    fireEvent.click(inStockBtn);
    expect(inStockBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toBe(resetBtn);
    expect(resetBtn).toBeDisabled();
    expect(resetBtn.className).toContain('bg-slate-100');

    // Đổi sort != newest cũng kích hoạt nút Đặt lại
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
    expect(sortSelect.value).toBe('price_asc');
    expect(resetBtn).toBeEnabled();

    // Bấm Đặt lại khi đang bật nhiều điều kiện: reset tất cả và giữ nguyên nút Đặt lại disabled
    fireEvent.change(searchInput, { target: { value: 'i5' } });
    fireEvent.click(inStockBtn);
    fireEvent.click(compatBtn);
    expect(compatBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(resetBtn);

    expect(searchInput.value).toBe('');
    expect(sortSelect.value).toBe('newest');
    expect(inStockBtn).toHaveAttribute('aria-pressed', 'false');
    expect(compatBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toBe(resetBtn);
    expect(resetBtn).toBeDisabled();
    expect(resetBtn.className).toContain('bg-slate-100');
    expect(resetBtn.className).toContain('text-slate-400');
    expect(resetBtn.className).toContain('cursor-not-allowed');

    await waitFor(() => {
      expect(pcBuilderService.searchSlotCandidates).toHaveBeenLastCalledWith(
        'CPU',
        expect.objectContaining({
          compatible_only: false,
          in_stock_only: false,
          sort: 'newest',
          page: 0,
        }),
        expect.any(AbortSignal)
      );
    });
  });
});
