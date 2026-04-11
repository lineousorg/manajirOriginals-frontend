/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useState, useCallback } from "react";

// Custom config type that includes skipAuth
export interface GuestApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

// Create Axios instance for guest API calls (no authentication required)
export const guestApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for guest API - always skips auth
guestApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always skip auth for guest API calls - no token needed
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
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

// Transform function type
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
      setLoading(true);
      setError(null);
      try {
        const response: AxiosResponse = await guestApiClient.get(url, config);

        if (response.data?.status?.toString() === "failed") {
          setError(new Error("Failed to fetch data"));
        }

        return transform ? transform(response.data) : response.data;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
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
      setLoading(true);
      setError(null);
      try {
        const isFormData =
          typeof FormData !== "undefined" && data instanceof FormData;

        const headers = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(config.headers || {}),
        };

        const response: AxiosResponse = await guestApiClient.post(url, data, {
          ...config,
          headers,
        });

        // Check if the API response indicates failure
        if (response.data?.status?.toString() === "failed") {
          const err = new Error(response.data?.message || "Request failed");
          setError(err);
          throw err;
        }

        return transform ? transform(response.data) : response.data;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
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
      setLoading(true);
      setError(null);
      try {
        const isFormData =
          typeof FormData !== "undefined" && data instanceof FormData;

        const headers = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(config.headers || {}),
        };

        const response: AxiosResponse = await guestApiClient.put(url, data, {
          ...config,
          headers,
        });

        return transform ? transform(response.data) : response.data;
      } catch (err: any) {
        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Something went wrong";

        const formattedError = new Error(backendMessage);
        setError(formattedError);
        throw formattedError;
      } finally {
        setLoading(false);
      }
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
      setLoading(true);
      setError(null);
      try {
        const isFormData =
          typeof FormData !== "undefined" && data instanceof FormData;

        const headers = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(config.headers || {}),
        };

        const response: AxiosResponse = await guestApiClient.patch(url, data, {
          ...config,
          headers,
        });

        return transform ? transform(response.data) : response.data;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const del = useCallback(
    async <T = any>(
      url: string,
      config: GuestApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const response: AxiosResponse = await guestApiClient.delete(url, config);

        return transform ? transform(response.data) : response.data;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { get, post, put, patch, del, loading, error };
};

export default useGuestApi;