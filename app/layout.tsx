import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { Header } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { CartDrawer } from "@/layout/CartDrawer";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import ScrollToTop from "@/components/ui/ScrollToTop";
import Script from "next/script";
import GTMPageTracker from "@/lib/GTMpageTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Manajir Originals",
  description: "Fashion e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>

          {/* ✅ DataLayer INIT (must come first) */}
      <Script id="dataLayer-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'page_init'
          });
        `}
      </Script>

      <Script id="gtm" strategy="beforeInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-MLG8FP2F');
        `}
      </Script>

      </head>
      <body className={`${inter.variable} ${cormorant.variable}`}>

         
            {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-MLG8FP2F"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
          <div className="glass-overlay text-center">
            <Providers>
              <GTMPageTracker />
              <Toaster />
              <Sonner />
              <Header />
              <CartDrawer />
              <FloatingCartButton />
              <ScrollToTop />
              {children}
              <Footer />
            </Providers>
          </div>
      </body>
    </html>
  );
}
