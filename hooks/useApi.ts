/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useState, useCallback } from "react";

// Custom config type that includes skipAuth
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

// Create Axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip auth if skipAuth is true in the config
    if ((config as any).skipAuth) {
      return config;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Transform function type
type Transformer<T> = (data: any) => T;

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(
    async <T = any>(
      url: string,
      config: ApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { skipAuth, ...axiosConfig } = config as ApiRequestConfig;
        const response: AxiosResponse = await apiClient.get(url, axiosConfig);

        if (response.data.status.toString() === "failed") {
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
      config: ApiRequestConfig = {},
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { skipAuth, ...axiosConfig } = config as ApiRequestConfig;
        const response: AxiosResponse = await apiClient.post(url, data, {
          ...axiosConfig,
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

  const put = useCallback(
    async <T = any>(
      url: string,
      data: any = {},
      config: ApiRequestConfig = {},
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { skipAuth, ...axiosConfig } = config as ApiRequestConfig;
        const response: AxiosResponse = await apiClient.put(url, data, {
          ...axiosConfig,
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

  const patch = useCallback(
    async <T = any>(
      url: string,
      data: any = {},
      config: ApiRequestConfig = {},
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { skipAuth, ...axiosConfig } = config as ApiRequestConfig;
        const response: AxiosResponse = await apiClient.patch(url, data, {
          ...axiosConfig,
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
      config: ApiRequestConfig = {},
      transform?: Transformer<T>,
    ): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { skipAuth, ...axiosConfig } = config as ApiRequestConfig;
        const response: AxiosResponse = await apiClient.delete(
          url,
          axiosConfig,
        );

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

export default useApi;
