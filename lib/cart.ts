import type { MyReservation, ReservationData } from "@/services/stock-reservation.service";

let guestToken: string | null = null;

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/** Guest token TTL: 7 days (in milliseconds) */
const GUEST_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

const GUEST_TOKEN_KEY = "guestToken";
const GUEST_TOKEN_EXPIRY_KEY = "guestTokenExpiry";

interface GuestApiResponse<T> {
  message?: string;
  data?: T;
}

/**
 * Check whether the stored guest token has expired.
 */
function isGuestTokenExpired(): boolean {
  const expiry = localStorage.getItem(GUEST_TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > Number(expiry);
}

/**
 * Initialize guest token for anonymous session tracking.
 * Reuses an existing token only if it has not expired.
 * Call this on app startup.
 */
export async function initializeGuestToken() {
  try {
    if (!isGuestTokenExpired()) {
      guestToken = localStorage.getItem(GUEST_TOKEN_KEY);
    }

    if (!guestToken) {
      const response = await fetch(`${baseUrl}/stock-reservation/guest-token`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get guest token");
      }

      const data = await response.json();
      guestToken = data.guestToken;

      if (guestToken) {
        localStorage.setItem(GUEST_TOKEN_KEY, guestToken);
        localStorage.setItem(
          GUEST_TOKEN_EXPIRY_KEY,
          String(Date.now() + GUEST_TOKEN_TTL)
        );
      }
    }

    return guestToken;
  } catch (error) {
    console.error("Failed to initialize guest token:", error);
    return null;
  }
}

/**
 * Get current guest token
 */
export function getGuestToken() {
  return guestToken;
}

/**
 * Clear guest token (on logout or manual reset)
 */
export function clearGuestToken() {
  guestToken = null;
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem(GUEST_TOKEN_EXPIRY_KEY);
}

/**
 * Determine whether an HTTP response indicates the guest token is invalid or expired.
 * Covers 401/403 status codes and common backend error messages.
 */
function isTokenError(response: Response, data: unknown): boolean {
  if (response.status === 401 || response.status === 403) {
    return true;
  }
  if (data && typeof data === "object") {
    const message = (data as { message?: string }).message?.toLowerCase() ?? "";
    return (
      message.includes("invalid token") ||
      message.includes("token expired") ||
      message.includes("guest token") ||
      message.includes("unauthorized")
    );
  }
  return false;
}

/**
 * Higher-order function: executes a guest API call and, if the response indicates
 * an invalid/expired token, refreshes the token once and retries the call.
 *
 * Rules:
 *  - The factory function receives the current token and must return a fetch Response.
 *  - The parser function extracts the useful data from a successful Response.
 *  - At most ONE retry is performed to prevent infinite loops.
 */
async function withGuestTokenRetry<T>(
  factory: (token: string) => Promise<Response>,
  parser: (data: unknown) => T
): Promise<T> {
  let token = getGuestToken();
  if (!token) {
    throw new Error("Guest token not initialized");
  }

  let response = await factory(token);
  let data: unknown;

  // Parse body once so we can inspect it for token-error messages
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // If the token is invalid, refresh it and retry exactly once
  if (!response.ok && isTokenError(response, data)) {
    clearGuestToken();
    const fresh = await initializeGuestToken();
    if (!fresh) {
      throw new Error(
        (data && typeof data === "object" && "message" in data
          ? (data as { message: string }).message
          : "Guest token is invalid and could not be refreshed")
      );
    }
    token = fresh;
    response = await factory(token);
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : null) || "Request failed";
    throw new Error(message);
  }

  return parser(data);
}

/**
 * Reserve stock for a product variant (guest users).
 * Automatically retries once with a fresh token if the current one is rejected.
 */
export async function addToCart(variantId: number, quantity: number) {
  return withGuestTokenRetry<GuestApiResponse<ReservationData>>(
    (token) =>
      fetch(`${baseUrl}/stock-reservation/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId, quantity, guestToken: token }),
      }),
    (data) => data as GuestApiResponse<ReservationData>
  );
}

/**
 * Release a reservation (remove from cart) - guest version.
 * Automatically retries once with a fresh token if the current one is rejected.
 */
export async function removeFromCart(reservationId: number) {
  return withGuestTokenRetry<GuestApiResponse<{ success?: boolean }>>(
    (token) =>
      fetch(`${baseUrl}/stock-reservation/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reservationId, guestToken: token }),
      }),
    (data) => data as GuestApiResponse<{ success?: boolean }>
  );
}

/**
 * Get active reservations for current guest.
 * Automatically retries once with a fresh token if the current one is rejected.
 */
export async function getActiveReservations() {
  return withGuestTokenRetry<MyReservation[] | undefined>(
    (token) => {
      const url = new URL(
        `${baseUrl}/stock-reservation/my-reservations`,
        window.location.origin
      );
      url.searchParams.append("guestToken", token);
      return fetch(url, { credentials: "include" });
    },
    (data) => (data as GuestApiResponse<MyReservation[]>)?.data
  );
}

/**
 * Migrate guest reservations to user account after login
 */
export async function migrateGuestReservations(jwtToken: string) {
  const guestToken = getGuestToken();

  if (!guestToken) {
    return;
  }

  try {
    await fetch(`${baseUrl}/stock-reservation/migrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      credentials: "include",
      body: JSON.stringify({
        guestToken,
      }),
    });

    clearGuestToken();
  } catch (error) {
    console.error(
      "Failed to migrate reservations:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
