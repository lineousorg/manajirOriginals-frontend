import { apiClient } from "@/hooks/useApi";

// API Response type
export interface ApiOrderResponse {
  id: number;
  userId: number;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
  };
}

interface ApiResponse {
  message: string;
  status: string;
  data: ApiOrderResponse[];
}

export const orderService = {
  async getOrders(): Promise<ApiOrderResponse[]> {
    const response = await apiClient.get<ApiResponse>("/orders");
    return response.data.data;
  },

  async getOrderById(id: string): Promise<ApiOrderResponse | null> {
    try {
      const response = await apiClient.get<{ data: ApiOrderResponse }>(`/orders/${id}`);
      return response.data.data || null;
    } catch {
      return null;
    }
  },
};
