"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import { Download, Printer, CheckCircle } from "lucide-react";
import { Address, CartItem } from "@/types";
import { TiDownloadOutline } from "react-icons/ti";

interface OrderItem {
  id: string | number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface OrderReceiptProps {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE_PAYMENT";
  shippingAddress: Address;
  orderDate: string;
}

export function OrderReceipt({
  orderId,
  items,
  subtotal,
  shipping,
  tax,
  total,
  paymentMethod,
  shippingAddress,
  orderDate,
}: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    const doc = new jsPDF();

    // Colors
    const primaryColor: [number, number, number] = [0, 0, 0];
    const grayColor: [number, number, number] = [128, 128, 128];

    // Header - Brand Name
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Manajir", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Fashion & Lifestyle", 105, 32, { align: "center" });

    // Receipt Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Order Receipt", 105, 45, { align: "center" });

    // Order Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Order ID: ${orderId}`, 20, 60);
    doc.text(`Date: ${orderDate}`, 20, 67);
    doc.text(
      `Payment Method: ${paymentMethod === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Online Payment"}`,
      20,
      74,
    );

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 82, 190, 82);

    // Shipping Address
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Shipping Address", 20, 92);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const addressLines = [
      `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      shippingAddress.phone,
      shippingAddress.address,
      `${shippingAddress.city}, ${shippingAddress.postalCode}`,
    ];
    let yPos = 100;
    addressLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    // Divider line
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Items Header
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Items", 20, yPos);

    // Items Table Header
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Item", 20, yPos);
    doc.text("Qty", 120, yPos);
    doc.text("Price", 145, yPos);
    doc.text("Total", 175, yPos);

    // Items
    yPos += 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPos, 190, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      const itemName =
        item.product.name.length > 40
          ? item.product.name.substring(0, 40) + "..."
          : item.product.name;
      const variant = `${item.selectedSize} / ${item.selectedColor}`;

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(itemName, 20, yPos);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(variant, 20, yPos + 4);

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(item.quantity.toString(), 120, yPos + 2);
      doc.text(`৳${item.product.price.toFixed(2)}`, 145, yPos + 2);
      doc.text(
        `৳${(item.product.price * item.quantity).toFixed(2)}`,
        175,
        yPos + 2,
      );

      yPos += 14;
    });

    // Divider line
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // Totals
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Subtotal:", 130, yPos);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`৳${subtotal.toFixed(2)}`, 175, yPos);

    yPos += 7;
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Shipping:", 130, yPos);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(shipping === 0 ? "FREE" : `৳${shipping.toFixed(2)}`, 175, yPos);

    yPos += 7;
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Tax (8%):", 130, yPos);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`৳${tax.toFixed(2)}`, 175, yPos);

    // Total line
    yPos += 4;
    doc.line(120, yPos, 190, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 130, yPos);
    doc.text(`৳${total.toFixed(2)}`, 175, yPos);

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Thank you for shopping with Manajir!", 105, 270, {
      align: "center",
    });
    doc.text("For any queries, contact us at support@manajir.com", 105, 276, {
      align: "center",
    });

    // Save PDF
    doc.save(`Manajir-Receipt-${orderId}.pdf`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-6">
      {/* Action Buttons (Outside Card) */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-end gap-4">
        <button
          onClick={generatePDF}
          className="text-black flex items-center gap-2 cursor-pointer hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
         < TiDownloadOutline/> Download PDF
        </button>

        {/* <button
          onClick={() => window.print()}
          className="border border-black px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Print
        </button> */}
      </div>

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

            {/* Bill To */}
            {/* <div className="mt-12">
              <p className="text-gray-500 mb-2">Bill To</p>
              <p className="font-semibold">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p className="text-gray-700">
                {shippingAddress.address}
                <br />
                {shippingAddress.city}, {shippingAddress.postalCode}
              </p>
            </div> */}
          </div>

          {/* Right: Receipt Title */}
          <div className="text-right">
            <h1 className="text-3xl md:text-5xl font-serif tracking-wide mb-2">RECEIPT</h1>
            <p className="text-gray-500 mb-16">Receipt #{orderId}</p>

            <div className="flex justify-end gap-2 text-gray-700">
              <span className="text-gray-500">Issue Date :</span>
              <span>{formatDate(orderDate)}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-2 md:grid-cols-6 bg-black text-white px-4 md:px-6 py-4 text-sm font-semibold">
            <div>#</div>
            <div className="col-span-2">Item & Description</div>
            <div>Qty</div>
            <div>Rate</div>
            <div className="text-right">Amount</div>
          </div>

          {/* Items */}
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-2 md:grid-cols-6 px-4 md:px-6 py-6 md:py-8 border-b text-sm"
            >
              <div>{index + 1}</div>

              <div className="col-span-2">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-gray-500 mt-1">
                  {item.selectedSize} / {item.selectedColor}
                </p>
              </div>

              <div>{item.quantity.toFixed(2)}</div>

              <div>৳{item.product.price.toFixed(2)}</div>

              <div className="text-right">
                ৳{(item.product.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mt-8 md:mt-16">
          <div className="w-full md:w-96 text-sm">
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Sub Total</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 font-semibold">
              <span>Tax (12%)</span>
              <span>৳{tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-4 px-6 bg-gray-100 font-bold text-base mt-4">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {/* <div className="mt-24 text-sm text-gray-700">
          <p className="font-semibold mb-2">Notes</p>
          <p>It was great doing business with you.</p>

          <div className="mt-8">
            <p className="font-semibold mb-2">Terms & Conditions</p>
            <p>Please make the payment by the due date.</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
