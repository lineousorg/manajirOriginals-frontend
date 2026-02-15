"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignupModal = ({ isOpen, onClose }: SignupModalProps) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Check if HTTP status is success (2xx)
      if (response.status >= 200 && response.status < 300) {
        // Success - show green message
        setMessage({
          type: "success",
          text: response.data?.message || "Account created successfully!",
        });

        // Close modal and redirect to login after a short delay
        setTimeout(() => {
          onClose();
          router.push("/login");
        }, 1500);
      } else {
        // Non-2xx status but no exception
        setMessage({
          type: "error",
          text: response.data?.message || "Failed to create account",
        });
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        request?: unknown;
      };

      // Check if we got a response from server
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;

        if (status === 400 || status === 409) {
          // Bad request or conflict (user already exists)
          setMessage({
            type: "error",
            text:
              error.response.data?.message ||
              "User already exists or invalid data",
          });
        } else if (status === 500) {
          setMessage({
            type: "error",
            text: "Server error. Please try again later.",
          });
        } else {
          setMessage({
            type: "error",
            text: error.response.data?.message || "Something went wrong",
          });
        }
      } else {
        // Network error or no response
        setMessage({
          type: "error",
          text: "Network error. Please check your connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: "", password: "" });
    setMessage(null);
    setShowPassword(false);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
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
                    <User size={24} className="text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl text-gray-800">
                    Create Account
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sign up to place your order
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div>
                  <label className="text-label block mb-2">Email</label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-fashion rounded-lg pl-10 text-gray-700"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label block mb-2">Password</label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-fashion rounded-lg pl-10 pr-10 text-gray-700"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-fashion w-full rounded-lg"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      router.push("/login");
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
