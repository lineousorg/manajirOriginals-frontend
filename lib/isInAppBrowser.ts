/**
 * Detect in-app browsers (Facebook, Instagram, Messenger, etc.)
 *
 * These browsers run inside WebViews that have known limitations:
 * - Fixed-position elements may not render correctly
 * - Overlays/backdrops may block all interaction
 * - Drawer/sheet components often fail to display
 *
 * By detecting these environments, we can redirect users to the
 * full /cart page instead of relying on the drawer UI.
 */

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";

  return (
    ua.includes("FBAN") ||
    ua.includes("FBAV") ||
    ua.includes("Instagram")
  );
}