/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export interface ReservationData {
  reservationId: number;
  variantId: number;
  quantity: number;
  expiresAt: string;
  availableStock: number;
}

export interface MyReservation {
  id: number;
  userId: number;
  variantId: number;
  quantity: number;
  status: string;
  expiresAt: string;
  variant: {
    id: number;
    sku: string;
    price: number;
    product: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface AvailableStock {
  variantId: number;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface StockCheckResult {
  available: boolean;
  message: string;
  availableStock: number;
}

// Create axios instance for stock reservation API
const createApiClient = () => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth interceptor
  client.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  return client;
};

const apiClient = createApiClient();

class StockReservationService {
  private getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }

  // Reserve stock when adding to cart
  async reserveStock(
    variantId: number,
    quantity: number,
    expirationMinutes: number = 15
  ): Promise<{ success: boolean; data?: ReservationData; error?: string }> {
    try {
      const response = await apiClient.post(`${this.getBaseUrl()}/stock-reservation/reserve`, {
        variantId,
        quantity,
        expirationMinutes,
      });

      const data = response.data;

      return {
        success: true,
        data: {
          reservationId: data.data.reservationId,
          variantId: data.data.variantId,
          quantity: data.data.quantity,
          expiresAt: data.data.expiresAt,
          availableStock: data.data.availableStock,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to reserve stock";
      console.error("Error reserving stock:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Release a reservation
  async releaseReservation(
    reservationId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post(`${this.getBaseUrl()}/stock-reservation/release`, {
        reservationId,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to release reservation";
      console.error("Error releasing reservation:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get user's active reservations
  async getMyReservations(): Promise<{
    success: boolean;
    data?: MyReservation[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get(
        `${this.getBaseUrl()}/stock-reservation/my-reservations`
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to get reservations";
      console.error("Error getting reservations:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get available stock for a variant (public endpoint)
  async getAvailableStock(
    variantId: number
  ): Promise<{ success: boolean; data?: AvailableStock; error?: string }> {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/stock-reservation/available/${variantId}`
      );

      const data = response.data;

      return {
        success: true,
        data: {
          variantId: data.data.variantId,
          totalStock: data.data.totalStock,
          reservedStock: data.data.reservedStock,
          availableStock: data.data.availableStock,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to get available stock";
      console.error("Error getting available stock:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Check if stock is available (public endpoint)
  async checkAvailability(
    variantId: number,
    quantity: number
  ): Promise<{ success: boolean; data?: StockCheckResult; error?: string }> {
    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/stock-reservation/check`,
        { variantId, quantity }
      );

      const data = response.data;

      return {
        success: true,
        data: {
          available: data.available,
          message: data.message,
          availableStock: data.availableStock,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to check availability";
      console.error("Error checking availability:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Release expired reservations (admin/cron endpoint)
  async releaseExpiredReservations(): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      const response = await apiClient.post(
        `${this.getBaseUrl()}/stock-reservation/release-expired`
      );

      return {
        success: true,
        count: response.data.data?.count || 0,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to release expired reservations";
      console.error("Error releasing expired reservations:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const stockReservationService = new StockReservationService();
