import { User } from "@/types";
import { apiClient } from "@/hooks/useApi";

export interface LoginResponse {
  message: string;
  status: string;
  data: {
    user: {
      id: number;
      email: string;
      name: string;
    };
    token: string;
  };
}

export const userService = {
  async login(email: string, password: string): Promise<LoginResponse["data"]> {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    if (response.data.status === "failed") {
      throw new Error(response.data.message || "Login failed");
    }

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", response.data.data.token);
    }

    return response.data.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },

  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ data: { user: User } }>(
        "/auth/me",
      );
      return response.data.data.user;
    } catch {
      return null;
    }
  },
};
