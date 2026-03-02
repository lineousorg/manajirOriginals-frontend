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
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">My Account</h1>
          <p className="mt-2 text-gray-500">Manage your profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Modern Card Style */}
          <aside className="lg:col-span-3 h-full bg-white rounded-2xl shadow-sm">
            <nav className=" border border-gray-100 p-2 space-y-1 flex flex-col justify-between h-full">
              <div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-md transition-all duration-200">
                  <User size={18} strokeWidth={2} />
                  <span className="font-medium">Profile</span>
                </button>

                <Link
                  href="/orders"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
                >
                  <Package size={18} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Orders</span>
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group cursor-pointer"
              >
                <LogOut size={18} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Profile Card - Modern Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-50"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-4 ring-gray-50">
                          <User size={28} className="text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 text-left">
                        {user?.name || 'Guest User'}
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
                      <span className="flex items-center justify-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-2">
                        Member
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 self-start sm:self-center"
                  >
                    <Edit2 size={16} />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Edit Form - Clean Inputs */}
                {isEditing && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 pt-6 mt-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.name?.split(" ")[0]}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.name?.split(" ")[1]}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                        placeholder="Enter email"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            </motion.div>

            {/* Addresses Section - Minimalist Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 text-left">Saved Addresses</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Manage your delivery locations</p>
                </div>
              </div>

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
