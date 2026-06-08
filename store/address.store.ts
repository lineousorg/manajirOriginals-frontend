import { Address } from "@/types";
import { create } from "zustand";

interface AddressStore {
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  clearAddresses: () => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: number, address: Address) => void;
  removeAddress: (id: number) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  hasAttemptedFetch: boolean;
  setHasAttemptedFetch: (hasAttempted: boolean) => void;
}

export const useAddressStore = create<AddressStore>((set) => ({
  addresses: [],
  setAddresses: (addresses) => set({ addresses }),
  clearAddresses: () => set({ addresses: [], isLoading: false, hasAttemptedFetch: false }),
  addAddress: (address) =>
    set((state) => ({ addresses: [...state.addresses, address] })),
  updateAddress: (id, updatedAddress) =>
    set((state) => ({
      addresses: state.addresses.map((addr) =>
        addr.id === id ? updatedAddress : addr
      ),
    })),
  removeAddress: (id) =>
    set((state) => ({
      addresses: state.addresses.filter((addr) => addr.id !== id),
    })),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  hasAttemptedFetch: false,
  setHasAttemptedFetch: (hasAttemptedFetch) => set({ hasAttemptedFetch }),
}));
