"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Package, LogOut, Edit2, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

const ProfilePage = () => {
    const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    logout();
  };

  return (
    <div className="container-fashion py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="heading-section mb-8">My Account</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted text-left">
              <User size={18} />
              Profile
            </button>
            <Link
              href="/orders"
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left text-muted-foreground"
            >
              <Package size={18} />
              Orders
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left text-muted-foreground"
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
                    <h2 className="font-serif text-xl font-medium">
                      {user?.name}
                    </h2>
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
                <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Plus size={16} />
                  Add New
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4 border-2 border-primary">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      <span className="text-sm font-medium">Home</span>
                      <span className="badge-fashion bg-primary/10 text-primary text-[10px]">
                        Default
                      </span>
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-foreground">
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    123 Fashion Ave
                    <br />
                    New York, NY 10001
                    <br />
                    United States
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Office</span>
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-foreground">
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    456 Business St
                    <br />
                    Los Angeles, CA 90001
                    <br />
                    United States
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
