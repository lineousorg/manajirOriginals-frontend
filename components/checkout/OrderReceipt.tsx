"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { TiDownloadOutline } from "react-icons/ti";

interface OrderReceiptProps {
  orderId: string;
}

export function OrderReceipt({ orderId }: OrderReceiptProps) {
  // Debug log
  console.log("OrderReceipt received orderId:", orderId);

  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadReceipt = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("You must be logged in to download the receipt");
        setIsDownloading(false);
        return;
      }

      // Call the receipt API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receipt`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized - Please log in again");
        }
        if (response.status === 403) {
          throw new Error("You can only download your own order's receipt");
        }
        if (response.status === 404) {
          throw new Error("Receipt not found");
        }
        throw new Error("Failed to download receipt");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error downloading receipt:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to download receipt. Please try again.";
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-6">
      {/* Action Buttons (Outside Card) */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-end gap-4">
        <button
          onClick={downloadReceipt}
          disabled={isDownloading}
          className="text-black flex items-center gap-2 cursor-pointer hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <span className="animate-spin">⟳</span>
              Downloading...
            </>
          ) : (
            <>
              <TiDownloadOutline />
              Download PDF
            </>
          )}
        </button>

        {/* Print button - prints the current page */}
        <button
          onClick={() => window.print()}
          className="text-black flex items-center gap-2 cursor-pointer hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Receipt Display */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-10 text-gray-900">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:mb-20">
          {/* Left: Logo + Company */}
          <div>
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
              <img src="/logo.jpeg" alt="" className="rounded-full" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">MANAJIR</p>
              <p className="text-gray-600 mt-2 leading-relaxed">
                3317 Example Road
                <br />
                Dhaka, Bangladesh
              </p>
            </div>
          </div>

          {/* Right: Receipt Title */}
          <div className="text-right">
            <h1 className="text-3xl md:text-5xl font-serif tracking-wide mb-2">
              RECEIPT
            </h1>
            <p className="text-gray-500 mb-16">Receipt #{orderId}</p>

            <div className="flex justify-end gap-2 text-gray-700">
              <span className="text-gray-500">Issue Date :</span>
              <span>{new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span>
            </div>
          </div>
        </div>

        {/* Order Details Message */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            Thank you for your order! Your receipt has been generated.
          </p>
          <p className="text-gray-500 mt-2">
            Click the &quot;Download PDF&quot; button above to download your receipt.
          </p>
          <p className="text-gray-500 mt-4 text-sm">
            A copy of the receipt has also been sent to your email address.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center text-sm text-gray-500">
          <p>For any queries, contact us at support@manajir.com</p>
        </div>
      </div>
    </div>
  );
}
