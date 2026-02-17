import { User } from "@/types";
import { apiClient } from "@/hooks/useApi";

// API Response structure (direct - no wrapper)
export interface LoginResponse {
  user: {
    id: number;
    email: string;
    role: string;
  };
  accessToken: string;
}

export const userService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", response.data.accessToken);
    }

    return response.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>("/auth/me");
      return response.data.user;
    } catch {
      return null;
    }
  },
};
