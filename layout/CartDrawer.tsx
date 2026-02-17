"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";

import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { SignupModal } from "@/components/auth/SignupModal";
import Link from "next/link";

export const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotal } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Reset signup modal when cart closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow animation to complete
      const timer = setTimeout(() => {
        setShowSignupModal(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Close cart and show signup modal
      closeCart();
      // Use setTimeout to ensure cart closes first, then show modal
      setTimeout(() => {
        setShowSignupModal(true);
      }, 350);
    } else {
      // User is logged in, proceed to checkout
      window.location.href = "/checkout";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="font-serif text-lg sm:text-xl text-gray-800">
                    Your Bag
                  </h2>
                  <span className="text-sm text-gray-700">
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X size={20} className="text-gray-800" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                      <ShoppingBag size={32} className="text-gray-700" />
                    </div>
                    <h3 className="font-serif text-xl text-gray-800 mb-2">
                      Your bag is empty
                    </h3>
                    <p className="text-sm text-gray-700 mb-6 max-w-xs">
                      Looks like you haven&apos;t added any items to your bag
                      yet.
                    </p>
                    <button
                      onClick={closeCart}
                      className="btn-primary-fashion rounded-full"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-6">
                    {items.map((item) => (
                      <motion.li
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-4 bg-card/50 p-3 rounded-xl"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-20 h-24 sm:w-24 sm:h-32 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-label">{item.product.brand}</p>
                              <h4 className="font-medium text-sm sm:text-base text-gray-800 mt-0.5 line-clamp-2">
                                {item.product.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                                {item.selectedSize} · {item.selectedColor}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                removeItem(
                                  item.product.id,
                                  item.selectedSize,
                                  item.selectedColor,
                                )
                              }
                              className="p-1.5 hover:bg-muted rounded-full transition-colors text-gray-700 hover:text-destructive flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-auto pt-2 flex items-center justify-between">
                            <div className="flex items-center border border-border rounded-full text-gray-400">
                              <button
                                onClick={() => {
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.selectedColor,
                                    item.quantity - 1,
                                  );
                                }}
                                disabled={item.quantity <= 1}
                                className="p-2 hover:bg-muted transition-colors disabled:opacity-50 rounded-l-full"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 text-sm text-gray-500 font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.selectedColor,
                                    item.quantity + 1,
                                  );
                                }}
                                className="p-2 hover:bg-muted transition-colors rounded-r-full text-gray-400"
                                aria-label="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <p className="font-medium text-gray-800">
                              ৳{(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-border p-4 sm:p-6 space-y-4 bg-card/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="text-xl font-medium text-gray-800">
                      ৳{getTotal().toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 text-center">
                    Shipping and taxes calculated at checkout
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/cart"
                      onClick={closeCart}
                      className="btn-outline-fashion rounded-full text-center text-xs sm:text-sm"
                    >
                      View Bag
                    </Link>
                    <button
                      onClick={handleCheckout}
                      className="btn-primary-fashion rounded-full text-center text-xs sm:text-sm"
                    >
                      Checkout
                    </button>
                  </div>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-sm text-gray-700 hover:text-gray-800 transition-colors py-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signup Modal - rendered independently */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  );
};
