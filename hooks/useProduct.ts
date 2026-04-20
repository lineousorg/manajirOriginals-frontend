/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useApi from "@/hooks/useApi";
import {
  ApiProduct,
  Category,
  ProductColor,
  ProductVariant,
  Address,
} from "@/types";
import { useProductStore } from "@/store/product.store";
import { useCategoryStore } from "@/store/category.store";
import { useAddressStore } from "@/store/address.store";

// ─── Response types ───────────────────────────────────────────────
interface ProductsApiResponse {
  message: string;
  status: string;
  data: ApiProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface SingleProductApiResponse {
  message: string;
  status: string;
  data: ApiProduct;
}

interface CategoriesApiResponse {
  message: string;
  status: string;
  data: Category[];
}

// ─── Pagination types ───────────────────────────────────────────────
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UseProductsOptions {
  /** Auto-refresh interval in milliseconds. Set 0 to disable. Default: 0 (disabled) */
  refreshInterval?: number;
  /** Fetch immediately on mount. Default: true */
  fetchOnMount?: boolean;
  /** Query params to pass to GET /products */
  params?: Record<string, string | number | undefined>;
  /** Default page size. Default: 10 */
  defaultLimit?: number;
}

interface UseProductByIdOptions {
  refreshInterval?: number;
  fetchOnMount?: boolean;
}

// ─── Helper: normalise API product to a consistent shape ──────────
export function normalizeProduct(raw: ApiProduct): ApiProduct {
  const colors: ProductColor[] = [];
  const sizes: string[] = [];

  if (raw.variants && Array.isArray(raw.variants)) {
    raw.variants.forEach((variant: ProductVariant) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          const attrName = attr.attributeValue?.attribute?.name;
          const attrValue = attr.attributeValue?.value;

          if (attrName === "Color" && attrValue) {
            if (!colors.find((c) => c.name === attrValue)) {
              colors.push({
                name: attrValue,
                value: attrValue,
              });
            }
          }

          if (attrName === "Size" && attrValue) {
            if (!sizes.includes(attrValue)) {
              sizes.push(attrValue);
            }
          }
        });
      }
    });
  }

  return {
    ...raw,
    images:
      Array.isArray(raw.images) && raw.images.length > 0
        ? raw.images
        : [
            {
              url: "https://placehold.co/600x800?text=No+Image",
              altText: "No Image",
            },
          ],
    colors: colors.length > 0 ? colors : raw.colors ?? [],
    sizes: sizes.length > 0 ? sizes : raw.sizes ?? [],
    details: raw.details ?? [],
    description: raw.description ?? "",
    isActive: raw.isActive ?? true,
  };
}

// ─── Helper: extract parent / child categories from a product ─────
export function getProductParentCategory(product: ApiProduct): Category | null {
  if (!product.category) return null;
  if (product.category.parent) {
    return product.category.parent as unknown as Category;
  }
  if (product.category.parentId === null) {
    return product.category as unknown as Category;
  }
  return null;
}

export function getProductChildCategory(product: ApiProduct): Category | null {
  if (!product.category) return null;
  if (product.category.parentId !== null) {
    return product.category as unknown as Category;
  }
  return null;
}

export function getProductCategories(product: ApiProduct) {
  return {
    parent: getProductParentCategory(product),
    child: getProductChildCategory(product),
    raw: product.category ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// useProducts – fetch list of products with pagination
// ═══════════════════════════════════════════════════════════════════
export function useProducts(options: UseProductsOptions = {}) {
  const {
    refreshInterval = 0,
    fetchOnMount = true,
    params,
    defaultLimit = 10,
  } = options;

  const { get, loading, error } = useApi();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use global store for caching
  const setGlobalProducts = useProductStore((state) => state.setProducts);
  const getPageCache = useProductStore((state) => state.getPageCache);
  const setPageCache = useProductStore((state) => state.setPageCache);
  const globalLoading = useProductStore((state) => state.isLoading);
  const setGlobalLoading = useProductStore((state) => state.setLoading);

  // Serialize params to avoid infinite re-renders
  const paramsKey = params ? JSON.stringify(params) : "";

  const fetchProducts = useCallback(
    async (page = 1, limit = defaultLimit, clearProducts = true) => {
      // Clear products when fetching new page to show loading state
      if (clearProducts) {
        setProducts([]);
      }

      try {
        // Set global loading
        setGlobalLoading(true);
        // Build query string
        const searchParams = new URLSearchParams();
        searchParams.append("page", String(page));
        searchParams.append("limit", String(limit));

        // Add any additional params
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
              searchParams.append(key, String(value));
            }
          });
        }

        const url = `/products?${searchParams.toString()}`;
        const response = await get<ProductsApiResponse>(url, {
          skipAuth: true,
        });

        const normalized = (response.data || []).map(normalizeProduct);
        const activeProducts = normalized.filter(
          (product) => product.isActive !== false
        );

        setProducts(activeProducts);

        // Set pagination info from response
        if (response.pagination) {
          setPagination({
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
            hasNext: response.pagination.hasNext,
            hasPrevious: response.pagination.hasPrevious,
          });
        } else {
          // Fallback if no pagination in response
          setPagination({
            page: 1,
            limit: activeProducts.length,
            total: activeProducts.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          });
        }

        // Store in global state if fetching first page without filters (for caching)
        if (page === 1 && !params && activeProducts.length > 0) {
          setGlobalProducts(activeProducts);
        }

        // Cache page data for quick navigation
        if (!params) {
          setPageCache(page, {
            products: activeProducts,
            total: response.pagination?.total || activeProducts.length,
            totalPages: response.pagination?.totalPages || 1,
          });
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setGlobalLoading(false);
      }
    },
    [get, paramsKey, defaultLimit]
  );

  // Initial fetch - check cache first
  useEffect(() => {
    if (fetchOnMount) {
      // Check if we have cached data for page 1
      const cached = getPageCache(1);
      if (cached && !params) {
        setProducts(cached.products);
        setPagination({
          page: 1,
          limit: 10,
          total: cached.total,
          totalPages: cached.totalPages,
          hasNext: cached.totalPages > 1,
          hasPrevious: false,
        });
      } else if (!globalLoading) {
        // Only fetch if not already loading
        fetchProducts(1, defaultLimit);
      }
    }
    // Only run on mount
  }, [fetchOnMount]);

  // Auto-refresh only if explicitly enabled
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(
        () => fetchProducts(pagination?.page || 1, defaultLimit),
        refreshInterval
      );
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchProducts]);

  const goToPage = useCallback(
    (page: number) => {
      if (pagination && page >= 1 && page <= pagination.totalPages) {
        fetchProducts(page, pagination.limit);
      }
    },
    [pagination, fetchProducts]
  );

  const nextPage = useCallback(() => {
    if (pagination?.hasNext) {
      fetchProducts(pagination.page + 1, pagination.limit);
    }
  }, [pagination, fetchProducts]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrevious) {
      fetchProducts(pagination.page - 1, pagination.limit);
    }
  }, [pagination, fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refetch: () =>
      fetchProducts(pagination?.page || 1, pagination?.limit || defaultLimit),
  };
}

// ═══════════════════════════════════════════════════════════════════
// useProductById – fetch a single product by ID (no auto-refresh by default)
// ═══════════════════════════════════════════════════════════════════
export function useProductById(
  id: string | number | undefined,
  options: UseProductByIdOptions = {}
) {
  const { refreshInterval = 0, fetchOnMount = true } = options;

  const { get, loading, error } = useApi();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const response = await get<SingleProductApiResponse>(`/products/${id}`, {
        skipAuth: true,
      });
      setProduct(normalizeProduct(response.data));
    } catch (err) {
      console.error("Failed to fetch product:", err);
    }
  }, [get, id]);

  // Initial fetch
  useEffect(() => {
    if (fetchOnMount && id) {
      fetchProduct();
    }
  }, [id, fetchOnMount]);

  useEffect(() => {
    if (refreshInterval > 0 && id) {
      intervalRef.current = setInterval(fetchProduct, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, id, fetchProduct]);

  const categories = product ? getProductCategories(product) : null;

  return {
    product,
    categories,
    loading,
    error,
    refetch: fetchProduct,
  };
}

// ═══════════════════════════════════════════════════════════════════
// useCategoryProductCounts – get product counts per category
// Uses global products store when available (no extra API call)
// ═══════════════════════════════════════════════════════════════════
interface CategoryProductCount {
  categorySlug: string;
  categoryId: string | number;
  count: number;
}

interface UseCategoryProductCountsOptions {
  products?: ApiProduct[];
}

export function useCategoryProductCounts(
  options: UseCategoryProductCountsOptions = {}
) {
  const { products: providedProducts } = options;
  const [categoryCounts, setCategoryCounts] = useState<CategoryProductCount[]>(
    []
  );

  const globalProducts = useProductStore((state) => state.products);

  const products = providedProducts || globalProducts || [];

  useEffect(() => {
    if (products.length === 0) {
      setCategoryCounts([]);
      return;
    }

    const countMap = new Map<string, { id: string | number; count: number }>();

    products.forEach((product) => {
      if (product.category) {
        const categorySlug = product.category.slug;
        const categoryId = product.category.id;

        const existing = countMap.get(categorySlug);
        if (existing) {
          existing.count += 1;
        } else {
          countMap.set(categorySlug, { id: categoryId, count: 1 });
        }

        if (product.category.parent) {
          const parentSlug = product.category.parent.slug;
          const parentId = product.category.parent.id;

          const parentExisting = countMap.get(parentSlug);
          if (parentExisting) {
            parentExisting.count += 1;
          } else {
            countMap.set(parentSlug, { id: parentId, count: 1 });
          }
        }
      }
    });

    const counts: CategoryProductCount[] = Array.from(countMap.entries()).map(
      ([categorySlug, { id, count }]) => ({
        categorySlug,
        categoryId: id,
        count,
      })
    );

    setCategoryCounts(counts);
  }, [products]);

  const getCountBySlug = useCallback(
    (slug: string) => {
      const found = categoryCounts.find((c) => c.categorySlug === slug);
      return found?.count ?? 0;
    },
    [categoryCounts]
  );

  return {
    categoryCounts,
    getCountBySlug,
    loading: false,
    error: null,
    refetch: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
// useCategories – fetch categories (with global store caching)
// ═══════════════════════════════════════════════════════════════════
export function useCategories() {
  const { get, loading, error } = useApi();
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    categories: globalCategories,
    setCategories: setGlobalCategories,
    isLoading: globalLoading,
    setLoading: setGlobalLoading,
  } = useCategoryStore();

  // Use global store categories if available
  useEffect(() => {
    // If already loaded in global store, use it
    if (globalCategories && globalCategories.length > 0) {
      setCategories(globalCategories);
      return;
    }

    // If already loading globally, wait
    if (globalLoading) {
      return;
    }

    // Start loading
    setGlobalLoading(true);

    const fetchCategories = async () => {
      try {
        const response = await get<CategoriesApiResponse>("/categories", {
          skipAuth: true,
        });
        const fetchedCategories = response.data || [];
        setCategories(fetchedCategories);
        setGlobalCategories(fetchedCategories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchCategories();
  }, [
    globalCategories,
    globalLoading,
    get,
    setGlobalCategories,
    setGlobalLoading,
  ]);

  // Build tree: parent categories with children nested
  // Filter out inactive categories
  const activeCategories = categories.filter((cat) => cat.isActive !== false);

  const categoryTree = activeCategories
    .filter((cat) => cat.parentId === null)
    .map((cat) => ({
      ...cat,
      children: activeCategories.filter((child) => child.parentId === cat.id),
    }));

  const getParentCategories = () =>
    activeCategories.filter((c) => c.parentId === null);
  const getChildCategories = (parentId?: number) =>
    parentId
      ? activeCategories.filter((c) => c.parentId === parentId)
      : activeCategories.filter((c) => c.parentId !== null);

  return {
    categories: activeCategories,
    categoryTree,
    getParentCategories,
    getChildCategories,
    loading,
    error,
    refetch: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
// useAddresses – fetch addresses (with global store caching)
// ═══════════════════════════════════════════════════════════════════
interface AddressesApiResponse {
  data: Address[];
}

export function useAddresses() {
  const { get, error: apiError } = useApi();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  const {
    addresses: globalAddresses,
    setAddresses: setGlobalAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    isLoading: globalLoading,
    setLoading: setGlobalLoading,
    hasAttemptedFetch: globalHasAttemptedFetch,
    setHasAttemptedFetch: setGlobalHasAttemptedFetch,
  } = useAddressStore();

  // Use global store addresses if available
  useEffect(() => {
    // If we've already attempted to fetch globally, don't fetch again (prevents infinite loop)
    // This handles both: success with empty array AND error cases
    if (globalHasAttemptedFetch) {
      setLocalLoading(false);
      return;
    }

    // If already loaded in global store with data, use it
    if (globalAddresses && globalAddresses.length > 0) {
      setAddresses(globalAddresses);
      setLocalLoading(false);
      setGlobalHasAttemptedFetch(true); // Mark as attempted
      return;
    }

    // If already loading globally, wait
    if (globalLoading) {
      return;
    }

    // Start loading
    setGlobalLoading(true);
    setLocalLoading(true);
    setGlobalHasAttemptedFetch(true); // Mark as attempted BEFORE fetching

    const fetchAddresses = async () => {
      try {
        const response = await get<AddressesApiResponse>("/addresses");
        const fetchedAddresses = response.data || [];
        setAddresses(fetchedAddresses);
        setGlobalAddresses(fetchedAddresses);
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
        setAddresses([]);
        setGlobalAddresses([]); // Also set global to empty to prevent re-fetching
      } finally {
        setGlobalLoading(false);
        setLocalLoading(false);
      }
    };

    fetchAddresses();
  }, [globalAddresses, globalLoading, get, setGlobalAddresses, setGlobalLoading, globalHasAttemptedFetch, setGlobalHasAttemptedFetch]);

  const refetch = async () => {
    // Allow refetch by resetting the flag
    setGlobalHasAttemptedFetch(false);
    setLocalLoading(true);
    try {
      const response = await get<AddressesApiResponse>("/addresses");
      const fetchedAddresses = response.data || [];
      setAddresses(fetchedAddresses);
      setGlobalAddresses(fetchedAddresses);
      setGlobalHasAttemptedFetch(true);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      setAddresses([]);
      setGlobalAddresses([]);
    } finally {
      setLocalLoading(false);
    }
  };

  return {
    addresses,
    loading: localLoading,
    error: apiError,
    refetch,
    addAddress,
    updateAddress,
    removeAddress,
  };
}

// ═════════════════════════════════════════════════════════════════════
// Category Products API types
// ═════════════════════════════════════════════════════════════════════

export interface CategoryProductsFilters {
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  sortBy?: "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
}

interface CategoryProductsApiResponse {
  message: string;
  status: string;
  data: ApiProduct[];
  pagination: PaginationInfo;
}

interface UseCategoryProductsOptions {
  /** Category slug to fetch products for */
  categorySlug: string;
  /** Current page number (default: 1) */
  page?: number;
  /** Number of items per page (default: 20) */
  limit?: number;
  /** Filter options */
  filters?: CategoryProductsFilters;
  /** Auto-fetch on mount (default: true) */
  fetchOnMount?: boolean;
}

/**
 * Hook to fetch products by category using server-side filtering
 * API: GET /products/category/:slug?page=1&limit=20&minPrice=...&maxPrice=...&sizes=...&colors=...&sortBy=...
 */
export function useCategoryProducts(options: UseCategoryProductsOptions) {
  const {
    categorySlug,
    page = 1,
    limit = 20,
    filters = {},
    fetchOnMount = true,
  } = options;

  const { get, loading, error } = useApi();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [availableFilters, setAvailableFilters] = useState<{
    sizes: string[];
    colors: Array<{ name: string; hex: string }>;
    priceRange: { min: number; max: number };
  } | null>(null);

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      params.set("minPrice", filters.minPrice.toString());
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      params.set("maxPrice", filters.maxPrice.toString());
    }
    if (filters.sizes && filters.sizes.length > 0) {
      params.set("sizes", filters.sizes.join(","));
    }
    if (filters.colors && filters.colors.length > 0) {
      params.set("colors", filters.colors.join(","));
    }
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
    }

    return params.toString();
  };

  const fetchProducts = useCallback(async () => {
    if (!categorySlug) return;

    // console.log(categorySlug);

    try {
      const queryString = buildQueryString();
      const response = await get<CategoryProductsApiResponse>(
        `/products/category/${categorySlug}?${queryString}`
      );

      if (response?.data) {
        setProducts(response.data || []);
        setPagination(response.pagination || null);
        // Clear filters since new API doesn't return them
        setAvailableFilters(null);
      }
    } catch (err) {
      console.error("Failed to fetch category products:", err);
      setProducts([]);
      setCategory(null);
    }
  }, [categorySlug, page, limit, JSON.stringify(filters)]);

  useEffect(() => {
    if (fetchOnMount && categorySlug) {
      fetchProducts();
    }
  }, [fetchOnMount, categorySlug, fetchProducts]);

  const refetch = useCallback(() => {
    return fetchProducts();
  }, [fetchProducts]);

  return {
    category,
    products,
    pagination,
    availableFilters,
    loading,
    error,
    refetch,
  };
}
