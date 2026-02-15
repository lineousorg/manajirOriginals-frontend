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
import { useToast } from "@/components/ui/use-toast";
import useApi from "@/hooks/useApi";

const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      await api.del(`/addresses/${id}`);
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
      fetchAddresses();
    } catch (error) {
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
    fetchAddresses();
  };

  return (
    <div className="container-fashion py-8 md:py-12 h-screen">
      <div className=" mx-auto">
        <h1 className="heading-section mb-8 text-left">My Account</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/30 text-left">
              <User size={18} />
              Profile
            </button>
            <Link
              href="/orders"
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/30 transition-colors text-left text-muted-foreground"
            >
              <Package size={18} />
              Orders
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/30 transition-colors text-left text-muted-foreground"
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
              className="bg-muted/30 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-6">
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
                  <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center justify-between mb-4">
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
              </div>

              {loadingAddresses ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-muted/30 rounded-xl p-8 text-center">
                  <MapPin
                    size={48}
                    className="mx-auto mb-4 text-muted-foreground opacity-50"
                  />
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t added any addresses yet
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="btn-primary-fashion"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-muted/30 rounded-xl p-4 border-2 ${
                        addr.isDefault ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary" />
                          <span className="text-sm font-medium">
                            {addr.firstName} {addr.lastName}
                          </span>
                          {addr.isDefault && (
                            <span className="badge-fashion bg-primary/10 text-primary text-[10px]">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Set as default"
                            >
                              <Star
                                size={14}
                                className="text-muted-foreground"
                              />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(addr)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2
                              size={14}
                              className="text-muted-foreground"
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {addr.address}
                        <br />
                        {addr.city}, {addr.postalCode}
                        <br />
                        {addr.country}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
};

export default ProfilePage;
