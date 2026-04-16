/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import { stockReservationService } from '@/services/stock-reservation.service';

// Minimal cart item interface to reduce localStorage size
interface MinimalCartItem {
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  hasDiscount?: boolean;
  finalPrice?: number;
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
  removeItem: (productId: string | number, size: string, color: string, skipRelease?: boolean) => void;
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
        let hasDiscount = false;
        let finalPrice: number | undefined;
        
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
          // Store discount info if available
          hasDiscount = selectedVariant.hasDiscount || false;
          finalPrice = selectedVariant.finalPrice;
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
            hasDiscount,
            finalPrice,
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

      removeItem: async (productId, size, color, skipRelease = false) => {
        // Get the item before removing to check for reservation
        const { items } = get();
        const itemToRemove = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        
        // If there's a reservation and skipRelease is false, release it before removing
        // Note: skipRelease is used when the caller (like CartDrawer) has already handled the release
        if (!skipRelease && itemToRemove?.reservationId) {
          // Check if reservation has already expired
          if (itemToRemove.expiresAt) {
            const expiresAtTime = new Date(itemToRemove.expiresAt).getTime();
            const now = Date.now();
            if (expiresAtTime < now) {
              console.log('[DEBUG] Reservation already expired, skipping release:', itemToRemove.reservationId);
            } else {
              console.log('[DEBUG] Releasing reservation:', itemToRemove.reservationId, 'expires:', itemToRemove.expiresAt);
              try {
                const result = await stockReservationService.releaseReservation(itemToRemove.reservationId);
                if (!result.success) {
                  console.error('[DEBUG] Failed to release reservation:', result.error);
                } else {
                  console.log('[DEBUG] Successfully released reservation:', itemToRemove.reservationId);
                }
              } catch (error) {
                console.error('[DEBUG] Error releasing reservation:', error);
              }
            }
          } else {
            console.log('[DEBUG] No expiresAt, releasing reservation:', itemToRemove.reservationId);
            try {
              await stockReservationService.releaseReservation(itemToRemove.reservationId);
            } catch (error) {
              console.error('Failed to release reservation:', error);
            }
          }
        }

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

      clearCart: async () => {
        // Get all items with reservations and release them
        const { items } = get();
        
        // Release all reservations in parallel
        const releasePromises = items
          .filter((item) => item.reservationId)
          .map((item) =>
            stockReservationService.releaseReservation(item.reservationId!).catch((error) => {
              console.error('Failed to release reservation:', error);
            })
          );
        
        await Promise.all(releasePromises);
        set({ items: [], lastCartChange: Date.now() });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotal: () => {
        const { items } = get();
        // Use finalPrice for discounted items, otherwise use productPrice
        return items.reduce((total, item) => {
          const price = item.hasDiscount && item.finalPrice ? item.finalPrice : item.productPrice;
          return total + (Number(price) * item.quantity);
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
