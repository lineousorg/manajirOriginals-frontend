"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Package,
  LogOut,
  Edit2,
  Plus,
  Trash2,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Address } from "@/types";
import { AddressModal } from "@/components/auth/AddressModal";
import { AddressSelector } from "@/components/auth/AddressSelector";
import { useToast } from "@/components/ui/use-toast";
import useApi from "@/hooks/useApi";
import toast, { Toaster } from "react-hot-toast";
import { confirmToast } from "@/lib/toast-confirm";

const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [refreshAddresses, setRefreshAddresses] = useState(0);
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch addresses when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await api.get<{ data: Address[] }>("/addresses");
      setAddresses(response.data);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load addresses",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    logout();
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmToast(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) return;

    try {
      await api.del(`/addresses/${id}`);
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      fetchAddresses();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete address",
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.patch(`/addresses/${id}/set-default`);
      toast({
        title: "Success",
        description: "Default address updated",
      });
      fetchAddresses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set default address",
      });
    }
  };

  const handleModalSuccess = () => {
    setRefreshAddresses((prev) => prev + 1);
  };

  return (
    <div className="container-fashion py-8 md:py-12 min-h-screen">
      <div className=" mx-auto">
        <h1 className="heading-section mb-8 text-left">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Sidebar */}
          <aside className="flex flex-row md:flex-col md:space-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 *:hover:bg-gray-200 *:hover:scale-105 ">
            <button className="flex items-center gap-3 p-3 rounded-lg bg-white/30 text-left transition-all duration-300 ease-in-out whitespace-nowrap">
              <User size={18} />
              Profile
            </button>
            <Link
              href="/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/30 text-left text-muted-foreground transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              <Package size={18} />
              Orders
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/30 transition-all duration-300 ease-in-out text-left text-muted-foreground cursor-pointer whitespace-nowrap"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <User size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    {/* <h2 className="font-serif text-xl font-medium text-left">
                      {user?.name}
                    </h2> */}
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              {isEditing && (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label block mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name.split(" ")[0]}
                        className="input-fashion rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-label block mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name.split(" ")[1]}
                        className="input-fashion rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label block mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="input-fashion rounded-md"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary-fashion">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-outline-fashion"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>

            {/* Addresses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-medium">
                  Saved Addresses
                </h3>
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Plus size={16} />
                  Add New
                </button>
              </div> */}

              <AddressSelector
                onAddNewClick={handleAddNew}
                refreshTrigger={refreshAddresses}
                showActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        address={editingAddress}
        onSuccess={handleModalSuccess}
      />
      <Toaster position="top-center" />
    </div>
  );
};

export default ProfilePage;
