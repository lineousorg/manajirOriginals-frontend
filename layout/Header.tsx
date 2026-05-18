"use client";

import Image from "next/image";
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
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategories, useCategoryProductCounts } from "@/hooks/useProduct";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { Skeleton } from "@/components/ui/skeleton";

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
  const {
    items: cartItems,
    getItemCount,
    isHydrated,
    setHydrated,
  } = useCartStore();
  const cartItemCount = getItemCount();
  const wishlistItems = useWishlistStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const { user } = useAuthStore();
  const { categories, categoryTree, loading: categoriesLoading } =
    useCategories();
  const { getCountBySlug } = useCategoryProductCounts();
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const desktopSkeletonCount = Math.max(
    3,
    Math.min(6, categoryTree.length || categories.length || 4)
  );
  const mobileSkeletonCount = Math.max(
    4,
    Math.min(8, categories.length || categoryTree.length || 5)
  );

  // Timer to clear guest data from localStorage after 10 minutes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const guestPhone = localStorage.getItem("guestPhone");
      const guestPhoneStoredAt = localStorage.getItem("guestPhoneStoredAt");

      if (guestPhone && guestPhoneStoredAt) {
        const storedTime = parseInt(guestPhoneStoredAt, 10);
        const currentTime = Date.now();
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

        // If more than 10 minutes have passed, clear the guest data
        if (currentTime - storedTime > tenMinutes) {
          localStorage.removeItem("guestPhone");
          localStorage.removeItem("guestPhoneStoredAt");
        } else {
          // Set timer to clear remaining time
          const remainingTime = tenMinutes - (currentTime - storedTime);
          const timer = setTimeout(() => {
            localStorage.removeItem("guestPhone");
            localStorage.removeItem("guestPhoneStoredAt");
          }, remainingTime);
          return () => clearTimeout(timer);
        }
      } else if (guestPhone) {
        // If only guestPhone exists without timestamp, clear it
        localStorage.removeItem("guestPhone");
      }
    }
  }, []);

  // Fix: Mark cart as hydrated on mount so badge and drawer work correctly
  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  const showCartCount = isHydrated && cartItemCount > 0;

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
            ? "#631515"
            : pathname === "/"
              ? "rgba(10, 10, 10, 0)"
              : "#631515",
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-9999 backdrop-blur-md border-b transition-colors duration-500 ${
          isScrolled ? "border-white/10" : "border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* MOBILE LAYOUT - Completely separate from desktop */}
          <div className="flex lg:hidden items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/" className="relative group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex flex-col items-center relative"
              >
                <div className="w-10 h-10 border rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Manajir Originals Logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>
            </Link>

            {/* Right: Actions + Hamburger */}
            <div className="flex items-center gap-1">
              {/* Wishlist */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/wishlist"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                  aria-label="Wishlist"
                >
                  <Heart
                    size={16}
                    className="transition-transform group-hover:scale-110"
                  />
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>

              {/* Cart */}
              {isInAppBrowser() ? (
                <Link
                  href="/cart"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                  aria-label="Cart"
                >
                  <ShoppingBag
                    size={16}
                    className="transition-transform group-hover:scale-110"
                  />
                  <AnimatePresence>
                    {showCartCount && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center"
                      >
                        {cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCart}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                  aria-label="Cart"
                >
                  <ShoppingBag
                    size={16}
                    className="transition-transform group-hover:scale-110"
                  />
                  <AnimatePresence>
                    {showCartCount && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center"
                      >
                        {cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Profile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/profile"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors overflow-hidden group"
                  aria-label="Profile"
                >
                  {user?.avatar ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                        fill
                        sizes="36px"
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <User
                      size={16}
                      className="text-white/70 group-hover:text-white transition-colors"
                    />
                  )}
                  <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                </Link>
              </motion.div>

              {/* Hamburger */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors ml-1"
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
            </div>
          </div>

          {/* DESKTOP LAYOUT - Completely unchanged */}
          <div className="hidden lg:grid lg:grid-cols-3 items-center h-20">
            {/* Left: Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-start relative"
                >
                  <div className="w-20 h-20 border rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Manajir Originals Logo"
                      fill
                      sizes="80px"
                      className="object-cover"
                      priority
                    />
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* Center: Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-10">
              {navLinks.map((link) => (
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
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-white"
                      initial={{
                        width: pathname === link.href ? "100%" : "0%",
                      }}
                      animate={{
                        width: pathname === link.href ? "100%" : "0%",
                      }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
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
                        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden min-w-[400px]">
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
                                Browse Categories
                              </span>
                              <div className="h-px flex-1 ml-4 bg-linear-to-r from-white/10 to-transparent" />
                            </div>
                            <div className="flex flex-col gap-5 ">
                              {categoriesLoading
                                ? Array.from({
                                    length: desktopSkeletonCount,
                                  }).map((_, idx) => (
                                    <div
                                      key={`desktop-category-skeleton-${idx}`}
                                      className="space-y-3"
                                    >
                                      <Skeleton className="h-4 w-32 bg-white/10" />
                                      <div className="space-y-2 pl-2">
                                        {Array.from({
                                          length: (idx % 3) + 2,
                                        }).map((__, childIdx) => (
                                          <Skeleton
                                            key={`desktop-category-skeleton-${idx}-child-${childIdx}`}
                                            className="h-3 bg-white/6"
                                            style={{
                                              width: `${56 + childIdx * 10}%`,
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                : categoryTree.map((category, idx) => (
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
                          <div className="bg-white/5 px-8 py-4 flex items-center justify-between">
                            <span className="text-[10px] text-white/30 tracking-wider">
                              {categories.length} Categories • New arrivals
                              weekly
                            </span>
                            <Link
                              href="/products"
                              className="text-[11px] uppercase tracking-wider text-primary-foreground hover:text-white transition-colors flex items-center gap-2 group"
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
            <div className="flex items-center justify-end gap-2">
              {/* Search */}
              {/* <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                aria-label="Search"
              >
                <Search size={18} />
              </motion.button> */}

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
              {isInAppBrowser() ? (
                <Link
                  href="/cart"
                  className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70 hover:text-white group"
                  aria-label="Cart"
                >
                  <ShoppingBag
                    size={18}
                    className="transition-transform group-hover:scale-110"
                  />
                  <AnimatePresence>
                    {showCartCount && (
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
                </Link>
              ) : (
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
                    {showCartCount && (
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
              )}

              {/* Profile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={user ? "/profile" : "/login"}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors overflow-hidden group"
                  aria-label="Profile"
                >
                  {user?.avatar ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <User
                      size={18}
                      className="text-white/70 group-hover:text-white transition-colors"
                    />
                  )}
                  <div
                    className={`  ${
                      user ? "block" : "hidden"
                    } absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[#0a0a0a]`}
                  />
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-end p-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-black hover:text-white hover:border-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-8 pb-8">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href + link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() =>
                        !link.hasDropdown && setIsMobileMenuOpen(false)
                      }
                      className="group flex items-center justify-between py-5 font-light text-black hover:text-black transition-colors border-b border-black/6"
                    >
                      <span className="tracking-wide font-medium">
                        {link.label}
                      </span>
                      {link.hasDropdown ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropdownOpen(!dropdownOpen);
                          }}
                          className="p-2 -mr-2 text-black/50 hover:text-black/60 transition-colors"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      ) : (
                        <ArrowUpRight
                          size={18}
                          className="text-black/50 group-hover:text-black/60 transition-colors"
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {link.hasDropdown && dropdownOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="py-4 space-y-1">
                            {categoriesLoading
                              ? Array.from({
                                  length: mobileSkeletonCount,
                                }).map((_, idx) => (
                                  <div
                                    key={`mobile-category-skeleton-${idx}`}
                                    className="px-4 py-3"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <Skeleton
                                        className="h-4 bg-black/10"
                                        style={{
                                          width: `${44 + (idx % 4) * 12}%`,
                                        }}
                                      />
                                      <Skeleton className="h-4 w-4 rounded-full bg-black/10" />
                                    </div>
                                  </div>
                                ))
                              : categories.map((cat, idx) => (
                                  <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <Link
                                      href={`/products/category/${cat.slug}`}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="flex items-center justify-between py-3 px-4 rounded-lg text-sm text-black/70 hover:text-black hover:bg-black/[0.03] transition-all"
                                    >
                                      <span>{cat.name}</span>
                                      <ArrowUpRight
                                        size={14}
                                        className="opacity-0 group-hover:opacity-100"
                                      />
                                    </Link>
                                  </motion.div>
                                ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-white/[0.06]">
                <p className="text-xs text-white/20 tracking-wider uppercase">
                  © 2026
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
