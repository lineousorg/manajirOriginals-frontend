/*
 *** GUEST API HOOK - COMMENTED OUT ***
 This entire hook has been disabled as guest checkout flow is removed.
 No longer needed - all orders go through the standard /orders endpoint.
 Original code preserved in version control.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useState, useCallback } from "react";

/*
 // Original implementation below - DISABLED

export interface GuestApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

export const guestApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

guestApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error),
);

guestApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.error ||
      error?.response?.data?.non_field_errors?.[0] ||
      "Something went wrong";

    return Promise.reject(new Error(backendMessage));
  },
);

type Transformer<T> = (data: any) => T;

const useGuestApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(
    async <T = any>(
      url: string,
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      // Implementation commented out
      return transform ? transform({}) : {};
    },
    [],
  );

  const post = useCallback(
    async <T = any>(
      url: string,
      data: any = {},
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      // Implementation commented out
      return transform ? transform({}) : {};
    },
    [],
  );

  const put = useCallback(
    async <T = any>(
      url: string,
      data: any = {},
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      // Implementation commented out
      return transform ? transform({}) : {};
    },
    [],
  );

  const patch = useCallback(
    async <T = any>(
      url: string,
      data: any = {},
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      // Implementation commented out
      return transform ? transform({}) : {};
    },
    [],
  );

  const del = useCallback(
    async <T = any>(
      url: string,
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      // Implementation commented out
      return transform ? transform({}) : {};
    },
    [],
  );

  return { get, post, put, patch, del, loading, error };
};

export default useGuestApi;
*/

// Simplified stub that returns empty functions to avoid breaking imports
const useGuestApi = () => ({
  get: async () => ({ }),
  post: async () => ({ }),
  put: async () => ({ }),
  patch: async () => ({ }),
  del: async () => ({ }),
  loading: false,
  error: null,
});

export default useGuestApi;
