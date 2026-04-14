"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  RefreshCw,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface OrderReceiptProps {
  orderId: string;
  orderNumber?: string;
  onBack?: () => void;
}

export function OrderReceipt({
  orderId,
  orderNumber,
  onBack,
}: OrderReceiptProps) {
  const displayOrderNumber = orderNumber || orderId;

  const [isDownloading, setIsDownloading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const downloadReceipt = async () => {
    setIsDownloading(true);
    setError(null);
    setDownloadSuccess(false);
    setHasAttempted(true);

    try {
      const token = localStorage.getItem("accessToken");
      const guestPhone = localStorage.getItem("guestPhone");

      let response: Response;

      if (token) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receipt`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else if (guestPhone) {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receipt?phone=${guestPhone}`,
          {
            method: "GET",
          }
        );
      } else {
        throw new Error(
          "Session not found. Please log in or complete guest checkout again."
        );
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not allowed to access this receipt.");
        }
        if (response.status === 404) {
          throw new Error("Receipt not found.");
        }
        throw new Error("Failed to download receipt.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!hasAttempted) {
      downloadReceipt();
    }
  }, [hasAttempted]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="container-fashion max-w-3xl mx-auto space-y-8">
        {/* Receipt Card - Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-3xl shadow-xl border border-border/50 overflow-hidden"
        >
          {/* Card Header with Gradient */}
          <div className="relative h-40 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border-b border-border/50">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)]" />

            {/* Back Button */}
            {onBack && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={onBack}
                className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group z-10"
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Back
              </motion.button>
            )}

            {/* Main Success Icon Container */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  className="relative w-20 h-20 bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <CheckCircle
                    className="text-emerald-600"
                    size={40}
                    strokeWidth={2}
                  />
                </motion.div>
                {/* Confirmed Badge */}
                {/* <motion.div
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring", damping: 15 }}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                >
                  Order Confirmed
                </motion.div> */}
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="pt-14 pb-8 px-8">
            {/* Main Title Section - Emphasized */}
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-3"
              >
                Order Placed Successfully!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm mb-4"
              >
                Thank you for your purchase. Your receipt is being prepared.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground font-mono tracking-wider uppercase">
                  Order #{displayOrderNumber}
                </span>
              </motion.div>
            </div>

            {/* Content States */}
            <AnimatePresence mode="wait">
              {/* Loading State */}
              {isDownloading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-8"
                >
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-2 border-border rounded-full" />
                    <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2
                        className="text-emerald-500/60 animate-spin"
                        size={20}
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-foreground/80 font-medium text-sm">
                      Generating your receipt
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Preparing PDF document...
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500/60 to-green-500/60 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: ["0%", "70%", "90%"] }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {!isDownloading && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-6"
                >
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="text-red-400" size={20} />
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-red-400/90 font-medium text-sm">
                        Download Failed
                      </p>
                      <p className="text-muted-foreground text-xs max-w-xs">
                        {error}
                      </p>
                    </div>

                    <button
                      onClick={downloadReceipt}
                      className="group relative px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <RefreshCw
                          size={14}
                          className="group-hover:rotate-180 transition-transform duration-500"
                        />
                        Retry Download
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Success State */}
              {!isDownloading && !error && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-6"
                >
                  <div className="flex flex-col items-center gap-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                    >
                      <FileText className="text-emerald-400" size={20} />
                    </motion.div>

                    <div className="text-center space-y-1">
                      <p className="text-foreground/90 font-medium text-sm">
                        Receipt Downloaded
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Your PDF has been saved to your downloads
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={downloadReceipt}
                        className="group px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted hover:border-border/80 hover:text-foreground transition-all flex items-center gap-2"
                      >
                        <Download size={14} />
                        Download Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-border/50"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/orders"
                  className="btn-outline-fashion px-6 py-2.5 rounded-full text-sm inline-flex items-center justify-center"
                >
                  View Order History
                </Link>
                <Link
                  href="/products"
                  className="btn-primary-fashion px-6 py-2.5 rounded-full text-sm inline-flex items-center justify-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Need assistance?{" "}
                <a
                  href="mailto:support@manajir.com"
                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  support@manajir.com
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-muted-foreground/50 text-xs"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Secure SSL Encryption</span>
          <span className="mx-2">•</span>
          <span>PDF Generated</span>
        </motion.div>
      </div>
    </div>
  );
}