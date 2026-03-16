import { Category } from "@/types";
import { create } from "zustand";

interface CategoryStore {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  clearCategories: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  clearCategories: () => set({ categories: [], isLoading: false }),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
