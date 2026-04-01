/* eslint-disable @typescript-eslint/no-explicit-any */
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
  variantStock?: number; // Stock at time of adding to cart for validation
  reservationId?: number; // Stock reservation ID from backend
  expiresAt?: string; // Reservation expiration timestamp
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartState {
  items: MinimalCartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  lastCartChange: number; // Timestamp for tracking cart changes
  addItem: (product: Product, size: string, color: string, quantity?: number, reservationId?: number, expiresAt?: string) => { success: boolean; isExisting: boolean };
  removeItem: (productId: string | number, size: string, color: string) => void;
  updateQuantity: (productId: string | number, size: string, color: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isItemInCart: (productId: string | number, size: string, color: string) => boolean;
  getItemQuantity: (productId: string | number, size: string, color: string) => number;
  getItemStock: (productId: string | number, size: string, color: string) => number | undefined;
  getItemReservation: (productId: string | number, size: string, color: string) => { reservationId?: number; expiresAt?: string } | undefined;
  setHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isHydrated: false,
      lastCartChange: 0,

      addItem: (product, size, color, quantity = 1, reservationId, expiresAt): { success: boolean; isExisting: boolean } => {
        // Return type: { success: boolean, isExisting: boolean }
        // - { success: true, isExisting: true } = existing item updated
        // - { success: true, isExisting: false } = new item added
        // - { success: false, isExisting: false } = validation failed
        
        // Determine if product has variants (sizes/colors defined in variants)
        const hasVariants = (product.variants?.length ?? 0) > 0;
        const hasSizes = (product.sizes?.length ?? 0) > 0;
        const hasColorsDefined = (product.colors?.length ?? 0) > 0;
        
        // If product has variants, size is required
        if (hasVariants && hasSizes && !size) {
          console.error('Size is required for this product');
          return { success: false, isExisting: false };
        }
        
        // Color check: if product has explicit colors array OR has variants with color attributes
        const hasColorAttributesInVariants = hasVariants && product.variants?.some((v: any) => 
          v.attributes?.some((a: any) => a.attributeValue?.attribute?.name === "Color")
        );
        
        if ((hasColorsDefined || hasColorAttributesInVariants) && !color) {
          console.error('Color is required for this product');
          return { success: false, isExisting: false };
        }
        
        let isExisting = false;
        
        // Extract minimal product data to reduce storage size
        const productImage = product.images?.[0]?.url || product.thumbnail || '';
        
        // Find the variant that matches the selected size and color
        // This is critical for correct variantId and price
        let selectedVariant = null;
        let productPrice = product.price || product.maxPrice || product.minPrice || 0;
        
        if (product.variants && product.variants.length > 0) {
          // If product has variants, we MUST find a matching one
          // Normalize the inputs for comparison
          const normalizedSize = size?.trim();
          const normalizedColor = color?.trim();
          
          selectedVariant = product.variants.find((variant) => {
            const variantSizeAttr = variant.attributes?.find(
              (attr) => attr.attributeValue?.attribute?.name === "Size"
            );
            const variantColorAttr = variant.attributes?.find(
              (attr) => attr.attributeValue?.attribute?.name === "Color"
            );
            
            const variantSize = variantSizeAttr?.attributeValue?.value?.trim();
            const variantColor = variantColorAttr?.attributeValue?.value?.trim();
            
            // Check if both size and color match
            // If size is provided, it must match. If not provided (One Size), skip size check
            const sizeMatch = !normalizedSize || normalizedSize === "One Size" || variantSize === normalizedSize;
            // If color is provided and not "Default", it must match
            const colorMatch = !normalizedColor || normalizedColor === "Default" || variantColor === normalizedColor;
            
            return sizeMatch && colorMatch;
          });
          
          if (!selectedVariant) {
            // Product has variants but no matching one found - log for debugging
            console.error('No matching variant found for size:', size, 'color:', color);
            console.error('Available variants:', product.variants.map((v: any) => ({
              id: v.id,
              size: v.attributes?.find((a: any) => a.attributeValue?.attribute?.name === "Size")?.attributeValue?.value,
              color: v.attributes?.find((a: any) => a.attributeValue?.attribute?.name === "Color")?.attributeValue?.value
            })));
            return { success: false, isExisting: false };
          }
          
          // Use the matched variant's price
          productPrice = selectedVariant.price || productPrice;
        }
        
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
            return { items: newItems, isOpen: true, lastCartChange: Date.now() };
          }

          // Store minimal data only - use the CORRECT variantId
          const newItem: MinimalCartItem = {
            productId: product.id,
            productName: product.name || 'Product',
            productImage,
            productPrice,
            variantId: selectedVariant?.id, // Use the matched variant ID, not first variant!
            variantStock: selectedVariant?.stock ?? product.stock ?? 0, // Store stock for validation
            quantity,
            selectedSize: size,
            selectedColor: color,
            reservationId, // Stock reservation ID from backend
            expiresAt, // Reservation expiration timestamp
          };

          return {
            items: [...state.items, newItem],
            isOpen: true,
            lastCartChange: Date.now(),
          };
        });
        
        // Return success=true, and isExisting tells us if it was an update or new add
        return { success: true, isExisting };
      },

      removeItem: (productId, size, color) => {
        // Get the item before removing to check for reservation
        const { items } = get();
        const itemToRemove = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        
        // If there's a reservation, we should release it
        // Note: The actual API call to release should be done from the component
        // This just removes from local state
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                String(item.productId) === String(productId) &&
                item.selectedSize === size &&
                item.selectedColor === color
              )
          ),
          lastCartChange: Date.now(),
        }));
      },

      updateQuantity: (productId, size, color, quantity) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        
        // Validate stock if we have stock information
        if (item?.variantStock !== undefined && item.variantStock > 0) {
          // Check if new quantity exceeds available stock
          if (quantity > item.variantStock) {
            return { 
              success: false, 
              message: `Only ${item.variantStock} items available in stock` 
            };
          }
        }
        
        // Prevent negative quantity
        if (quantity < 1) {
          return { success: false, message: 'Quantity cannot be less than 1' };
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
          lastCartChange: Date.now(),
        }));
        
        return { success: true };
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

      getItemQuantity: (productId: string | number, size: string, color: string) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        return item?.quantity ?? 0;
      },

      getItemStock: (productId: string | number, size: string, color: string) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        return item?.variantStock;
      },

      getItemReservation: (productId: string | number, size: string, color: string) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        if (item) {
          return {
            reservationId: item.reservationId,
            expiresAt: item.expiresAt,
          };
        }
        return undefined;
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
