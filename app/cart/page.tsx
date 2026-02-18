"use client";
import { motion } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = 
    useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal + shipping;



  if (items.length === 0) {
    return (
      <div className="container-fashion py-16">
        <EmptyState
          icon={<ShoppingBag size={64} />}
          title="Your bag is empty"
          description="Looks like you haven't added anything to your bag yet."
          action={
            <Link href="/products" className="btn-primary-fashion">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-fashion py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="heading-section">Shopping Bag</h1>
        <button
          onClick={clearCart}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 md:gap-6 pb-6 border-b border-border"
            >
              <Link
                href={`/products/${item.product.id}`}
                className="w-20 h-24 md:w-28 md:h-36 flex-shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-label">{item.product.brand}</p>
                    <Link
                      href={`/products/${item.product.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.selectedSize} · {item.selectedColor}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeItem(
                        item.product.id,
                        item.selectedSize,
                        item.selectedColor
                      )
                    }
                    className="p-2 hover:bg-muted rounded-full transition-colors h-fit"
                    aria-label="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center border border-border rounded-md">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize,
                          item.selectedColor,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize,
                          item.selectedColor,
                          item.quantity + 1
                        )
                      }
                      className="p-2 hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-lg font-medium">
                    ৳{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <div className="bg-muted/30 rounded-xl p-4 md:p-6">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `৳${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Free shipping on orders over ৳150
                </p>
              )}
              <div className="border-t border-border pt-4 flex justify-between text-base font-medium">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary-fashion w-full mt-6">
              Proceed to Checkout
              <ArrowRight size={18} className="ml-2" />
            </Link>

            <Link
              href="/products"
              className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;
