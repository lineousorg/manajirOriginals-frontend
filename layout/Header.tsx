"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { Category } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TiShoppingCart, TiThMenu, TiUser } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import useApi from "@/hooks/useApi";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/products", label: "Products", hasDropdown: true },
];

const categoryLinks = [
  { href: "/products?category=coats", label: "Coats" },
  { href: "/products?category=dresses", label: "Dresses" },
  { href: "/products?category=tops", label: "Tops" },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItems = useWishlistStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const { isAuthenticated, user } = useAuthStore();
  const { get } = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Transform flat categories to tree structure
  const categoryTree = categories.filter(cat => cat.parentId === null).map(cat => ({
    ...cat,
    children: categories.filter(child => child.parentId === cat.id)
  }));

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await get<Category[]>('/categories', { skipAuth: true });
      console.log(data);
      setCategories(data.data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let lastScrollY = 0;

    const onScroll = () => {
      const current = window.scrollY;
      setIsScrolled(current > 20 && current > lastScrollY);
      lastScrollY = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/login") return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl shadow-md border-b border-border/40"
          : "bg-transparent"
      }`}
    >
      <div className="container-fashion">
        <div className="flex items-center justify-between h-20 md:h-16">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 -ml-3 hover:bg-muted/50 rounded-full transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <IoClose size={24} />
              ) : (
                <TiThMenu size={24} />
              )}
            </motion.div>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl md:text-3xl font-light tracking-tight hover:opacity-80 transition-opacity"
          >
            MANAJIR
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <div
                key={link.href + link.label}
                className={`relative ${link.hasDropdown ? "group" : ""}`}
              >
                <Link
                  href={link.href}
                  className={`relative text-sm uppercase tracking-widest font-medium transition-all duration-300 ${
                    pathname === link.href && !link.hasDropdown
                      ? "text-foreground after:w-full"
                      : "text-muted-foreground hover:text-foreground"
                  } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-linear-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 after:w-0 hover:after:w-full`}
                >
                  {link.label}
                </Link>
                {/* Dropdown for Products */}
                {link.hasDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible transform translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out">
                    <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-lg shadow-xl py-2">
                      {categoryTree.map((category) => (
                        <div key={category.id} className="relative group/sub">
                          <Link
                            href={"/products?category=" + category.slug}
                            className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                          >
                            {category.name}
                            {category.children && category.children.length > 0 && (
                              <ChevronRight size={14} className="ml-2" />
                            )}
                          </Link>
                          {/* Nested children dropdown */}
                          {category.children && category.children.length > 0 && (
                            <div className="absolute left-full top-0 ml-0.5 w-48 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 ease-out">
                              <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-lg shadow-xl py-2">
                                {category.children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={"/products?category=" + child.slug}
                                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/wishlist"
              className="relative p-3 hover:bg-muted/50 rounded-full transition-all duration-200 hover:scale-105"
              aria-label="Wishlist"
            >
              <Heart size={22} className="text-primary" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-[11px] font-semibold rounded-full flex items-center justify-center shadow-lg">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <button
              onClick={openCart}
              className="relative p-3 hover:bg-muted/50 rounded-full transition-all duration-200 hover:scale-105"
              aria-label="Cart"
            >
              <TiShoppingCart size={22} className="text-primary" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-[11px] font-semibold rounded-full flex items-center justify-center shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="p-3 hover:bg-muted/50 rounded-full transition-all duration-200 hover:scale-105"
              aria-label="Profile"
            >
              {user ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <TiUser size={22} />
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container-fashion py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.href + link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm uppercase tracking-wider py-2"
                  >
                    {link.label}
                  </Link>
                  {link.hasDropdown && (
                    <div className="pl-4 flex flex-col gap-2 mt-1">
                      {categoryLinks.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-sm uppercase tracking-wider py-2 text-muted-foreground"
                        >
                          {category.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
