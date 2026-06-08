"use client";

import { useState } from "react";
import { MapPin, Phone, User } from "lucide-react";

interface GuestAddressFormProps {
  formData: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      postalCode: string;
    }>
  >;
  onSubmit?: () => void;
}

export const GuestAddressForm = ({
  formData,
  setFormData,
  onSubmit,
}: GuestAddressFormProps) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Full Name */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Full Name *
        </label>
        <div className="relative">
          <User
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl pl-10 bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter your full name"
            required
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Phone Number *
        </label>
        <div className="relative">
          <Phone
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl pl-10 bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="01XXXXXXXXX"
            required
          />
        </div>
      </div>

      {/* Email (Optional) */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Email Address (Optional)
        </label>
        <div className="relative">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Delivery Address *
        </label>
        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-4 text-gray-500"
          />
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl pl-10 bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
            placeholder="Enter your full delivery address"
            required
          />
        </div>
      </div>

      {/* City and Postal Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g., Dhaka"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Postal Code
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g., 1200"
          />
        </div>
      </div>
    </div>
  );
};

export default GuestAddressForm;