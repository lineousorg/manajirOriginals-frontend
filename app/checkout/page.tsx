/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import {
  CheckCircle,
  MapPin,
  Truck,
  Package,
  Shield,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Info,
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import useApi from "@/hooks/useApi";
import { getGuestToken } from "@/lib/cart";

const CheckoutPageContent = () => {
  const { items, getTotal, resetCart, closeCart, isHydrated } = useCartStore();
  const { user } = useAuthStore();
  const { post, loading } = useApi();
  const isMobile = useIsMobile();

  useEffect(() => {
    closeCart();
  }, [closeCart]);

  const [deliveryLocation, setDeliveryLocation] = useState<
    "inside_dhaka" | "outside_dhaka"
  >("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "BANK_TRANSFER"
  >("CASH_ON_DELIVERY");
  const [formData, setFormData] = useState({
    email: user?.email || "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    note: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const subtotal = getTotal();
  const shipping =
    deliveryLocation === "inside_dhaka"
      ? DELIVERY_CHARGES.INSIDE_DHAKA
      : DELIVERY_CHARGES.OUTSIDE_DHAKA;
  const total = subtotal + shipping;

  const getItemPrice = (item: {
    hasDiscount?: boolean;
    finalPrice?: number;
    productPrice: number;
  }) => {
    return item.hasDiscount && item.finalPrice
      ? item.finalPrice
      : item.productPrice;
  };

  const purchaseItems: GTMItem[] = items.map((item) => ({
    item_id: String(item.variantId ?? item.productId),
    item_name: item.productName,
    price: getItemPrice(item),
    quantity: item.quantity,
    item_category: "",
    item_brand: "",
  }));

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2)
          return "Full name must be at least 2 characters";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!/^\d+$/.test(value.trim()))
          return "Phone number must contain only digits";
        if (value.trim().length !== 11) return "Phone number must be 11 digits";
        return "";
      case "address":
        if (!value.trim()) return "Full address is required";
        if (value.trim().length < 5)
          return "Address must be at least 5 characters";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields: Array<{ name: keyof typeof formData }> = [
      { name: "fullName" },
      { name: "phone" },
      { name: "address" },
      { name: "city" },
    ];

    let isValid = true;
    for (const field of requiredFields) {
      const error = validateField(field.name, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateAll()) {
      // Scroll to first error field
      const firstErrorField = formRef.current?.querySelector(
        "[data-has-error='true']"
      ) as HTMLElement | null;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        firstErrorField.focus();
      }
      return;
    }

    const orderItems = items.map((item) => ({
      variantId: Number(item.variantId ?? item.productId),
      quantity: item.quantity,
      ...(item.reservationId && { reservationId: Number(item.reservationId) }),
    }));

    // Determine if user is guest
    const isGuest = !user; // Assuming 'user' is from useAuthStore()

    // Prepare base payload
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
      postalCode: "",
      ...(formData.note.trim() && { note: formData.note.trim() }),
    };

    // Add guestToken for guest users if any items have reservationId
    if (isGuest) {
      const hasReservation = orderItems.some(
        (item) => item.reservationId !== undefined
      );
      if (hasReservation) {
        // Import getGuestToken from "@/lib/cart" at the top of file
        const guestToken = getGuestToken();
        if (guestToken) {
          payload.guestToken = guestToken;
        }
      }

      // Optional: Add recaptchaToken if available
      // if (typeof window !== "undefined") {
      //   const recaptchaToken = localStorage.getItem("recaptchaToken") || "";
      //   if (recaptchaToken) {
      //     payload.recaptchaToken = recaptchaToken;
      //   }
      // }
    }

    try {
      // Use correct endpoint based on user status
      const endpoint = isGuest ? "/orders/guest" : "/orders";
      const response = await post(endpoint, payload);

      // Check if the API response indicates failure
      if (response?.status === "failed" || response?.status === "error") {
        throw new Error(response?.message || "Failed to create order");
      }

      // Store order number for receipt download
      // Try different response formats and fallback to generated ID
      const receivedOrderNumber =
        response?.data?.orderNumber ||
        response?.orderNumber ||
        response?.data?.id ||
        response?.id;
      const finalOrderNumber = receivedOrderNumber || `ORD-${Date.now()}`;
      setOrderNumber(finalOrderNumber);

      // Also store the order ID for receipt download API
      const receivedOrderId = response?.data?.id || response?.id;
      setOrderId(receivedOrderId || finalOrderNumber);

      trackPurchase({
        transaction_id: String(receivedOrderId || finalOrderNumber),
        value: total,
        items: purchaseItems,
      });

      // Clear local cart only. Reservations are already marked USED by backend.
      resetCart();

      // Store phone for guest receipt download (only for guest checkout)
      if (isGuest && formData.phone) {
        localStorage.setItem("guestPhone", formData.phone);
        localStorage.setItem("guestPhoneStoredAt", Date.now().toString());
      }
    } catch (err: any) {
      console.error("Failed to create order:", err);
      // Show error toast and stay on payment page
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create order. Please try again."
      );
    }
  };

  const showError = (fieldName: string): boolean => {
    return submitted && !!errors[fieldName];
  };

  if (!isHydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && !orderNumber) {
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

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 md:py-28">
        <div className="">
          <OrderReceipt
            orderId={orderId || orderNumber}
            orderNumber={orderNumber}
          />
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  <CheckCircle size={12} />
                </div>
                <span className="hidden sm:inline">Shipping</span>
              </div>

              <div className="w-8 h-px bg-border" />

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-muted text-muted-foreground">
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
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
            {/* Section Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <MapPin size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-medium text-left">
                  Shipping & Payment
                </h1>
                <p className="text-muted-foreground text-sm text-left">
                  Complete your order in one step
                </p>
              </div>
            </div>

            {/* Shipping Form */}
            <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div
                    className="space-y-2 text-left"
                    data-has-error={showError("fullName") ? "true" : undefined}
                  >
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-3 rounded-xl bg-muted/50 border text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          showError("fullName")
                            ? "border-red-500/70"
                            : "border-border"
                        }`}
                      />
                      {showError("fullName") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Info size={16} className="text-red-500" />
                        </div>
                      )}
                    </div>
                    {/* {showError("fullName") && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.fullName}
                      </p>
                    )} */}
                  </div>

                  {/* Phone Number */}
                  <div
                    className="space-y-2 text-left"
                    data-has-error={showError("phone") ? "true" : undefined}
                  >
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="01XXXXXXXXX"
                        maxLength={11}
                        className={`w-full px-4 py-3 rounded-xl bg-muted/50 border text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          showError("phone")
                            ? "border-red-500/70"
                            : "border-border"
                        }`}
                      />
                      {showError("phone") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Info size={16} className="text-red-500" />
                        </div>
                      )}
                    </div>
                    {/* {showError("phone") && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )} */}
                  </div>

                  {/* Full Address */}
                  <div
                    className="space-y-2 text-left col-span-2"
                    data-has-error={showError("address") ? "true" : undefined}
                  >
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full address"
                        className={`w-full px-4 py-3 rounded-xl bg-muted/50 border text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          showError("address")
                            ? "border-red-500/70"
                            : "border-border"
                        }`}
                      />
                      {showError("address") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Info size={16} className="text-red-500" />
                        </div>
                      )}
                    </div>
                    {/* {showError("address") && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )} */}
                  </div>

                  {/* City */}
                  <div
                    className="space-y-2 text-left"
                    data-has-error={showError("city") ? "true" : undefined}
                  >
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      City
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter city"
                        className={`w-full px-4 py-3 rounded-xl bg-muted/50 border text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          showError("city")
                            ? "border-red-500/70"
                            : "border-border"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Email (Optional) */}
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Note (Optional) */}
                  <div className="space-y-2 text-left col-span-2">
                    <label className="text-sm font-medium text-muted-foreground text-left w-full">
                      Note
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Add a note for your order (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-3 pt-2 border-t border-border/50 mt-10">
                  <h4 className="font-sans text-lg font-medium text-left">
                    Payment Method
                  </h4>
                  <div className="grid gap-3">
                    {/* Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        paymentMethod === "CASH_ON_DELIVERY"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          paymentMethod === "CASH_ON_DELIVERY"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
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
                          {/* <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Popular
                          </span> */}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay with cash when your order arrives
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

                    {/* Bank Transfer */}
                    {/* <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          paymentMethod === "BANK_TRANSFER"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className={`font-semibold ${
                              paymentMethod === "BANK_TRANSFER"
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            Bank Transfer
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Pay via bank transfer before order ships
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          paymentMethod === "BANK_TRANSFER"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {paymentMethod === "BANK_TRANSFER" && (
                          <CheckCircle
                            size={14}
                            className="text-primary-foreground"
                          />
                        )}
                      </div>
                    </button> */}
                  </div>
                </div>

                {/* Security Note */}
                {/* <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                  <Shield
                    size={20}
                    className="text-muted-foreground shrink-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We never
                    store your full card details.
                  </p>
                </div> */}

                {/* Submit Button */}
                <div className="pt-4 space-y-3">
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
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            {isMobile ? (
              <div className="mb-6">
                <Collapsible
                  open={isSummaryOpen}
                  onOpenChange={setIsSummaryOpen}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between bg-background rounded-2xl border border-border/50 shadow-sm px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Package size={20} className="text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-lg text-left">
                            Order Summary
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`transition-transform duration-200 ${
                          isSummaryOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown
                          size={20}
                          className="text-muted-foreground"
                        />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <OrderSummaryPanel
                      items={items}
                      subtotal={subtotal}
                      shipping={shipping}
                      total={total}
                      deliveryLocation={deliveryLocation}
                      setDeliveryLocation={setDeliveryLocation}
                      getItemPrice={getItemPrice}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <div className="lg:sticky lg:top-24 space-y-6">
                <OrderSummaryPanel
                  items={items}
                  subtotal={subtotal}
                  shipping={shipping}
                  total={total}
                  deliveryLocation={deliveryLocation}
                  setDeliveryLocation={setDeliveryLocation}
                  getItemPrice={getItemPrice}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderSummaryPanel = ({
  items,
  subtotal,
  shipping,
  total,
  deliveryLocation,
  setDeliveryLocation,
  getItemPrice,
}: {
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  deliveryLocation: "inside_dhaka" | "outside_dhaka";
  setDeliveryLocation: (val: "inside_dhaka" | "outside_dhaka") => void;
  getItemPrice: (item: any) => number;
}) => (
  <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
    {/* <div className="p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            <p className="text-xs text-muted-foreground">{items.length} items</p>
          </div>
        </div>
      </div> */}

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
              <span className="capitalize">{item.selectedColor}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              {item.hasDiscount &&
              item.finalPrice &&
              item.productPrice > item.finalPrice ? (
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
        <span className="font-semibold text-sm">
          ৳{DELIVERY_CHARGES.INSIDE_DHAKA}
        </span>
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
        <span className="font-semibold text-sm">
          ৳{DELIVERY_CHARGES.OUTSIDE_DHAKA}
        </span>
      </label>
    </div>

    <div className="p-6 border-t border-border/50 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">৳{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-medium">৳{shipping.toLocaleString()}</span>
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

    <div className="grid grid-cols-3 gap-2 md:gap-3 p-6 pt-0">
      <div className="bg-background rounded-xl p-2 md:p-4 text-center border border-border/50">
        <Shield size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Secure
        </p>
      </div>
      <div className="bg-background rounded-xl p-4 text-center border border-border/50">
        <Truck size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Fast
        </p>
      </div>
      <div className="bg-background rounded-xl p-4 text-center border border-border/50">
        <CheckCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Quality
        </p>
      </div>
    </div>
  </div>
);

const CheckoutPage = () => {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageContent />
    </Suspense>
  );
};

export default CheckoutPage;
