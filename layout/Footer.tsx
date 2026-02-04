"use client";
import { Instagram, Twitter, Facebook } from "lucide-react";
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
    <footer className="bg-foreground text-background mt-auto">
      <div className="container-fashion py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="font-serif text-2xl font-medium tracking-tight"
            >
              <img
                src={"/logo.jpeg"}
                alt={"logo"}
                className="w-16 h-16 rounded-full object-cover"
              />
            </Link>
            <p className="mt-4 text-background/70 max-w-sm text-sm leading-relaxed">
              Timeless elegance meets contemporary design. Crafted with care for
              the modern individual.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-label text-background/50 mb-4">Shop</h4>
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
            <h4 className="text-label text-background/50 mb-4">Help</h4>
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

          <div>
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
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Maison. All rights reserved.
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
