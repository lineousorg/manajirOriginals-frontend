/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";
import { stockReservationService } from "@/services/stock-reservation.service";
import { getGuestToken, addToCart, removeFromCart, clearGuestToken } from "@/lib/cart";

// Minimal cart item interface to reduce localStorage size
interface MinimalCartItem {
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  hasDiscount?: boolean;
  finalPrice?: number;
  variantId?: number | string;
  variantStock?: number;
  reservationId?: number;
  expiresAt?: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartState {
  items: MinimalCartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  lastCartChange: number;
  addItem: (
    product: Product,
    size: string,
    color: string,
    quantity?: number,
    reservationId?: number,
    expiresAt?: string
  ) => Promise<{ success: boolean; isExisting: boolean }>;
  removeItem: (
    productId: string | number,
    size: string,
    color: string,
    skipRelease?: boolean
  ) => Promise<void>;
  updateQuantity: (
    productId: string | number,
    size: string,
    color: string,
    quantity: number
  ) => { success: boolean; message?: string };
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isItemInCart: (
    productId: string | number,
    size: string,
    color: string
  ) => boolean;
  getItemQuantity: (
    productId: string | number,
    size: string,
    color: string
  ) => number;
  getItemStock: (
    productId: string | number,
    size: string,
    color: string
  ) => number | undefined;
  getItemReservation: (
    productId: string | number,
    size: string,
    color: string
  ) => { reservationId?: number; expiresAt?: string } | undefined;
  setHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isHydrated: false,
      lastCartChange: 0,

      addItem: (
        product,
        size,
        color,
        quantity = 1,
        reservationId,
        expiresAt
      ): Promise<{ success: boolean; isExisting: boolean }> => {
        return new Promise(async (resolve) => {
          const hasVariants = (product.variants?.length ?? 0) > 0;
          const hasSizes = (product.sizes?.length ?? 0) > 0;
          const hasColorsDefined = (product.colors?.length ?? 0) > 0;

          if (hasVariants && hasSizes && !size) {
            console.error("Size is required for this product");
            resolve({ success: false, isExisting: false });
            return;
          }

          const hasColorAttributesInVariants =
            hasVariants &&
            product.variants?.some((v: any) =>
              v.attributes?.some(
                (a: any) => a.attributeValue?.attribute?.name === "Color"
              )
            );

          if ((hasColorsDefined || hasColorAttributesInVariants) && !color) {
            console.error("Color is required for this product");
            resolve({ success: false, isExisting: false });
            return;
          }

          let isExisting = false;

          const productImage =
            product.images?.[0]?.url || product.thumbnail || "";

          let selectedVariant = null;
          let productPrice =
            product.price || product.maxPrice || product.minPrice || 0;
          let hasDiscount = false;
          let finalPrice: number | undefined;

          if (product.variants && product.variants.length > 0) {
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
              const variantColor =
                variantColorAttr?.attributeValue?.value?.trim();

              const sizeMatch =
                !normalizedSize ||
                normalizedSize === "One Size" ||
                variantSize === normalizedSize;
              const colorMatch =
                !normalizedColor ||
                normalizedColor === "Default" ||
                variantColor === normalizedColor;

              return sizeMatch && colorMatch;
            });

            if (!selectedVariant) {
              console.error(
                "No matching variant found for size:",
                size,
                "color:",
                color
              );
              resolve({ success: false, isExisting: false });
              return;
            }

            productPrice = selectedVariant.price || productPrice;
            hasDiscount = selectedVariant.hasDiscount || false;
            finalPrice = selectedVariant.finalPrice;
          }

          const { items } = get();
          const existingIndex = items.findIndex(
            (item) =>
              String(item.productId) === String(product.id) &&
              item.selectedSize === size &&
              item.selectedColor === color
          );

          if (existingIndex > -1) {
            isExisting = true;
            const newItems = [...items];
            newItems[existingIndex].quantity += quantity;
            set({
              items: newItems,
              isOpen: true,
              lastCartChange: Date.now(),
            });
            resolve({ success: true, isExisting });
            return;
          }

          let newReservationId = reservationId;
          let newExpiresAt = expiresAt;

          if (!reservationId) {
             try {
               const accessToken = typeof window !== 'undefined'
                 ? localStorage.getItem('accessToken')
                 : null;

               if (accessToken) {
                 const result = await stockReservationService.reserveStock(
                   selectedVariant?.id ?? 0,
                   quantity,
                   15
                 );
                 if (result.success && result.data) {
                   newReservationId = result.data.reservationId;
                   newExpiresAt = result.data.expiresAt;
                 } else {
                   console.error("Stock reservation failed:", result.error);
                   resolve({ success: false, isExisting: false });
                   return;
                 }
               } else {
                 const guestToken = getGuestToken();
                 if (!guestToken) {
                   throw new Error("Guest token not initialized");
                 }
                 const result = await addToCart(selectedVariant?.id ?? 0, quantity);
                 if (result && result.data) {
                   newReservationId = result.data.reservationId;
                   newExpiresAt = result.data.expiresAt;
                 } else {
                   console.error("Failed to add to cart for guest user");
                   resolve({ success: false, isExisting: false });
                   return;
                 }
               }
             } catch (error) {
               console.error("Failed to reserve stock:", error);
               resolve({ success: false, isExisting: false });
               return;
             }
           }

           // Only add to cart if reservation was successful
           if (!newReservationId) {
             console.error("No reservation ID available");
             resolve({ success: false, isExisting: false });
             return;
           }

           const newItem: MinimalCartItem = {
             productId: product.id,
             productName: product.name || "Product",
             productImage,
             productPrice,
             hasDiscount,
             finalPrice,
             variantId: selectedVariant?.id,
             variantStock: selectedVariant?.stock ?? product.stock ?? 0,
             quantity,
             selectedSize: size,
             selectedColor: color,
             reservationId: newReservationId,
             expiresAt: newExpiresAt,
           };

           set({
             items: [...items, newItem],
             isOpen: true,
             lastCartChange: Date.now(),
           });
           resolve({ success: true, isExisting: false });
        });
      },

      removeItem: (
        productId: string | number,
        size: string,
        color: string,
        skipRelease = false
      ): Promise<void> => {
        return new Promise(async (resolve) => {
          const { items } = get();
          const itemToRemove = items.find(
            (item) =>
              String(item.productId) === String(productId) &&
              item.selectedSize === size &&
              item.selectedColor === color
          );

          if (!skipRelease && itemToRemove?.reservationId) {
            if (itemToRemove.expiresAt) {
              const expiresAtTime = new Date(itemToRemove.expiresAt).getTime();
              const now = Date.now();
              if (expiresAtTime < now) {
              } else {
                try {
                  const accessToken = typeof window !== 'undefined'
                    ? localStorage.getItem('accessToken')
                    : null;

                  if (accessToken) {
                    await stockReservationService.releaseReservation(
                      itemToRemove.reservationId
                    );
                  } else {
                    const guestToken = getGuestToken();
                    if (guestToken) {
                      await removeFromCart(itemToRemove.reservationId);
                    } else {
                      await stockReservationService.releaseReservation(
                        itemToRemove.reservationId
                      );
                    }
                  }
                } catch (error) {
                  console.error("[DEBUG] Error releasing reservation:", error);
                }
              }
            } else {
              try {
                const accessToken = typeof window !== 'undefined'
                  ? localStorage.getItem('accessToken')
                  : null;

                if (accessToken) {
                  await stockReservationService.releaseReservation(
                    itemToRemove.reservationId
                  );
                } else {
                  const guestToken = getGuestToken();
                  if (guestToken) {
                    await removeFromCart(itemToRemove.reservationId);
                  } else {
                    await stockReservationService.releaseReservation(
                      itemToRemove.reservationId
                    );
                  }
                }
              } catch (error) {
                console.error("Failed to release reservation:", error);
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
          resolve();
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        if (item?.variantStock !== undefined && item.variantStock > 0) {
          if (quantity > item.variantStock) {
            return {
              success: false,
              message: `Only ${item.variantStock} items available in stock`,
            };
          }
        }

        if (quantity < 1) {
          return { success: false, message: "Quantity cannot be less than 1" };
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
        const { items } = get();

        const releasePromises = items
          .filter((item) => item.reservationId !== undefined && item.reservationId !== null)
          .map(async (item) => {
            try {
              const accessToken = typeof window !== 'undefined'
                ? localStorage.getItem('accessToken')
                : null;

              if (accessToken) {
                await stockReservationService.releaseReservation(item.reservationId!);
              } else {
                const guestToken = getGuestToken();
                if (guestToken) {
                  await removeFromCart(item.reservationId!);
                } else {
                  await stockReservationService.releaseReservation(item.reservationId!);
                }
              }
            } catch (error) {
              console.error("Failed to release reservation:", error);
            }
          });

        await Promise.all(releasePromises);
        set({ items: [], lastCartChange: Date.now() });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price =
            item.hasDiscount && item.finalPrice
              ? item.finalPrice
              : item.productPrice;
          return total + Number(price) * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      isItemInCart: (
        productId: string | number,
        size: string,
        color: string
      ) => {
        const { items } = get();
        return items.some(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
      },

      getItemQuantity: (
        productId: string | number,
        size: string,
        color: string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        return item?.quantity || 0;
      },

      getItemStock: (
        productId: string | number,
        size: string,
        color: string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        return item?.variantStock;
      },

      getItemReservation: (
        productId: string | number,
        size: string,
        color: string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            item.selectedSize === size &&
            item.selectedColor === color
        );
        return item?.reservationId
          ? { reservationId: item.reservationId, expiresAt: item.expiresAt }
          : undefined;
      },

      setHydrated: (state: boolean) => {
        set({ isHydrated: state });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
