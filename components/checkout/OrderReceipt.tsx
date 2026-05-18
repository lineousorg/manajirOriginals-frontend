 
"use client";
// import { useState, useEffect } from "react";
import { Download, CheckCircle, Loader2, AlertCircle } from "lucide-react";
// import { useAuthStore } from "@/store/auth.store";
// import toast from "react-hot-toast";

interface OrderReceiptProps {
  orderId: string;
  orderNumber: string;
}

export const OrderReceipt = ({ orderId, orderNumber }: OrderReceiptProps) => {
  // const [isDownloading, setIsDownloading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const [downloadSuccess, setDownloadSuccess] = useState(false);
  // const [hasAttempted, setHasAttempted] = useState(false);
  // const { isAuthenticated } = useAuthStore();

  // const downloadReceipt = async () => {
  //   setIsDownloading(true);
  //   setError(null);
  //   setDownloadSuccess(false);
  //   setHasAttempted(true);

  //   try {
  //     const token = localStorage.getItem("accessToken");
  //     const guestPhone = localStorage.getItem("guestPhone");

  //     let response: Response;

  //     if (token) {
  //       response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receipt`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  //     } else if (guestPhone) {
  //       response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receipt?phone=${guestPhone}`,
  //         {
  //           method: "GET",
  //         }
  //       );
  //     } else {
  //       throw new Error(
  //         "Session not found. Please log in or complete checkout again."
  //       );
  //     }

  //     if (!response.ok) {
  //       throw new Error(
  //         response.statusText || "Failed to download receipt"
  //       );
  //     }

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `receipt-${orderNumber}.pdf`;
  //     document.body.appendChild(a);
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);

  //     setDownloadSuccess(true);
  //     toast.success("Receipt downloaded successfully!");
  //   } catch (err: any) {
  //     console.error("Failed to download receipt:", err);
  //     setError(
  //       err?.message || "Failed to download receipt. Please try again."
  //     );
  //     toast.error(err?.message || "Failed to download receipt");
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-muted/20 py-12 md:py-28">
      <div className="container-fashion max-w-2xl mx-auto">
        <div className="bg-background rounded-2xl shadow-lg border border-border/50 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-4">
            Order Confirmed!
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your order. Weve received your order and will
            process it shortly.
          </p>

          <div className="bg-muted/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Order Number</span>
              <span className="font-semibold text-lg">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
                Processing
              </span>
            </div>
          </div>

          {/* <div className="space-y-4">
            <button
              onClick={downloadReceipt}
              disabled={isDownloading}
              className="w-full btn-primary-fashion rounded-xl flex items-center justify-center gap-3 py-4"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download Receipt
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg text-sm bg-red-50 text-red-700">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {downloadSuccess && !error && hasAttempted && (
              <div className="flex items-center gap-2 p-4 rounded-lg text-sm bg-green-50 text-green-700">
                <CheckCircle size={18} />
                Receipt downloaded successfully!
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-4">
              A confirmation email will be sent to you shortly with your order
              details and tracking information.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};
