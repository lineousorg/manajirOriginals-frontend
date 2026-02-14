export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  colors: ProductColor[];
  sizes: string[];
  description: string;
  details: string[];
  isNew?: boolean;
  isSale?: boolean;
}

export interface ProductColor {
  name: string;
  value: string;
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
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
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

export interface Category {
  id: string;
  image?: string;
  productCount: number;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
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
