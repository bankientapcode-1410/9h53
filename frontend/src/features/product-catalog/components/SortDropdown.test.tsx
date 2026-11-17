import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SortDropdown } from './SortDropdown';

describe('SortDropdown (Product Sort Rule)', () => {
  afterEach(() => {
    cleanup();
  });

  it('hiển thị đúng 4 tùy chọn sắp xếp theo thứ tự cố định: Mới nhất, Cũ nhất, Giá tăng dần, Giá giảm dần', () => {
    const onChange = vi.fn();
    render(<SortDropdown value="newest" onChange={onChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
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
    expect(onChange).toHaveBeenCalledWith('oldest');
  });
});
