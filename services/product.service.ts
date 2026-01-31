import { Product, Category } from '@/types';

const PRODUCT_IMAGES = {
  coats: [
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
    'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80',
  ],
  dresses: [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
  ],
  tops: [
    'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80',
    'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800&q=80',
  ],
  pants: [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1611923134239-b9be5816d823?w=800&q=80',
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80',
  ],
  shoes: [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
  ],
};

const brands = ['Maison Élégance', 'Nordic Minimal', 'Atelier Noir', 'Casa Bella', 'Studio Raw', 'Form & Flow'];
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const colors = [
  { name: 'Charcoal', value: '#36454F' },
  { name: 'Ivory', value: '#FFFFF0' },
  { name: 'Terracotta', value: '#E2725B' },
  { name: 'Stone', value: '#928E85' },
  { name: 'Navy', value: '#000080' },
  { name: 'Sage', value: '#9DC183' },
];

const generateProduct = (id: number, category: string): Product => {
  const categoryImages = PRODUCT_IMAGES[category as keyof typeof PRODUCT_IMAGES] || PRODUCT_IMAGES.tops;
  const isNew = Math.random() > 0.7;
  const isSale = !isNew && Math.random() > 0.8;
  const basePrice = Math.floor(Math.random() * 400) + 100;
  
  const productNames: Record<string, string[]> = {
    coats: ['Wool Blend Overcoat', 'Cashmere Trench', 'Tailored Blazer', 'Quilted Jacket'],
    dresses: ['Silk Midi Dress', 'Linen Shift Dress', 'Knit Maxi Dress', 'Wrap Dress'],
    tops: ['Organic Cotton Tee', 'Silk Blouse', 'Cashmere Sweater', 'Linen Shirt'],
    pants: ['Wide Leg Trousers', 'Tailored Pants', 'Linen Culottes', 'High-Rise Jeans'],
    accessories: ['Leather Tote', 'Silk Scarf', 'Leather Belt', 'Cashmere Beanie'],
    shoes: ['Leather Loafers', 'Ankle Boots', 'Minimalist Sneakers', 'Strappy Sandals'],
  };

  const names = productNames[category] || productNames.tops;
  
  return {
    id: `prod_${id}`,
    name: names[id % names.length],
    brand: brands[id % brands.length],
    price: basePrice,
    originalPrice: isSale ? Math.floor(basePrice * 1.3) : undefined,
    images: categoryImages,
    category,
    colors: colors.slice(0, 3 + (id % 3)),
    sizes: sizes.slice(0, 4 + (id % 2)),
    description: 'Crafted from premium materials with meticulous attention to detail. This piece embodies timeless elegance and contemporary design.',
    details: [
      '100% premium materials',
      'Sustainably sourced',
      'Made in Italy',
      'Dry clean recommended',
    ],
    isNew,
    isSale,
  };
};

const products: Product[] = [
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i, 'coats')),
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i + 4, 'dresses')),
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i + 8, 'tops')),
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i + 12, 'pants')),
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i + 16, 'accessories')),
  ...Array.from({ length: 4 }, (_, i) => generateProduct(i + 20, 'shoes')),
];

const categories: Category[] = [
  { id: 'cat_1', name: 'Coats & Jackets', slug: 'coats', image: PRODUCT_IMAGES.coats[0], productCount: 4 },
  { id: 'cat_2', name: 'Dresses', slug: 'dresses', image: PRODUCT_IMAGES.dresses[0], productCount: 4 },
  { id: 'cat_3', name: 'Tops', slug: 'tops', image: PRODUCT_IMAGES.tops[0], productCount: 4 },
  { id: 'cat_4', name: 'Pants', slug: 'pants', image: PRODUCT_IMAGES.pants[0], productCount: 4 },
  { id: 'cat_5', name: 'Accessories', slug: 'accessories', image: PRODUCT_IMAGES.accessories[0], productCount: 4 },
  { id: 'cat_6', name: 'Shoes', slug: 'shoes', image: PRODUCT_IMAGES.shoes[0], productCount: 4 },
];

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  }>): Promise<{ products: Product[]; total: number }> {
    await delay(300);
    
    let filtered = [...products];
    
    if (filters?.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    
    if (filters?.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters?.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters?.sizes?.length) {
      filtered = filtered.filter(p => p.sizes.some(s => filters.sizes!.includes(s)));
    }
    
    if (filters?.colors?.length) {
      filtered = filtered.filter(p => p.colors.some(c => filters.colors!.includes(c.name)));
    }
    
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
          break;
      }
    }
    
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const start = (page - 1) * limit;
    
    return {
      products: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay(200);
    return products.find(p => p.id === id) || null;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    await delay(200);
    return products.filter(p => p.isNew).slice(0, 4);
  },

  async getBestSellers(): Promise<Product[]> {
    await delay(200);
    return products.slice(0, 4);
  },

  async getCategories(): Promise<Category[]> {
    await delay(200);
    return categories;
  },

  async getRelatedProducts(productId: string): Promise<Product[]> {
    await delay(200);
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    return products.filter(p => p.category === product.category && p.id !== productId).slice(0, 4);
  },
};
