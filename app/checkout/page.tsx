/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import useApi from "@/hooks/useApi";
import {
  ChevronRight,
  CreditCard,
  CheckCircle,
  MapPin,
  Truck,
  Package,
  Shield,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { OrderReceipt } from "@/components/checkout/OrderReceipt";
import { CheckoutSkeleton } from "@/components/checkout/CheckoutSkeleton";
import toast from "react-hot-toast";
import { trackPurchase, type GTMItem } from "@/lib/gtm";
import { DELIVERY_CHARGES } from "@/lib/constants";

const CheckoutPageContent = () => {
  const { items, getTotal, clearCart, closeCart, isHydrated } = useCartStore();
  const { user } = useAuthStore();
  const { post, loading } = useApi();

  // Ensure cart drawer is closed when checkout page loads
  useEffect(() => {
    closeCart();
  }, [closeCart]);

  const [step, setStep] = useState<"shipping" | "payment" | "success">(
    "shipping"
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "ONLINE_PAYMENT"
  >("CASH_ON_DELIVERY");
  const [deliveryLocation, setDeliveryLocation] = useState<
    "inside_dhaka" | "outside_dhaka"
  >("inside_dhaka");
  const [formData, setFormData] = useState({
    email: user?.email || "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "",
  });

  // Order state for receipt
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

   const subtotal = getTotal();
   const shipping = deliveryLocation === "inside_dhaka" ? DELIVERY_CHARGES.INSIDE_DHAKA : DELIVERY_CHARGES.OUTSIDE_DHAKA;
   const total = subtotal + shipping;

   // Helper to get the correct price for an item (respects discounts)
   const getItemPrice = (item: { hasDiscount?: boolean; finalPrice?: number; productPrice: number }) => {
     return item.hasDiscount && item.finalPrice ? item.finalPrice : item.productPrice;
   };

   const purchaseItems: GTMItem[] = items.map((item) => ({
     item_id: String(item.variantId ?? item.productId),
     item_name: item.productName,
     price: getItemPrice(item),
     quantity: item.quantity,
     // Category not stored in cart; brand not tracked
     item_category: "",
     item_brand: "",
   }));

  // Update email when user changes
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.zip
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setStep("payment");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the items array for the API using stored variantId (fallback to productId if variantId missing)
    const orderItems = items.map((item) => ({
      variantId: Number(item.variantId ?? item.productId),
      quantity: item.quantity,
      ...(item.reservationId && { reservationId: Number(item.reservationId) }),
    }));

    // Create the payload - all users submit the same way
    const payload: Record<string, unknown> = {
      items: orderItems,
      paymentMethod,
      deliveryType:
        deliveryLocation === "inside_dhaka" ? "INSIDE_DHAKA" : "OUTSIDE_DHAKA",
      name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      postalCode: formData.zip,
      country: "Bangladesh",
    };

    try {
      const response = await post("/orders", payload);

      if (response?.status === "failed" || response?.status === "error") {
        throw new Error(response?.message || "Failed to create order");
      }

      const receivedOrderNumber =
        response?.data?.orderNumber ||
        response?.orderNumber ||
        response?.data?.id ||
        response?.id;
      const finalOrderNumber = receivedOrderNumber || `ORD-${Date.now()}`;
      setOrderNumber(finalOrderNumber);

      const receivedOrderId = response?.data?.id || response?.id;
      setOrderId(receivedOrderId || finalOrderNumber);

      trackPurchase({
        transaction_id: String(receivedOrderId || finalOrderNumber),
        value: total,
        items: purchaseItems,
      });

      clearCart();
      setStep("success");
    } catch (err: any) {
      console.error("Failed to create order:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create order. Please try again."
      );
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Don't render until hydrated
  if (!isHydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <EmptyState
          icon={<Package size={48} strokeWidth={1.5} />}
          title="Your bag is empty"
          description="Looks like you haven't added any items yet. Explore our collection and find something you'll love."
          action={
            <Link href="/products" className="btn-primary-fashion">
              Browse Products
            </Link>
          }
        />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-muted/20 py-12 md:py-28">
        <div className="">
          {orderNumber && (
            <OrderReceipt
              orderId={orderId || orderNumber}
              orderNumber={orderNumber}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-30">
        <div className="container-fashion py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/cart"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Cart</span>
            </Link>
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  step === "shipping"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step === "shipping"
                      ? "bg-primary text-primary-foreground"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {step === "shipping" ? "1" : <CheckCircle size={12} />}
                </div>
                <span className="hidden sm:inline">Shipping</span>
              </div>

              <div className="w-8 h-px bg-border" />

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  step === "payment"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step === "payment"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <span className="hidden sm:inline">Payment</span>
              </div>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container-fashion py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-serif font-medium text-left">
                        Shipping Details
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Enter your delivery address
                      </p>
                    </div>
                  </div>

                  {/* Shipping Form */}
                  <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6">
                    <h3 className="font-medium mb-6 flex items-center gap-2">
                      <Shield size={18} className="text-muted-foreground" />
                      Contact Information
                    </h3>

                    <form onSubmit={handleSubmitShipping} className="space-y-5">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground text-left w-full">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="01XXXXXXXXX"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                          />
                        </div>
                      </div>

                      {/* Full Address */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter your full address"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            ZIP Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            placeholder="Enter ZIP code"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full bg-primary text-primary-foreground font-medium py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                          Continue to Payment
                          <ChevronRight
                            size={18}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} className="text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-serif font-medium">
                        Payment Method
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Choose how you would like to pay
                      </p>
                    </div>
                  </div>

                  {/* Shipping Summary Card */}
                  <div className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/50">
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 bg-background rounded-xl flex items-start justify-center shrink-0">
                        <Truck size={20} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">Shipping Address</p>
                          <button
                            type="button"
                            onClick={() => setStep("shipping")}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Change
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formData.fullName} • {formData.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.address}, {formData.city}, {formData.zip}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Selection */}
                  <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6">
                    <h3 className="font-medium font-sans text-left mb-6">
                      Select Payment Method
                    </h3>

                    <form onSubmit={handleSubmitPayment} className="space-y-6">
                      <div className="grid gap-4">
                        {/* Cash on Delivery */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                          className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                            paymentMethod === "CASH_ON_DELIVERY"
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                              paymentMethod === "CASH_ON_DELIVERY"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`font-semibold ${
                                  paymentMethod === "CASH_ON_DELIVERY"
                                    ? "text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                Cash on Delivery
                              </p>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Popular
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pay with cash when your order arrives at your
                              doorstep
                            </p>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              paymentMethod === "CASH_ON_DELIVERY"
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {paymentMethod === "CASH_ON_DELIVERY" && (
                              <CheckCircle
                                size={14}
                                className="text-primary-foreground"
                              />
                            )}
                          </div>
                        </button>

                        {/* Online Payment - Disabled */}
                        <button
                          type="button"
                          disabled
                          className="relative flex items-center gap-4 p-5 rounded-2xl border-2 border-border/50 opacity-50 cursor-not-allowed text-left bg-muted/20"
                        >
                          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-muted flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-5 h-5 md:w-7 md:h-7"
                            >
                              <rect
                                width="18"
                                height="11"
                                x="3"
                                y="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">
                                Online Payment
                              </p>
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-bold rounded-full">
                                Soon
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Pay securely with card, mobile banking, or digital
                              wallets
                            </p>
                          </div>

                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                        </button>
                      </div>

                      {/* Security Note */}
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                        <Shield
                          size={20}
                          className="text-muted-foreground shrink-0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Your payment information is encrypted and secure. We
                          never store your full card details.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-4 space-y-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/25"
                        >
                          {loading ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Processing Order...
                            </>
                          ) : (
                            <>
                              <span>Place Order</span>
                              <span className="w-px h-5 bg-primary-foreground/30" />
                              <span>৳{total.toLocaleString()}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setStep("shipping")}
                          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ← Back to Shipping
                        </button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">
                        By placing this order, you agree to our{" "}
                        <Link
                          href="/terms"
                          className="underline hover:text-foreground"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="underline hover:text-foreground"
                        >
                          Privacy Policy
                        </Link>
                      </p>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Summary Card */}
              <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg">Order Summary</h2>
                      <p className="text-xs text-muted-foreground">
                        {items.length} items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                      className="flex gap-4 group"
                    >
                      <div className="relative w-16 md:w-20 h-20 md:h-24 rounded-xl bg-muted shrink-0 ring-1 ring-border group-hover:ring-primary/20 transition-all">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover rounded-lg"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-left line-clamp-2 leading-snug mb-1">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="px-1.5 py-0.5 bg-muted rounded-md">
                            {item.selectedSize}
                          </span>
                          <span>·</span>
                          <span className="capitalize">
                            {item.selectedColor}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {item.hasDiscount && item.finalPrice && item.productPrice > item.finalPrice ? (
                            <>
                              <span className="text-xs text-muted-foreground line-through">
                                ৳{(item.productPrice * item.quantity).toLocaleString()}
                              </span>
                              <span className="font-semibold text-sm text-primary">
                                ৳{(item.finalPrice * item.quantity).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-sm">
                              ৳{(getItemPrice(item) * item.quantity).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Options */}
                <div className="p-6 border-t border-border/50 bg-muted/10 space-y-3">
                  <h4 className="text-sm font-medium mb-3">Delivery Option</h4>

                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      deliveryLocation === "inside_dhaka"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <input
                        type="radio"
                        name="deliveryLocation"
                        checked={deliveryLocation === "inside_dhaka"}
                        onChange={() => setDeliveryLocation("inside_dhaka")}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium text-sm">Inside Dhaka</p>
                        <p className="text-xs text-muted-foreground">
                          Delivery within 24-48 hours
                        </p>
                      </div>
                     </div>
                     <span className="font-semibold text-sm">৳{DELIVERY_CHARGES.INSIDE_DHAKA}</span>
                   </label>

                   <label
                     className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                       deliveryLocation === "outside_dhaka"
                         ? "border-primary bg-primary/5"
                         : "border-border hover:border-primary/30 bg-background"
                     }`}
                   >
                     <div className="flex items-center gap-3 text-left">
                       <input
                         type="radio"
                         name="deliveryLocation"
                         checked={deliveryLocation === "outside_dhaka"}
                         onChange={() => setDeliveryLocation("outside_dhaka")}
                         className="w-4 h-4 text-primary focus:ring-primary"
                       />
                       <div>
                         <p className="font-medium text-sm">Outside Dhaka</p>
                         <p className="text-xs text-muted-foreground">
                           Delivery within 3-5 days
                         </p>
                       </div>
                     </div>
                     <span className="font-semibold text-sm">৳{DELIVERY_CHARGES.OUTSIDE_DHAKA}</span>
                   </label>
                </div>

                {/* Totals */}
                <div className="p-6 border-t border-border/50 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ৳{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      ৳{shipping.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Including VAT where applicable
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-background rounded-xl p-2 md:p-4 text-center border border-border/50">
                  <Shield
                    size={24}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Secure
                  </p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center border border-border/50">
                  <Truck
                    size={24}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Fast
                  </p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center border border-border/50">
                  <CheckCircle
                    size={24}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageContent />
    </Suspense>
  );
};

export default CheckoutPage;
