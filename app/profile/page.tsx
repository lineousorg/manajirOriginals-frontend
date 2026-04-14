/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Package, LogOut, Edit2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Address } from "@/types";
import { AddressModal } from "@/components/auth/AddressModal";
import { AddressSelector } from "@/components/auth/AddressSelector";
import { useToast } from "@/components/ui/use-toast";
import { useAddresses } from "@/hooks/useProduct";
import useApi from "@/hooks/useApi";
import { Toaster } from "react-hot-toast";
import { confirmToast } from "@/lib/toast-confirm";
import { userService } from "@/services/user.service";

const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const { addresses, loading: loadingAddresses, refetch } = useAddresses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await userService.logout();
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
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set default address",
      });
    }
  };

  const handleModalSuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-38 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            My Account
          </h1>
          <p className="mt-2 text-gray-500">
            Manage your profile and preferences
          </p>
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
                  <Package
                    size={18}
                    strokeWidth={2}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="font-medium">Orders</span>
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group cursor-pointer"
              >
                <LogOut
                  size={18}
                  strokeWidth={2}
                  className="group-hover:translate-x-1 transition-transform"
                />
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
                    <div className="relative w-20 h-20">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name || "User avatar"}
                          fill
                          sizes="80px"
                          className="rounded-full object-cover ring-4 ring-gray-50"
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
                        {user?.name || "Guest User"}
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {user?.email}
                      </p>
                      {/* <span className="flex items-center justify-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-2">
                        Member
                      </span> */}
                    </div>
                  </div>
{/* 
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 self-start sm:self-center"
                  >
                    <Edit2 size={16} />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button> */}
                </div>

                {/* Edit Form - Clean Inputs */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 pt-6 mt-6"
                  >
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800">
                        Profile editing is currently unavailable. Please contact
                        support to update your profile information.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
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
                  <h3 className="text-xl font-semibold text-gray-900 text-left">
                    Saved Addresses
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage your delivery locations
                  </p>
                </div>
              </div>

              <AddressSelector
                onAddNewClick={handleAddNew}
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
