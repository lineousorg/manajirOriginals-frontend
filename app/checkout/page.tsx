"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, CreditCard, CheckCircle } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CheckoutPage = () => {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<"shipping" | "payment" | "success">(
    "shipping"
  );
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const subtotal = getTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    setStep("success");
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="container-fashion py-16">
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
      <div className="container-fashion py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h1 className="heading-section mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. We will send you an email confirmation
            with tracking details shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders" className="btn-outline-fashion">
              View Orders
            </Link>
            <Link href="/products" className="btn-primary-fashion">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
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
        <span className={step === "shipping" ? "text-foreground" : ""}>
          Shipping
        </span>
        <ChevronRight size={14} />
        <span className={step === "payment" ? "text-foreground" : ""}>
          Payment
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Form */}
        <div>
          {step === "shipping" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="heading-section mb-8">Shipping Information</h1>
              <form onSubmit={handleSubmitShipping} className="space-y-6">
                <div>
                  <label className="text-label block mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="input-fashion rounded-md"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label block mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="input-fashion rounded-md"
                    placeholder="123 Fashion St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input-fashion rounded-md"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary-fashion w-full">
                  Continue to Payment
                </button>
              </form>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="heading-section mb-8">Payment Information</h1>
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    Shipping to: {formData.address}, {formData.city},{" "}
                    {formData.state} {formData.zip}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep("shipping")}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Edit shipping
                  </button>
                </div>

                <div>
                  <label className="text-label block mb-2">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    className="input-fashion rounded-md"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">Expiry Date</label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">CVC</label>
                    <input
                      type="text"
                      name="cardCvc"
                      value={formData.cardCvc}
                      onChange={handleInputChange}
                      required
                      className="input-fashion rounded-md"
                      placeholder="123"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-fashion w-full">
                  Place Order · ${total.toFixed(2)}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-muted/30 rounded-xl p-6">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex gap-4"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.selectedSize} · {item.selectedColor} · Qty:{" "}
                      {item.quantity}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
