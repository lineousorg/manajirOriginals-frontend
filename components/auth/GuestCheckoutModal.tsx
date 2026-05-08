/*
 *** GUEST CHECKOUT MODAL - COMMENTED OUT ***
 This entire component has been disabled. Users are now directed straight to checkout
 without any login/guest selection or reCAPTCHA verification.
 The original implementation is preserved in version control.
 */

"use client";

// All guest checkout and recaptcha logic removed
// Component now renders nothing

import { GoogleRecaptcha } from "@/types";

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

// Component disabled - renders null
export const GuestCheckoutModal = ({
  isOpen,
  onClose,
}: GuestCheckoutModalProps) => {
  // This component is disabled. Checkout flow no longer uses guest modal or recaptcha.
  return null;
};

export default GuestCheckoutModal;
