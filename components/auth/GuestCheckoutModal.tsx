/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    grecaptcha: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark";
          size?: "normal" | "compact" | "invisible";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
    recaptchaOnLoad: () => void;
  }
}

export const GuestCheckoutModal = ({ isOpen, onClose }: GuestCheckoutModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<number | null>(null);

  // Recaptcha callbacks - must be defined before use in render
  const handleRecaptchaSuccess = useCallback((token: string) => {
    setVerifying(true);
    setError(null);

    // Store token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("recaptchaToken", token);
    }

    setVerified(true);
    setVerifying(false);

    // Redirect to checkout after short delay
    setTimeout(() => {
      onClose();
      router.push("/checkout?guest=true");
    }, 500);
  }, [onClose, router]);

  const handleRecaptchaExpired = useCallback(() => {
    setError("Verification expired. Please try again.");
    setVerified(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recaptchaToken");
    }
  }, []);

  const handleRecaptchaError = useCallback(() => {
    setError("Verification failed. Please try again.");
    setVerified(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recaptchaToken");
    }
  }, []);

  // Load reCAPTCHA script
  useEffect(() => {
    if (!isOpen) return;

    // Check if already loaded
    if (window.grecaptcha && recaptchaReady) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setRecaptchaReady(true);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [isOpen, recaptchaReady]);

  // Render reCAPTCHA when ready
  useEffect(() => {
    if (!isOpen || !recaptchaReady || verified) return;

    const container = document.getElementById("guest-recaptcha-container");
    if (container && !captchaWidgetId) {
      try {
        const widgetId = window.grecaptcha.render(container, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
          theme: "light",
          size: "normal",
          callback: handleRecaptchaSuccess,
          "expired-callback": handleRecaptchaExpired,
          "error-callback": handleRecaptchaError,
        });
        setCaptchaWidgetId(widgetId);
      } catch (err) {
        console.error("reCAPTCHA render error:", err);
      }
    }
  }, [isOpen, recaptchaReady, verified, captchaWidgetId]);

  const handleClose = () => {
    setError(null);
    setVerified(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recaptchaToken");
    }
    onClose();
  };

  const handleContinueAsGuest = () => {
    // Trigger reCAPTCHA if not verified
    if (!verified && captchaWidgetId !== null) {
      try {
        window.grecaptcha.reset(captchaWidgetId as unknown as string);
      } catch (err) {
        console.error("reCAPTCHA reset error:", err);
      }
    }
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
                    Continue as Guest
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Verify you are human to continue
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-4">
                {/* reCAPTCHA Container */}
                <div className="flex justify-center">
                  <div id="guest-recaptcha-container" />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700"
                    >
                      <AlertCircle size={18} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                  {verified && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-50 text-green-700"
                    >
                      <CheckCircle size={18} />
                      Verification successful! Redirecting...
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Continue Button */}
                {!verified && (
                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    disabled={verifying || !recaptchaReady}
                    className="btn-primary-fashion w-full rounded-lg flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Continue as Guest"
                    )}
                  </button>
                )}

                <p className="text-center text-xs text-gray-500">
                  Verified users can proceed to checkout without creating an account
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuestCheckoutModal;