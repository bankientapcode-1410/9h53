import { create } from 'zustand';
import { CategoryTreeDTO } from '../features/product-catalog/types/product.types';
import { categoryService } from '../services/categoryService';

interface CategoryState {
  categories: CategoryTreeDTO[];
  selectedCategoryCode: string | null;
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  setSelectedCategoryCode: (code: string | null) => void;
  getLeafCategories: () => CategoryTreeDTO[];
  getCategoryByCode: (code: string) => CategoryTreeDTO | null;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  selectedCategoryCode: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryService.getCategoryTree();
      if (response.success && response.data) {
        set({ categories: response.data, isLoading: false });
      } else {
        set({ error: response.message || 'Không thể tải cây danh mục', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải danh mục', isLoading: false });
    }
  },

  setSelectedCategoryCode: (code: string | null) => {
    set({ selectedCategoryCode: code });
  },

  getLeafCategories: () => {
    const { categories } = get();
    const leaves: CategoryTreeDTO[] = [];

    const traverse = (nodes: CategoryTreeDTO[]) => {
      for (const node of nodes) {
        if (!node.children || node.children.length === 0) {
          leaves.push(node);
        } else {
          traverse(node.children);
        }
      }
    };

    traverse(categories);
    return leaves;
  },

  getCategoryByCode: (code: string) => {
    const { categories } = get();
    const normalized = code.toUpperCase();
    let found: CategoryTreeDTO | null = null;

    const find = (nodes: CategoryTreeDTO[]) => {
      for (const node of nodes) {
        if (node.category_code.toUpperCase() === normalized) {
          found = node;
          return;
        }
        if (node.children && node.children.length > 0) {
          find(node.children);
          if (found) return;
        }
      }
    };

    find(categories);
    return found;
  },
}));
