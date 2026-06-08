"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
                href="https://www.instagram.com/manajiroriginals/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.tiktok.com/@manajiroriginals?is_from_webapp=1&sender_device=pc "
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <FaTiktok size={20} />
              </a>
              <a
                href="https://www.facebook.com/people/Manajir-Originals/61585941128531/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-background/10 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <h4 className="text-label text-background/50 mb-6">Contact Us</h4>
            <div className="grid grid-cols-1 gap-5 text-left">
              <div className="flex items-center justify- gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-background/70 flex-shrink-0"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-background/80">Phone</p>
                  <p className="text-background/60">01308336666</p>
                  <p className="text-background/60">01308336633</p>
                </div>
              </div>

              <div className="flex items-center justify- gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-background/70 flex-shrink-0"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-background/80">Whatsapp</p>
                  <p className="text-background/60">01308336666</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-background/70 flex-shrink-0 mt-1"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-background/80">
                    Office Address
                  </p>
                  <p className="text-background/60">
                    Apartment - 6C, Level - 05, House - 460,
                  </p>
                  <p className="text-background/60">
                    Road - 06, Avenue - 06, Mirpur DOHS,
                  </p>
                  <p className="text-background/60">Dhaka - 1216</p>
                </div>
              </div>
            </div>
          </div>
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
