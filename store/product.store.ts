import { ApiProduct } from "@/types";
import { create } from "zustand";

interface ProductCache {
  products: ApiProduct[];
  total: number;
  totalPages: number;
}

interface ProductStore {
  // Single page cache (for backward compatibility)
  products: ApiProduct[];
  setProducts: (products: ApiProduct[]) => void;
  clearProducts: () => void;
  
  // Multi-page cache
  pageCache: Record<number, ProductCache>; // keyed by page number
  setPageCache: (page: number, data: ProductCache) => void;
  getPageCache: (page: number) => ProductCache | undefined;
  clearPageCache: () => void;
  
  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  // Single page cache
  products: [],
  setProducts: (products) => set({ products }),
  clearProducts: () => set({ products: [], pageCache: {}, isLoading: false }),
  
  // Multi-page cache
  pageCache: {},
  setPageCache: (page, data) => 
    set((state) => ({
      pageCache: {
        ...state.pageCache,
        [page]: data,
      }
    })),
  getPageCache: (page) => get().pageCache[page],
  clearPageCache: () => set({ pageCache: {} }),
  
  // Loading state
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
