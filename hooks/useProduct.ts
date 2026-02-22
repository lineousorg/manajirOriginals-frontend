/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useApi from "@/hooks/useApi";
import { ApiProduct, Category, ProductColor } from "@/types";

// ─── Response types ───────────────────────────────────────────────
interface ProductsApiResponse {
  message: string;
  status: string;
  data: ApiProduct[];
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

// ─── Hook options ─────────────────────────────────────────────────
interface UseProductsOptions {
  /** Auto-refresh interval in milliseconds. Set 0 to disable. Default: 30000 (30s) */
  refreshInterval?: number;
  /** Fetch immediately on mount. Default: true */
  fetchOnMount?: boolean;
  /** Query params to pass to GET /products */
  params?: Record<string, string | number | undefined>;
}

interface UseProductByIdOptions {
  refreshInterval?: number;
  fetchOnMount?: boolean;
}

// ─── Helper: normalise API product to a consistent shape ──────────
interface VariantAttribute {
  variantId: number;
  attributeValueId: number;
  attributeValue: {
    id: number;
    value: string;
    attributeId: number;
    attribute: {
      id: number;
      name: string;
    };
  };
}

interface Variant {
  id: number;
  sku: string;
  price: string;
  stock: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
  attributes: VariantAttribute[];
}

export function normalizeProduct(raw: ApiProduct): ApiProduct {
  // Extract unique colors and sizes from variants
  const colors: ProductColor[] = [];
  const sizes: string[] = [];

  if (raw.variants && Array.isArray(raw.variants)) {
    raw.variants.forEach((variant: Variant) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          const attrName = attr.attributeValue?.attribute?.name;
          const attrValue = attr.attributeValue?.value;

          if (attrName === "Color" && attrValue) {
            // Check if color already exists
            if (!colors.find((c) => c.name === attrValue)) {
              colors.push({
                name: attrValue,
                value: attrValue, // Using value as hex would require a mapping
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
    // Use extracted colors from variants, fallback to existing colors
    colors: colors.length > 0 ? colors : raw.colors ?? [],
    // Use extracted sizes from variants, fallback to existing sizes
    sizes: sizes.length > 0 ? sizes : raw.sizes ?? [],
    details: raw.details ?? [],
    description: raw.description ?? "",
    // Include isActive property
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
    // The category itself is a parent
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
// useProducts – fetch list of products with auto-refresh
// ═══════════════════════════════════════════════════════════════════
export function useProducts(options: UseProductsOptions = {}) {
  const { refreshInterval = 30_000, fetchOnMount = true, params } = options;

  const { get, loading, error } = useApi();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Serialize params to avoid infinite re-renders from object reference changes
  const paramsKey = params ? JSON.stringify(params) : "";

  const fetchProducts = useCallback(async () => {
    try {
      // Build query string from params
      let url = "/products";
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, String(value));
          }
        });
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
      }

      const response = await get<ProductsApiResponse>(url, { skipAuth: true });
      const normalized = (response.data || []).map(normalizeProduct);
      // Filter out inactive products
      const activeProducts = normalized.filter((product) => product.isActive !== false);
      setProducts(activeProducts);
      setTotal(activeProducts.length);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, paramsKey]);

  // Initial fetch - using useEffect is intentional for async data fetching
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (fetchOnMount) {
      fetchProducts();
    }
  }, [fetchOnMount, fetchProducts]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchProducts, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchProducts]);

  return {
    products,
    total,
    loading,
    error,
    refetch: fetchProducts,
  };
}

// ═══════════════════════════════════════════════════════════════════
// useProductById – fetch a single product by ID with auto-refresh
// ═══════════════════════════════════════════════════════════════════
export function useProductById(
  id: string | number | undefined,
  options: UseProductByIdOptions = {}
) {
  const { refreshInterval = 30_000, fetchOnMount = true } = options;

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

  // Initial fetch - using useEffect is intentional for async data fetching
  const initialFetchCalled = useRef(false);
  useEffect(() => {
    if (!initialFetchCalled.current) {
      initialFetchCalled.current = true;
      if (fetchOnMount && id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProduct();
      }
    }
  }, [fetchOnMount, id, fetchProduct]);

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
// useCategories – fetch categories with auto-refresh
// ═══════════════════════════════════════════════════════════════════
export function useCategories(refreshInterval = 60_000) {
  const { get, loading, error } = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await get<CategoriesApiResponse>("/categories", {
        skipAuth: true,
      });
      setCategories(response.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [get]);

  // Initial fetch - using useEffect is intentional for async data fetching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchCategories, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchCategories]);

  // Build tree: parent categories with children nested
  const categoryTree = categories
    .filter((cat) => cat.parentId === null)
    .map((cat) => ({
      ...cat,
      children: categories.filter((child) => child.parentId === cat.id),
    }));

  const getParentCategories = () =>
    categories.filter((c) => c.parentId === null);
  const getChildCategories = (parentId?: string) =>
    parentId
      ? categories.filter((c) => c.parentId === parentId)
      : categories.filter((c) => c.parentId !== null);

  return {
    categories,
    categoryTree,
    getParentCategories,
    getChildCategories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
