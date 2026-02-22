import { ApiProduct, Category } from "@/types";
import { apiClient } from "@/hooks/useApi";
import { normalizeProduct } from "@/hooks/useProduct";

// ─── API Response types ───────────────────────────────────────────
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

export const productService = {
  async getProducts(filters?: Partial<{
    category: string;
    minPrice: number;
    maxPrice: number;
    sizes: string[];
    colors: string[];
    sortBy: string;
    page: number;
    limit: number;
  }>): Promise<{ products: ApiProduct[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.minPrice) params.append("minPrice", String(filters.minPrice));
    if (filters?.maxPrice) params.append("maxPrice", String(filters.maxPrice));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const qs = params.toString();
    const url = `/products${qs ? `?${qs}` : ""}`;

    const response = await apiClient.get<ProductsApiResponse>(url);
    const products = (response.data.data || []).map(normalizeProduct);

    return {
      products,
      total: products.length,
    };
  },

  async getProductById(id: string | number): Promise<ApiProduct | null> {
    try {
      const response = await apiClient.get<SingleProductApiResponse>(
        `/products/${id}`,
      );
      return normalizeProduct(response.data.data);
    } catch {
      return null;
    }
  },

  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<CategoriesApiResponse>("/categories");
    return response.data.data || [];
  },
};
