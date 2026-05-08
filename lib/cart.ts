let guestToken: string | null = null;

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Initialize guest token for anonymous session tracking
 * Call this on app startup
 */
export async function initializeGuestToken() {
  try {
    // Check localStorage first
    guestToken = localStorage.getItem("guestToken");

    if (!guestToken) {
      // Get token from backend
      console.log(guestToken);
      const response = await fetch(`${baseUrl}/stock-reservation/guest-token`, {
        method: "GET",
        credentials: "include", // Important: include cookies
      });
      console.log(response);

      if (!response.ok) {
        throw new Error("Failed to get guest token");
      }

      const data = await response.json();
      guestToken = data.guestToken;

      // Store in localStorage for easy access
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
 * Reserve stock for a product variant
 * @param {number} variantId - Product variant ID
 * @param {number} quantity - Quantity to reserve
 * @returns {Promise<Object>} Reservation result
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
    credentials: "include", // Include cookies for auth
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
 * Release a reservation (remove from cart)
 * @param {number} reservationId - Reservation ID to release
 * @returns {Promise<Object>} Release result
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
 * Get active reservations for current user/guest
 * @returns {Promise<Array>} List of reservations
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
 * Check if a variant is available in the requested quantity
 * @param {number} variantId - Product variant ID
 * @param {number} quantity - Quantity to check
 * @returns {Promise<Object>} Availability result
 */
export async function checkAvailability(variantId: number, quantity: number) {
  const response = await fetch(`${baseUrl}/stock-reservation/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variantId,
      quantity,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to check availability");
  }

  return data;
}

/**
 * Migrate guest reservations to user account after login
 * @param {string} jwtToken - User's JWT token
 * @returns {Promise<void>}
 */
export async function migrateGuestReservations(jwtToken: string) {
  const guestToken = getGuestToken();

  if (!guestToken) {
    return; // No guest reservations to migrate
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

    // Clear guest token after migration
    clearGuestToken();
  } catch (error) {
    console.error(
      "Failed to migrate reservations:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // Reservations will remain under guest token
    // They can still be accessed with the token
  }
}
