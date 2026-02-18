/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useApi from "@/hooks/useApi";
import {
  ChevronRight,
  CreditCard,
  CheckCircle,
  MapPin,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Address } from "@/types";
import { AddressModal } from "@/components/auth/AddressModal";
import { AddressSelector } from "@/components/auth/AddressSelector";
import { useAuthStore } from "@/store/auth.store";
import { OrderReceipt } from "@/components/checkout/OrderReceipt";
import toast, { Toaster } from "react-hot-toast";

const CheckoutPage = () => {
  const { items, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { post, loading } = useApi();
  const [step, setStep] = useState<"shipping" | "payment" | "success">(
    "shipping",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "ONLINE_PAYMENT"
  >("CASH_ON_DELIVERY");
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  // Address state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshAddresses, setRefreshAddresses] = useState(0);

  // Order state for receipt
  const [orderId, setOrderId] = useState<string | null>(null);

  const subtotal = getTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Update email when user changes
  useEffect(() => {
    if (isAuthenticated && user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [isAuthenticated, user?.email]);

  // Handle address selection
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    // Pre-fill form with selected address
    setFormData((prev) => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: "", // Backend doesn't have state field
      zip: address.postalCode,
      country: address.country === "USA" ? "United States" : address.country,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the items array for the API
    const orderItems = items.map((item) => ({
      variantId: Number(item.product.id) || 1,
      quantity: item.quantity,
    }));

    // Create the payload
    const payload = {
      items: orderItems,
      paymentMethod,
    };

    // Console log the payload
    console.log("Order Payload:", payload);

    try {
      // Make the API call
      const response = await post("/orders", payload);

      // Check if the API response indicates failure
      if (response?.status === "failed" || response?.status === "error") {
        throw new Error(response?.message || "Failed to create order");
      }

      // Log the full response for debugging
      console.log("Order API Response:", response);

      // Store order ID for receipt download
      // Try different response formats and fallback to generated ID
      const receivedOrderId = response?.data?.orderId || response?.orderId || response?.data?.id || response?.id;
      const finalOrderId = receivedOrderId || `ORD-${Date.now()}`;
      console.log("Order ID:", finalOrderId);
      setOrderId(finalOrderId);

      // Clear cart and show success
      clearCart();
      setStep("success");
    } catch (err: any) {
      console.error("Failed to create order:", err);
      // Show error toast and stay on payment page
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create order. Please try again.",
      );
    }
  };

  const handleAddAddressSuccess = () => {
    // Trigger address selector refresh
    setRefreshAddresses((prev) => prev + 1);
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="container-fashion py-16 min-h-[90dvh] flex items-center justify-center">
        <EmptyState
          icon={<CreditCard size={64} />}
          title="Nothing to checkout"
          description="Add some items to your bag first."
          action={
            <Link href="/products" className="btn-primary-fashion">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="container-fashion py-8 md:py-12">
        <div className=" mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="heading-section mb-4">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-8">
                Thank you for your purchase. We will send you an email
                confirmation with tracking details shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/orders" className="btn-outline-fashion">
                  View Orders
                </Link>
                <Link href="/products" className="btn-primary-fashion">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Order Receipt */}
        <div>
          {orderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <OrderReceipt orderId={orderId} />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fashion py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/cart" className="hover:text-foreground transition-colors">
          Cart
        </Link>
        <ChevronRight size={14} />
        <span
          className={step === "shipping" ? "text-foreground font-bold" : ""}
        >
          Shipping
        </span>
        <ChevronRight size={14} />
        <span className={step === "payment" ? "text-foreground font-bold" : ""}>
          Payment
        </span>
      </nav>

      <div className="min-h-dvh">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin size={20} className="text-primary" />
          </div>
          <h1 className="heading-section">Shipping Information</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Order Summary - Now on LEFT */}
          <div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck size={20} className="text-primary" />
                </div>
                <h2 className="font-serif text-gray-600 text-xl">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-4 items-start"
                  >
                    <div className="relative">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-20 md:w-20 md:h-24 object-cover rounded-lg"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium line-clamp-2 text-gray-600">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-block text-gray-600">
                          {item.selectedSize}
                        </span>
                        <span className="mx-1.5">·</span>
                        <span className="inline-block text-gray-600">
                          {item.selectedColor}
                        </span>
                      </p>
                      <p className="text-sm font-medium mt-2 text-primary">
                        ৳{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-gray-600">
                    ৳{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Shipping
                    {shipping === 0 && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        FREE
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gray-600">
                    {shipping === 0 ? "Free" : `৳${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium text-gray-600">
                    ৳{tax.toFixed(2)}
                  </span>
                </div>
                {/* {subtotal < 150 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Free shipping at</span>
                  <span className="text-gray-600">৳{(150 - subtotal).toFixed(2)} more</span>
                </div>
              )} */}
                <div className="border-t border-border pt-3 flex justify-between text-lg font-semibold text-gray-600">
                  <span>Total</span>
                  <span className="text-gray-600">৳{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <ShieldCheck size={14} />
                  <span>Secure checkout · 30-day returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form - Now on RIGHT */}
          <div className="lg:col-span-3 text-left">
            {step === "shipping" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Address Selector */}
                <div className="mb-8">
                  <AddressSelector
                    onAddressSelect={handleAddressSelect}
                    onAddNewClick={() => setIsModalOpen(true)}
                    selectedAddressId={selectedAddress?.id}
                    refreshTrigger={refreshAddresses}
                  />
                </div>

                <form onSubmit={handleSubmitShipping} className="space-y-6">
                  <div>
                    <label className="text-label text-left block mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled
                      className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label text-left block mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled
                        className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-label text-left block mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled
                        className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-label text-left block mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled
                      className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="text-label text-left block mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      disabled
                      className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      placeholder="123 Fashion Street, Apt 4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label text-left block mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        disabled
                        className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-label text-left block mb-2">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        required
                        disabled
                        className="input-fashion rounded-lg bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary-fashion w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedAddress}
                    >
                      Continue to Payment
                      <ChevronRight size={18} className="ml-2" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard size={20} className="text-primary" />
                  </div>
                  <h1 className="heading-section">Payment Details</h1>
                </div>

                <div className="bg-muted/30 rounded-xl p-5 mb-6 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Shipping to:</p>
                        <p className="font-medium">
                          {formData.address}, {formData.city}, {formData.zip}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("shipping")}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmitPayment} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="mb-8">
                    <label className="text-label text-left block mb-3">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cash on Delivery */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                          paymentMethod === "CASH_ON_DELIVERY"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              paymentMethod === "CASH_ON_DELIVERY"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
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
                          <div>
                            <p
                              className={`font-medium text-sm ${
                                paymentMethod === "CASH_ON_DELIVERY"
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              Cash on Delivery
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pay when you receive
                            </p>
                          </div>
                        </div>
                        {paymentMethod === "CASH_ON_DELIVERY" && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>

                      {/* Online Payment */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("ONLINE_PAYMENT")}
                        disabled
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group opacity-50 cursor-not-allowed ${
                          paymentMethod === "ONLINE_PAYMENT"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              paymentMethod === "ONLINE_PAYMENT"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
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
                          <div>
                            <p
                              className={`font-medium text-sm ${
                                paymentMethod === "ONLINE_PAYMENT"
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              Online Payment
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Coming Soon)
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pay securely online
                            </p>
                          </div>
                        </div>
                        {paymentMethod === "ONLINE_PAYMENT" && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Details - Only show for Online Payment */}
                  {paymentMethod === "ONLINE_PAYMENT" && (
                    <>
                      <div>
                        <label className="text-label text-left block mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          required
                          className="input-fashion rounded-lg"
                          placeholder="4242 4242 4242 4242"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-label text-left block mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            required
                            className="input-fashion rounded-lg"
                            placeholder="MM / YY"
                          />
                        </div>
                        <div>
                          <label className="text-label text-left block mb-2">
                            CVC
                          </label>
                          <input
                            type="text"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleInputChange}
                            required
                            className="input-fashion rounded-lg"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-primary-fashion w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                          <span className="ml-2">·</span>
                          <span className="ml-2">৳{total.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    By placing this order, you agree to our Terms of Service and
                    Privacy Policy.
                  </p>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={null}
        onSuccess={handleAddAddressSuccess}
      />

      {/* Toast Notifications */}
      <Toaster position="top-center" />
    </div>
  );
};

export default CheckoutPage;
