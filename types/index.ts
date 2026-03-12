/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  stock: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
  attributes?: {
    attributeValueId: number;
    attributeValue?: {
      id: number;
      value: string;
      attributeId: number;
      attribute?: {
        id: number;
        name: string;
      };
    };
  }[];
}

export interface ProductColor {
  name: string;
  value: string;
}
// export interface ImageType {
//   altText: string;
//   url: string;
// }

export interface TypeImage {
  altText: string;
  url: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  images?: TypeImage[];
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    parent?: {
      id: number;
      name: string;
      slug: string;
      parentId: number | null;
    };
    children?: {
      id: number;
      name: string;
      slug: string;
      parentId: number | null;
    }[];
  };
  brand?: string;
  colors?: ProductColor[];
  sizes?: string[];
  variants?: ProductVariant[];
  isNew?: boolean;
  isSale?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * @deprecated Use ApiProduct instead. Kept for backward compatibility with cart/wishlist stores.
 */
export interface Product {
  id: string | number;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  images?: TypeImage[];
  category?: any;
  categoryId?: number | string;
  colors?: ProductColor[];
  sizes?: string[];
  variants?: ProductVariant[];
  description?: string;
  isNew?: boolean;
  isSale?: boolean;
  stock?: number;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  avatar?: string;
}

export interface Address {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  shippingAddress: Address;
  trackingNumber?: string;
}

export interface CategoryImage {
  id: number;
  url: string;
  altText: string;
  position: number;
  type: string;
  productId: number;
  variantId: number;
  categoryId: number;
}

export interface Category {
  id: string | number;
  images?: CategoryImage[];
  productCount?: number;
  name: string;
  slug: string;
  parentId: string | number | null;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  sortBy: "newest" | "price-asc" | "price-desc" | "popular";
}
