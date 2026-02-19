"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check, Plus, Star, Edit2, Trash2 } from "lucide-react";
import { Address } from "@/types";
import useApi from "@/hooks/useApi";
import toast from "react-hot-toast";
import { confirmToast } from "@/lib/toast-confirm";

interface AddressSelectorProps {
  onAddressSelect?: (address: Address) => void;
  onAddNewClick: () => void;
  selectedAddressId?: number | null;
  refreshTrigger?: number;
  showActions?: boolean;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: number) => void;
}

export const AddressSelector = ({
  onAddressSelect,
  onAddNewClick,
  selectedAddressId,
  refreshTrigger,
  showActions = false,
  onEdit,
  onDelete,
}: AddressSelectorProps) => {
  const api = useApi();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [refreshTrigger]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ data: Address[] }>("/addresses");
      const fetchedAddresses = response.data;
      setAddresses(fetchedAddresses);

      // Auto-select default address if no address is selected
      if (
        !selectedAddressId &&
        fetchedAddresses.length > 0 &&
        onAddressSelect
      ) {
        const defaultAddr =
          fetchedAddresses.find((addr) => addr.isDefault) ||
          fetchedAddresses[0];
        if (defaultAddr) {
          onAddressSelect(defaultAddr);
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      setError("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent address selection when clicking set default

    // Check if address is already default
    const address = addresses.find((addr) => addr.id === addressId);
    if (address?.isDefault) {
      toast.error("This address is already set as default");
      return;
    }

    // Show confirmation using toast
    const confirmed = await confirmToast(
      "Are you sure you want to set this address as default?",
    );

    if (!confirmed) return;

    try {
      setSettingDefault(addressId);
      await api.patch(`/addresses/${addressId}/set-default`);

      // Update local state
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        })),
      );

      toast.success("Default address updated successfully");

      // Auto-select the new default address
      const updatedAddress = addresses.find((addr) => addr.id === addressId);
      if (updatedAddress && onAddressSelect) {
        onAddressSelect({ ...updatedAddress, isDefault: true });
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
      toast.error("Failed to set default address. Please try again.");
    } finally {
      setSettingDefault(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-muted/20 rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading addresses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-border">
        <div className="text-center">
          <MapPin size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No shipping address found. Please add an address to continue.
          </p>
          <button
            type="button"
            onClick={onAddNewClick}
            className="btn-primary-fashion inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Add Shipping Address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Select Shipping Address
        </h3>
        <button
          type="button"
          onClick={onAddNewClick}
          className="text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-1"
        >
          <Plus size={14} />
          Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {addresses.map((address) => (
            <motion.div
              key={address.id}
              onClick={() => onAddressSelect?.(address)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                selectedAddressId === address.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20 hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className={`mt-0.5 ${
                    selectedAddressId === address.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {address.firstName} {address.lastName}
                      </p>
                      {address.isDefault && (
                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                          <Star size={10} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                    {showActions && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(address);
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(address.id);
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.phone}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.postalCode}
                  </p>
                  {/* <p className="text-sm text-muted-foreground">
                    {address.country}
                  </p> */}
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => handleSetDefault(address.id, e)}
                      disabled={settingDefault === address.id}
                      className="mt-2 text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {settingDefault === address.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Setting...
                        </>
                      ) : (
                        <>
                          <Star size={12} />
                          Set as Default
                        </>
                      )}
                    </button>
                  )}
                </div>
                {selectedAddressId === address.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Check size={14} className="text-primary-foreground" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
