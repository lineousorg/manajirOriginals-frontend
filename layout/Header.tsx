"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ChevronRight,
  Search,
  Menu,
  X,
  ShoppingBag,
  User,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategories, useCategoryProductCounts } from "@/hooks/useProduct";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Collection", hasDropdown: true },
  { href: "/cart", label: "Cart" },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItems = useWishlistStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const { isAuthenticated, user } = useAuthStore();
  const { categories, categoryTree } = useCategories(60_000);
  const { getCountBySlug } = useCategoryProductCounts(60_000);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;

      setIsScrolled(current > 50);
      setLastScrollY(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  if (pathname === "/login") return null;

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: 0,
          backgroundColor: isScrolled
            ? "rgba(10, 10, 10, 0.85)"
            : "rgba(10, 10, 10, 0)",
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-[9999] backdrop-blur-md border-b transition-colors duration-500 ${
          isScrolled ? "border-white/10" : "border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Mobile Menu + Logo */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={20} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={20} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Logo */}
              <Link href="/" className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-start"
                >
                  <span className="text-2xl font-light tracking-[0.2em] text-white uppercase font-serif">
                    Manajir
                  </span>
                  {/* <span className="text-[9px] tracking-[0.4em] text-white/40 uppercase -mt-1">
                    Atelier
                  </span> */}
                </motion.div>
                <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-white/60 to-transparent group-hover:w-full transition-all duration-500" />
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link, index) => (
                <div
                  key={link.href + link.label}
                  className="relative"
                  onMouseEnter={() =>
                    link.hasDropdown && setActiveDropdown(link.label)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className="group relative py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors duration-300"
                  >
                    <span className="relative z-10">{link.label}</span>

                    {/* Animated underline */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-[1px] bg-white"
                      initial={{
                        width: pathname === link.href ? "100%" : "0%",
                      }}
                      animate={{
                        width: pathname === link.href ? "100%" : "0%",
                      }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {/* Hover glow */}
                    <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
                    </div>
                  </Link>

                  {/* Mega Dropdown */}
                  <AnimatePresence>
                    {link.hasDropdown && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-6"
                      >
                        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden min-w-[600px]">
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
                                Browse Categories
                              </span>
                              <div className="h-[1px] flex-1 ml-4 bg-gradient-to-r from-white/10 to-transparent" />
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                              {categoryTree.map((category, idx) => (
                                <motion.div
                                  key={category.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group/cat"
                                >
                                  <Link
                                    href={"/products/category/" + category.slug}
                                    className="block mb-4"
                                  >
                                    <span className="text-sm font-medium text-white/90 group-hover/cat:text-white transition-colors flex items-center gap-2">
                                      {category.name}
                                      <ChevronRight
                                        size={12}
                                        className="opacity-0 -translate-x-2 group-hover/cat:opacity-100 group-hover/cat:translate-x-0 transition-all duration-300"
                                      />
                                    </span>
                                  </Link>

                                  {category.children &&
                                    category.children.length > 0 && (
                                      <ul className="space-y-2">
                                        {category.children
                                          .slice(0, 4)
                                          .map((child) => (
                                            <li key={child.id}>
                                              <Link
                                                href={
                                                  "/products/category/" +
                                                  child.slug
                                                }
                                                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center justify-between group/item"
                                              >
                                                <span>{child.name}</span>
                                                <span className="text-[10px] text-white/20 group-hover/item:text-white/40 transition-colors">
                                                  {getCountBySlug(child.slug)}
                                                </span>
                                              </Link>
                                            </li>
                                          ))}
                                      </ul>
                                    )}
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Dropdown Footer */}
                          <div className="bg-white/5 px-8 py-4 flex items-center justify-between">
                            <span className="text-[10px] text-white/30 tracking-wider">
                              {categories.length} Categories • New arrivals
                              weekly
                            </span>
                            <Link
                              href="/products"
                              className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
                            >
                              View All
                              <ArrowRight
                                size={12}
                                className="group-hover:translate-x-1 transition-transform"
                              />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                aria-label="Search"
              >
                <Search size={18} />
              </motion.button>

              {/* Wishlist */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/wishlist"
                  className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                  aria-label="Wishlist"
                >
                  <Heart
                    size={18}
                    className="transition-transform group-hover:scale-110"
                  />
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCart}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                aria-label="Cart"
              >
                <ShoppingBag
                  size={18}
                  className="transition-transform group-hover:scale-110"
                />
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Profile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={isAuthenticated ? "/profile" : "/login"}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors overflow-hidden group"
                  aria-label="Profile"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User
                      size={18}
                      className="text-white/70 group-hover:text-white transition-colors"
                    />
                  )}

                  {/* Online indicator */}
                  {isAuthenticated && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                  )}
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl"
            >
              <div className="max-w-3xl mx-auto px-6 py-6">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder="Search collections, products..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-[#0a0a0a] border-r border-white/10 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6 pt-24">
                <nav className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href + link.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between py-4 text-lg font-light text-white/80 hover:text-white border-b border-white/5 transition-colors"
                      >
                        <span className="tracking-wider">{link.label}</span>
                        {link.hasDropdown && (
                          <ChevronRight size={16} className="text-white/40" />
                        )}
                      </Link>

                      {link.hasDropdown && (
                        <div className="pl-4 py-2 space-y-2">
                          {categories.map((cat, idx) => (
                            <motion.div
                              key={cat.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + idx * 0.05 }}
                            >
                              <Link
                                href={"/products/category/" + cat.slug}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                              >
                                {cat.name}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile Menu Footer */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-4 text-white/40">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-xs">EN</span>
                    </div>
                    <span className="text-xs tracking-wider">USD ($)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
