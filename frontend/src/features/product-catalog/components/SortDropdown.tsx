import React from 'react';
import { ArrowUpDown, Flame, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'benchmark_desc';

interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const options: { value: SortValue; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: 'Mới nhất', icon: <Sparkles className="w-3.5 h-3.5 text-blue-500" /> },
    { value: 'price_asc', label: 'Giá: Thấp đến Cao', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
    { value: 'price_desc', label: 'Giá: Cao đến Thấp', icon: <TrendingDown className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'benchmark_desc', label: 'Hiệu năng cao nhất', icon: <Flame className="w-3.5 h-3.5 text-smart-red" /> },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sắp xếp:</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortValue)}
          className="appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-2 pl-3 pr-8 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-smart-blue/20 focus:border-smart-blue transition cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <ArrowUpDown className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
