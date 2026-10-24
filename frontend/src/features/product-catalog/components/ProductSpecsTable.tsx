import React from 'react';

interface SpecLabelMeta {
  label: string;
  unit?: string | null;
}

interface ProductSpecsTableProps {
  specs?: Record<string, any>;
  specLabels?: Record<string, SpecLabelMeta>;
  categoryName?: string;
}

export const ProductSpecsTable: React.FC<ProductSpecsTableProps> = ({
  specs = {},
  specLabels = {},
  categoryName,
}) => {
  const entries = Object.entries(specs);

  if (entries.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
        Không có dữ liệu thông số kỹ thuật chi tiết.
      </div>
    );
  }

  // Format spec key into human friendly label and infer unit if not in specLabels
  const inferUnit = (key: string): string | null => {
    if (key.endsWith('_gb')) return 'GB';
    if (key.endsWith('_mhz')) return 'MHz';
    if (key.endsWith('_w')) return 'W';
    if (key.endsWith('_mm')) return 'mm';
    if (key.endsWith('_mbps')) return 'MB/s';
    if (key === 'core_count') return 'nhân';
    if (key === 'thread_count') return 'luồng';
    if (key === 'ram_slots' || key === 'm2_slots') return 'khe';
    if (key === 'modules_per_kit') return 'thanh';
    return null;
  };

  const getLabel = (key: string): { label: string; unit?: string | null } => {
    if (specLabels[key]) {
      return {
        label: specLabels[key].label,
        unit: specLabels[key].unit ?? inferUnit(key),
      };
    }
    // Snake case to readable
    const formatted = key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { label: formatted, unit: inferUnit(key) };
  };

  const renderValue = (value: any, unit?: string | null) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400 italic">Chưa xác định</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            value ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {value ? 'Có hỗ trợ' : 'Không'}
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, idx) => (
            <span
              key={idx}
              className="inline-block bg-blue-50 text-smart-blue border border-blue-200/60 text-xs font-medium px-2 py-0.5 rounded-md"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <span className="font-semibold text-slate-800 text-xs md:text-sm">
        {String(value)} {unit ? <span className="text-slate-500 font-normal">{unit}</span> : ''}
      </span>
    );
  };

  return (
    <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-sm text-smart-navy">
          Thông số kỹ thuật chi tiết {categoryName ? `(${categoryName})` : ''}
        </h3>
        <span className="text-xs text-slate-400">{entries.length} thông số</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-5 w-1/3">Thuộc tính kỹ thuật</th>
              <th className="py-2.5 px-5">Giá trị định mức</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
            {entries.map(([key, value], idx) => {
              const meta = getLabel(key);
              return (
                <tr
                  key={key}
                  className={`transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  } hover:bg-blue-50/40`}
                >
                  <td className="py-3 px-5 font-medium text-slate-600 align-top">
                    {meta.label}
                  </td>
                  <td className="py-3 px-5 align-top">
                    {renderValue(value, meta.unit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
