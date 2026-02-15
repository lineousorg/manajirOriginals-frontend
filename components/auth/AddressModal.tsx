"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, User, AlertCircle, CheckCircle } from "lucide-react";
import { Address } from "@/types";
import useApi from "@/hooks/useApi";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: Address | null;
  onSuccess: () => void;
}

interface CreateAddressData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export const AddressModal = ({
  isOpen,
  onClose,
  address,
  onSuccess,
}: AddressModalProps) => {
  const api = useApi();
  const [formData, setFormData] = useState<CreateAddressData>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "USA",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Reset form when modal opens with an address to edit
  useEffect(() => {
    if (address) {
      setFormData({
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      // Reset form when adding new address
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "USA",
        isDefault: false,
      });
    }
    setMessage(null);
  }, [address, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (address) {
        // Update existing address
        await api.patch(`/addresses/${address.id}`, formData);
        setMessage({
          type: "success",
          text: "Address updated successfully!",
        });
      } else {
        // Create new address
        await api.post("/addresses", formData);
        setMessage({
          type: "success",
          text: "Address added successfully!",
        });
      }

      // Close modal and notify parent after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save address. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "USA",
      isDefault: false,
    });
    setMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden mx-4">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 p-1.5 hover:bg-muted rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={18} className="text-gray-700" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin size={24} className="text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl text-gray-800">
                    {address ? "Edit Address" : "Add New Address"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {address
                      ? "Update your address details"
                      : "Enter your shipping address"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">First Name</label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="input-fashion rounded-lg pl-10 text-gray-700"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label block mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="input-fashion rounded-lg text-gray-700"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label block mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="input-fashion rounded-lg pl-10 text-gray-700"
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label block mb-2">Address</label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="input-fashion rounded-lg pl-10 text-gray-700"
                      placeholder="123 Main St"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label block mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="input-fashion rounded-lg text-gray-700"
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-label block mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="input-fashion rounded-lg text-gray-700"
                      placeholder="10001"
                      required
                    />
                  </div>
                </div>

                {/* <div>
                  <label className="text-label block mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="input-fashion rounded-lg text-gray-700"
                    required
                  >
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                  </select>
                </div> */}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>

                {/* Message */}
                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        message.type === "success"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-outline-fashion flex-1 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-fashion flex-1 rounded-lg"
                  >
                    {loading ? "Saving..." : address ? "Update" : "Add Address"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
