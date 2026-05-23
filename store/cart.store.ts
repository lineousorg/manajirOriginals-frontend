/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";
import { stockReservationService } from "@/services/stock-reservation.service";
import { getGuestToken, addToCart, removeFromCart } from "@/lib/cart";

// Minimal cart item interface to reduce localStorage size
interface MinimalCartItem {
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  hasDiscount?: boolean;
  finalPrice?: number;
  variantId: number | string;
  variantStock?: number;
  reservationId?: number;
  expiresAt?: string;
  quantity: number;
}

interface CartState {
  items: MinimalCartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  lastCartChange: number;
  addItem: (
    product: Product,
    variantId: number | string,
    quantity: number,
    reservationId?: number,
    expiresAt?: string
  ) => Promise<{ success: boolean; isExisting: boolean }>;
  removeItem: (
    productId: string | number,
    variantId: number | string,
    skipRelease?: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (
    productId: string | number,
    variantId: number | string,
    quantity: number
  ) => { success: boolean; message?: string };
  clearCart: () => Promise<void>;
  resetCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isItemInCart: (
    productId: string | number,
    variantId: number | string
  ) => boolean;
  getItemQuantity: (
    productId: string | number,
    variantId: number | string
  ) => number;
  getItemStock: (
    productId: string | number,
    variantId: number | string
  ) => number | undefined;
  getItemReservation: (
    productId: string | number,
    variantId: number | string
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
        variantId: number | string,
        quantity: number,
        reservationId,
        expiresAt
      ): Promise<{ success: boolean; isExisting: boolean }> => {
        return new Promise(async (resolve) => {
          const reserveVariantStock = async (
            variantId: number,
            reserveQuantity: number
          ) => {
            const accessToken =
              typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;

            if (accessToken) {
              return stockReservationService.reserveStock(
                variantId,
                reserveQuantity,
                15
              );
            }

            const guestToken = getGuestToken();
            if (!guestToken) {
              throw new Error("Guest token not initialized");
            }

            const result = await addToCart(variantId, reserveQuantity);
            if (result?.data) {
              return {
                success: true,
                data: result.data,
              };
            }

            return {
              success: false,
              error: "Failed to add to cart for guest user",
            };
          };

          const releaseReservationById = async (reservationId: number) => {
            const accessToken =
              typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;

            if (accessToken) {
              return stockReservationService.releaseReservation(reservationId);
            }

            const guestToken = getGuestToken();
            if (!guestToken) {
              throw new Error("Guest token not initialized");
            }

            const result = await removeFromCart(reservationId);
            return result?.data?.success === false
              ? { success: false, error: "Failed to release reservation" }
              : { success: true };
          };

          // Validate that we have a variantId
          if (!variantId) {
            console.error("Variant ID is required");
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
            selectedVariant = product.variants.find(
              (variant) => String(variant.id) === String(variantId)
            );

            if (!selectedVariant) {
              console.error(
                "No matching variant found for variantId:",
                variantId
              );
              resolve({ success: false, isExisting: false });
              return;
            }

            productPrice = selectedVariant.price || productPrice;
            hasDiscount = selectedVariant.hasDiscount || false;
            finalPrice = selectedVariant.finalPrice;
          }

          const availableVariantStock =
            selectedVariant?.availableStock ??
            selectedVariant?.stock ??
            product.availableStock ??
            product.stock ??
            0;

          const { items } = get();
          const existingIndex = items.findIndex(
            (item) =>
              String(item.productId) === String(product.id) &&
              String(item.variantId) === String(variantId)
          );

          if (existingIndex > -1) {
            isExisting = true;
            const newItems = [...items];
            const existingItem = newItems[existingIndex];
            const currentQuantity = existingItem.quantity;
            const nextQuantity = existingItem.quantity + quantity;
            const maxCartQuantity = currentQuantity + availableVariantStock;

            if (availableVariantStock > 0 && quantity > availableVariantStock) {
              console.error(
                "Requested additional quantity exceeds available stock:",
                quantity,
                "available:",
                availableVariantStock
              );
              resolve({ success: false, isExisting: false });
              return;
            }

            try {
              const existingReservationId = existingItem.reservationId;
              if (!existingReservationId) {
                console.error("No existing reservation ID available");
                resolve({ success: false, isExisting: false });
                return;
              }

              let replacementResult;

              if (nextQuantity <= availableVariantStock) {
                replacementResult = await reserveVariantStock(
                  selectedVariant?.id ?? 0,
                  nextQuantity
                );
                if (!replacementResult.success || !replacementResult.data) {
                  console.error(
                    "Stock reservation failed:",
                    replacementResult.error
                  );
                  resolve({ success: false, isExisting: false });
                  return;
                }

                const releaseResult = await releaseReservationById(
                  existingReservationId
                );
                if (!releaseResult.success) {
                  if (replacementResult.data?.reservationId) {
                    try {
                      await releaseReservationById(
                        replacementResult.data.reservationId
                      );
                    } catch (rollbackError) {
                      console.error(
                        "Failed to rollback replacement reservation:",
                        rollbackError
                      );
                    }
                  }
                  console.error(
                    "Failed to release previous reservation:",
                    releaseResult.error
                  );
                  resolve({ success: false, isExisting: false });
                  return;
                }
              } else {
                const releaseResult = await releaseReservationById(
                  existingReservationId
                );
                if (!releaseResult.success) {
                  console.error(
                    "Failed to release previous reservation:",
                    releaseResult.error
                  );
                  resolve({ success: false, isExisting: false });
                  return;
                }

                replacementResult = await reserveVariantStock(
                  selectedVariant?.id ?? 0,
                  nextQuantity
                );
                if (!replacementResult.success || !replacementResult.data) {
                  const restoreResult = await reserveVariantStock(
                    selectedVariant?.id ?? 0,
                    currentQuantity
                  );
                  if (restoreResult.success && restoreResult.data) {
                    existingItem.reservationId =
                      restoreResult.data.reservationId;
                    existingItem.expiresAt =
                      restoreResult.data.expiresAt ?? existingItem.expiresAt;
                  } else {
                    newItems.splice(existingIndex, 1);
                    set({
                      items: newItems,
                      isOpen: true,
                      lastCartChange: Date.now(),
                    });
                  }
                  console.error(
                    "Stock reservation failed after replacing reservation:",
                    replacementResult.error
                  );
                  resolve({ success: false, isExisting: false });
                  return;
                }
              }

              existingItem.quantity = nextQuantity;
              existingItem.variantStock = maxCartQuantity;
              existingItem.reservationId = replacementResult.data.reservationId;
              existingItem.expiresAt =
                replacementResult.data.expiresAt ?? existingItem.expiresAt;
            } catch (error) {
              console.error("Failed to reserve stock:", error);
              resolve({ success: false, isExisting: false });
              return;
            }

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
              const accessToken =
                typeof window !== "undefined"
                  ? localStorage.getItem("accessToken")
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
                const result = await addToCart(
                  selectedVariant?.id ?? 0,
                  quantity
                );
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
            variantId: variantId,
            variantStock: availableVariantStock,
            quantity,
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
        variantId: number | string,
        skipRelease = false
      ): Promise<{ success: boolean; message?: string }> => {
        return new Promise(async (resolve) => {
          const { items } = get();
          const itemToRemove = items.find(
            (item) =>
              String(item.productId) === String(productId) &&
              String(item.variantId) === String(variantId)
          );
          let releaseFailed = false;

          if (!skipRelease && itemToRemove?.reservationId) {
            if (itemToRemove.expiresAt) {
              const expiresAtTime = new Date(itemToRemove.expiresAt).getTime();
              const now = Date.now();
              if (expiresAtTime < now) {
              } else {
                try {
                  const accessToken =
                    typeof window !== "undefined"
                      ? localStorage.getItem("accessToken")
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
                  releaseFailed = true;
                }
              }
            } else {
              try {
                const accessToken =
                  typeof window !== "undefined"
                    ? localStorage.getItem("accessToken")
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
                releaseFailed = true;
              }
            }
          }

          set((state) => ({
            items: state.items.filter(
              (item) =>
                !(
                  String(item.productId) === String(productId) &&
                  String(item.variantId) === String(variantId)
                )
            ),
            lastCartChange: Date.now(),
          }));
          resolve(
            releaseFailed
              ? {
                  success: false,
                  message:
                    "Item was removed from your cart, but its stock reservation could not be fully released.",
                }
              : {
                  success: true,
                  message: "Item removed from your cart.",
                }
          );
        });
      },

      updateQuantity: (
        productId: string | number,
        variantId: number | string,
        quantity: number
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId)
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
            String(item.variantId) === String(variantId)
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
          .filter(
            (item) =>
              item.reservationId !== undefined && item.reservationId !== null
          )
          .map(async (item) => {
            try {
              const accessToken =
                typeof window !== "undefined"
                  ? localStorage.getItem("accessToken")
                  : null;

              if (accessToken) {
                await stockReservationService.releaseReservation(
                  item.reservationId!
                );
              } else {
                const guestToken = getGuestToken();
                if (guestToken) {
                  await removeFromCart(item.reservationId!);
                } else {
                  await stockReservationService.releaseReservation(
                    item.reservationId!
                  );
                }
              }
            } catch (error) {
              console.error("Failed to release reservation:", error);
            }
          });

        await Promise.all(releasePromises);
        set({ items: [], lastCartChange: Date.now() });
      },

      resetCart: () => set({ items: [], lastCartChange: Date.now() }),

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
        variantId: number | string
      ) => {
        const { items } = get();
        return items.some(
          (item) =>
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId)
        );
      },

      getItemQuantity: (
        productId: string | number,
        variantId: number | string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId)
        );
        return item?.quantity || 0;
      },

      getItemStock: (
        productId: string | number,
        variantId: number | string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId)
        );
        return item?.variantStock;
      },

      getItemReservation: (
        productId: string | number,
        variantId: number | string
      ) => {
        const { items } = get();
        const item = items.find(
          (item) =>
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId)
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
      name: "cart-storage",
    }
  )
);
