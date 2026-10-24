import React from 'react';
import {
  Cpu,
  Layers,
  HardDrive,
  Tv,
  Zap,
  Box,
  Fan,
  ChevronRight,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { CategoryTreeDTO } from '../types/product.types';

interface CategoryHierarchyNavProps {
  categories: CategoryTreeDTO[];
  selectedCategoryCode?: string;
  onSelectCategory: (code: string | null) => void;
}

// Icon helper by category code
const getCategoryIcon = (code: string) => {
  switch (code.toUpperCase()) {
    case 'CPU':
      return <Cpu className="w-4 h-4" />;
    case 'MOTHERBOARD':
      return <Layers className="w-4 h-4" />;
    case 'RAM':
      return <Box className="w-4 h-4" />;
    case 'GPU':
      return <Tv className="w-4 h-4" />;
    case 'SSD_M2':
      return <HardDrive className="w-4 h-4" />;
    case 'PSU':
      return <Zap className="w-4 h-4" />;
    case 'CASE':
      return <Box className="w-4 h-4" />;
    case 'CPU_COOLER':
      return <Fan className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const CategoryHierarchyNav: React.FC<CategoryHierarchyNavProps> = ({
  categories,
  selectedCategoryCode,
  onSelectCategory,
}) => {
  // Flatten leaf categories for easy horizontal scrolling or tabs
  const leafCategories: { parentName?: string; node: CategoryTreeDTO }[] = [];
  let currentCategoryName = 'Tất cả linh kiện';
  let parentCategoryName = '';

  for (const group of categories) {
    if (group.children && group.children.length > 0) {
      for (const leaf of group.children) {
        leafCategories.push({ parentName: group.category_name, node: leaf });
        if (leaf.category_code.toUpperCase() === selectedCategoryCode?.toUpperCase()) {
          currentCategoryName = leaf.category_name;
          parentCategoryName = group.category_name;
        }
      }
    } else {
      leafCategories.push({ node: group });
      if (group.category_code.toUpperCase() === selectedCategoryCode?.toUpperCase()) {
        currentCategoryName = group.category_name;
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium overflow-x-auto py-1">
        <button
          onClick={() => onSelectCategory(null)}
          className="hover:text-smart-blue transition whitespace-nowrap"
        >
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        <span className="whitespace-nowrap">Linh kiện máy tính</span>

        {parentCategoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="text-slate-600 whitespace-nowrap">{parentCategoryName}</span>
          </>
        )}

        {selectedCategoryCode && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="text-smart-blue font-bold whitespace-nowrap">{currentCategoryName}</span>
          </>
        )}
      </nav>

      {/* Horizontal Category Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition shadow-sm border ${
            !selectedCategoryCode
              ? 'bg-smart-blue text-white border-smart-blue shadow-blue-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Tất cả linh kiện</span>
        </button>

        {leafCategories.map(({ node }) => {
          const isActive = selectedCategoryCode?.toUpperCase() === node.category_code.toUpperCase();
          return (
            <button
              key={node.category_id}
              onClick={() => onSelectCategory(node.category_code)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition shadow-sm border ${
                isActive
                  ? 'bg-smart-blue text-white border-smart-blue shadow-blue-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {getCategoryIcon(node.category_code)}
              <span>{node.category_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
