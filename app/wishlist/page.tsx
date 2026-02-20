"use client"
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

const WishlistPage = () => {
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (productId: string | number) => {
    const item = items.find((i) => String(i.product.id) === String(productId));
    if (!item) return;
    const { product } = item;
    addToCart(product, product.sizes?.[0] || "One Size", product.colors?.[0]?.name || "Default", 1);
    removeItem(String(productId));
  };

  if (items.length === 0) {
    return (
      <div className="container-fashion py-16">
        <EmptyState
          icon={<Heart size={64} />}
          title="Your wishlist is empty"
          description="Save your favorite items to revisit them later."
          action={
            <Link href="/products" className="btn-primary-fashion">
              Explore Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-fashion py-8 md:py-12">
      <h1 className="heading-section mb-8">Wishlist ({items.length})</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <motion.article
            key={item.product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-muted">
              <Link href={`/products/${item.product.id}`}>
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(String(item.product.id))}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                aria-label="Remove from wishlist"
              >
                <X size={18} />
              </button>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {item.product.isNew && <span className="badge-new">New</span>}
                {item.product.isSale && <span className="badge-sale">Sale</span>}
              </div>

              {/* Add to Cart */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button
                  onClick={() => handleAddToCart(String(item.product.id))}
                  className="btn-primary-fashion w-full text-sm py-2"
                >
                  <ShoppingBag size={16} className="mr-2" />
                  Add to Bag
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-label">{item.product.brand}</p>
              <h3 className="font-medium">
                <Link
                  href={`/products/${item.product.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {item.product.name}
                </Link>
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-medium">৳{item.product.price}</span>
                {item.product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ৳{item.product.originalPrice}
                  </span>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
