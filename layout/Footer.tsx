"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Coats & Jackets", href: "/products?category=coats" },
    { label: "Dresses", href: "/products?category=dresses" },
    { label: "Tops", href: "/products?category=tops" },
  ],
  help: [
    { label: "Contact Us", href: "#" },
    { label: "Shipping & Returns", href: "#" },
    { label: "Size Guide", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Sustainability", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
};

export const Footer = () => {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className="bg-black text-background mt-auto">
      <div className="container-fashion py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
              {/* Logo */}
              <Link href="/" className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-start relative"
                >
                  <div className="w-14 h-14 md:w-20 md:h-20 border rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">

                    <Image
                      src="/logo.png"
                      alt="Manajir Originals Logo"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                </motion.div>
                {/* <div className="absolute -bottom-1 left-0 w-0 h-px bg-linear-to-r from-white/60 to-transparent group-hover:w-full transition-all duration-500" /> */}
              </Link>
            <p className="mt-4 text-gray-200 max-w-sm text-left text-sm leading-relaxed">
              Timeless elegance meets contemporary design. Crafted with care for
              the modern individual.
            </p>
            <div className="flex gap-4 mt-6 text-rose-700">
              <a
                href="https://www.instagram.com/manajiroriginals/" target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.tiktok.com/@manajiroriginals?is_from_webapp=1&sender_device=pc " target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <FaTiktok size={20} />
              </a>
              <a
                href="https://www.facebook.com/people/Manajir-Originals/61585941128531/" target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="">
            {/* <h4 className="text-label text-background/50 mb-4">Shop</h4> */}
            <ul className="space-y-3">
              {footerLinks.shop.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/80 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* <h4 className="text-label text-background/50 mb-4">Help</h4> */}
            <ul className="space-y-3">
              {footerLinks.help.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="text-sm text-background/80 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* <div>
            <h4 className="text-label text-background/50 mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="text-sm text-background/80 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Manajir Originals. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <a href="#" className="hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-background transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
