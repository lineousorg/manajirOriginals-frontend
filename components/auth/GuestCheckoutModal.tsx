/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleRecaptcha } from "@/types";

// Make this file a module so the global declaration works
export {};
import { X, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    grecaptcha?: GoogleRecaptcha;
    recaptchaOnLoad?: () => void;
  }
}

// Helper function to get properly typed grecaptcha instance
const getGrecaptcha = (): GoogleRecaptcha | undefined => {
  return window.grecaptcha as GoogleRecaptcha | undefined;
};

// Generate unique ID for reCAPTCHA container
const getUniqueContainerId = () => `guest-recaptcha-container-${Date.now()}`;

export const GuestCheckoutModal = ({
  isOpen,
  onClose,
}: GuestCheckoutModalProps) => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<"login" | "guest" | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerId] = useState(getUniqueContainerId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<number | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<number | null>(null);
  const scriptLoadedRef = useRef(false);

  // Recaptcha callbacks
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

  // Load reCAPTCHA script - runs once when guest option is selected
  useEffect(() => {
    if (!isOpen || selectedOption !== "guest") return;

    // Reset state for fresh render
    setRecaptchaReady(false);
    setVerified(false);
    setError(null);
    captchaWidgetIdRef.current = null;
    scriptLoadedRef.current = false;

    // Check if already loaded globally - use ready() for timing safety
    const grecap = getGrecaptcha();
    if (grecap) {
      grecap.ready(() => {
        setRecaptchaReady(true);
        scriptLoadedRef.current = true;
      });
      return;
    }

    // Prevent duplicate script loading
    if (document.querySelector('script[src*="recaptcha/api.js"]')) {
      const grecap = getGrecaptcha();
      if (grecap) {
        grecap.ready(() => {
          setRecaptchaReady(true);
          scriptLoadedRef.current = true;
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?hl=en";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Use grecaptcha.ready() to ensure full initialization
      const grecap = getGrecaptcha();
      if (!grecap) {
        setError("Failed to load verification.");
        return;
      }

      grecap.ready(() => {
        setRecaptchaReady(true);
        scriptLoadedRef.current = true;
      });
    };

    script.onerror = () => {
      setError("Failed to load verification. Please check your connection.");
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount or when modal closes
      // We don't remove the script as it may be used elsewhere
    };
  }, [isOpen, selectedOption]);

  // Render reCAPTCHA widget - runs when recaptcha is ready
  useEffect(() => {
    if (!isOpen || selectedOption !== "guest" || !recaptchaReady || verified) return;

    // Find the container
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if reCAPTCHA is available - use ready() for timing safety
    const grecap = getGrecaptcha();
    if (!grecap) {
      return;
    }

    // Use ready() to ensure grecaptcha is fully initialized
    grecap.ready(() => {
      // Check if widget already exists on this container
      try {
        // Use a data attribute to track if we've already rendered
        const hasWidget = container.getAttribute("data-recaptcha-rendered") === "true";
        
        if (!hasWidget && grecap) {
          const widgetId = grecap.render(container, {
            sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
            theme: "light",
            size: "normal",
            callback: handleRecaptchaSuccess,
            "expired-callback": handleRecaptchaExpired,
            "error-callback": handleRecaptchaError,
          });
          
          captchaWidgetIdRef.current = widgetId;
          container.setAttribute("data-recaptcha-rendered", "true");
        }
      } catch (err) {
        console.error("reCAPTCHA render error:", err);
        setError("Failed to load captcha. Please try again.");
      }
    });
  });

  useEffect(() => {
    if (!isOpen) {
      // Clear widget when modal closes
      const widgetId = captchaWidgetIdRef.current;
      const grecap = getGrecaptcha();
      if (typeof widgetId === "number" && grecap) {
        try {
          grecap.reset(widgetId);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      captchaWidgetIdRef.current = null;
      setSelectedOption(null);
      setCaptchaWidgetId(null);
      setRecaptchaReady(false);
      setVerified(false);
      setError(null);
      scriptLoadedRef.current = false;
    }
  }, [isOpen]);

  const handleClose = () => {
    setError(null);
    setVerified(false);
    setSelectedOption(null);
    setCaptchaWidgetId(null);
    setRecaptchaReady(false);
    scriptLoadedRef.current = false;
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("recaptchaToken");
    }
    onClose();
  };

  const handleContinueAsGuest = () => {
    // Trigger reCAPTCHA verification
    const widgetId = captchaWidgetIdRef.current;
    const grecap = getGrecaptcha();
    if (!verified && typeof widgetId === "number" && grecap) {
      try {
        grecap.execute(widgetId);
      } catch (err) {
        // If execute fails, try reset to show the checkbox
        try {
          grecap.reset(widgetId as number);
        } catch (resetErr) {
          console.error("reCAPTCHA reset error:", resetErr);
        }
      }
    }
  };

  const handleGoBack = () => {
    // Clear the widget before going back
    const widgetId = captchaWidgetIdRef.current;
    const grecap = getGrecaptcha();
    if (typeof widgetId === "number" && grecap) {
      try {
        grecap.reset(widgetId);
      } catch (e) {
        // Ignore
      }
    }
    
    captchaWidgetIdRef.current = null;
    setSelectedOption(null);
    setCaptchaWidgetId(null);
    setRecaptchaReady(false);
    scriptLoadedRef.current = false;
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
                {!selectedOption ? (
                  <>
                    {/* Login Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        router.push("/login");
                      }}
                      className="btn-primary-fashion w-full rounded-lg flex items-center justify-center gap-2"
                    >
                      <User size={18} />
                      Login to Account
                    </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-gray-500">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Guest Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedOption("guest")}
                      className="w-full rounded-lg flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors text-gray-700"
                    >
                      Continue as Guest
                    </button>
                  </>
                ) : (
                  <>
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      ← Back to options
                    </button>

                    {/* reCAPTCHA Container */}
                    {recaptchaReady ? (
                      <div className="flex justify-center">
                        <div 
                          id={containerId} 
                          ref={containerRef}
                          className="g-recaptcha-container"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 size={18} className="animate-spin" />
                          <span className="text-sm">Loading verification...</span>
                        </div>
                      </div>
                    )}

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
                          "Continue to Checkout"
                        )}
                      </button>
                    )}

                    <p className="text-center text-xs text-gray-500">
                      Verified users can proceed to checkout without creating an
                      account
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuestCheckoutModal;
