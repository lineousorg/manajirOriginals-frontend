import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

// Minimal cart item interface to reduce localStorage size
interface MinimalCartItem {
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  variantId?: number | string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartState {
  items: MinimalCartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  addItem: (product: Product, size: string, color: string, quantity?: number) => boolean;
  removeItem: (productId: string | number, size: string, color: string) => void;
  updateQuantity: (productId: string | number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isItemInCart: (productId: string | number, size: string, color: string) => boolean;
  setHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isHydrated: false,

      addItem: (product, size, color, quantity = 1) => {
        let isExisting = false;
        
        // Extract minimal product data to reduce storage size
        const productImage = product.images?.[0]?.url || product.thumbnail || '';
        
        // Get the correct price - check multiple sources like the product detail page does
        // Priority: selectedVariant (first variant for now), product.price, product.maxPrice
        const productPrice = 
          product.variants?.[0]?.price ||
          product.price ||
          product.maxPrice ||
          product.minPrice ||
          0;
        
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              String(item.productId) === String(product.id) &&
              item.selectedSize === size &&
              item.selectedColor === color
          );

          if (existingIndex > -1) {
            isExisting = true;
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems, isOpen: true };
          }

          // Store minimal data only
          const newItem: MinimalCartItem = {
            productId: product.id,
            productName: product.name || 'Product',
            productImage,
            productPrice,
            variantId: product.variants?.[0]?.id,
            quantity,
            selectedSize: size,
            selectedColor: color,
          };

          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
        return isExisting;
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                String(item.productId) === String(productId) &&
                item.selectedSize === size &&
                item.selectedColor === color
              )
          ),
        }));
      },

      updateQuantity: (productId, size, color, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotal: () => {
        const { items } = get();
        // Simple calculation using stored price - no variant lookup needed
        return items.reduce((total, item) => {
          return total + (Number(item.productPrice) * item.quantity);
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      isItemInCart: (productId: string | number, size: string, color: string) => {
        const { items } = get();
        return items.some(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
      },

      setHydrated: (state: boolean) => set({ isHydrated: state }),
    }),
    {
      name: 'cart-storage',
      onRehydrateStorage: () => (state) => {
        // Mark store as hydrated after rehydration completes
        state?.setHydrated(true);
      },
    }
  )
);
