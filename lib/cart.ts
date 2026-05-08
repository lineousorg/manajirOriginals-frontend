let guestToken: string | null = null;

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Initialize guest token for anonymous session tracking
 * Call this on app startup
 */
export async function initializeGuestToken() {
  try {
    guestToken = localStorage.getItem("guestToken");

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
        localStorage.setItem("guestToken", guestToken);
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
  localStorage.removeItem("guestToken");
}

/**
 * Reserve stock for a product variant (guest users)
 */
export async function addToCart(variantId: number, quantity: number) {
  const token = getGuestToken();

  if (!token) {
    throw new Error("Guest token not initialized");
  }

  const response = await fetch(`${baseUrl}/stock-reservation/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      variantId,
      quantity,
      guestToken: token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add to cart");
  }

  return data;
}

/**
 * Release a reservation (remove from cart) - guest version
 */
export async function removeFromCart(reservationId: number) {
  const token = getGuestToken();

  if (!token) {
    throw new Error("Guest token not initialized");
  }

  const response = await fetch(`${baseUrl}/stock-reservation/release`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      reservationId,
      guestToken: token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove from cart");
  }

  return data;
}

/**
 * Get active reservations for current guest
 */
export async function getActiveReservations() {
  const token = getGuestToken();

  const url = new URL(
    `${baseUrl}/stock-reservation/my-reservations`,
    window.location.origin
  );
  if (token) {
    url.searchParams.append("guestToken", token);
  }

  const response = await fetch(url, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch reservations");
  }

  return data.data;
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
