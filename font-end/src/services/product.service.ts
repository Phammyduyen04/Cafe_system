import { api } from "../lib/api";

export interface ProductSize {
  label: string;
  additionalPrice?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
}

export interface Topping {
  _id: string;
  name: string;
  price: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: Category | string;
  images?: string[];
  image?: string;
  isAvailable: boolean;
  sizes?: ProductSize[];
  tags?: string[];
  slug?: string;
}

interface ProductListResponse {
  products?: Product[];
  data?: Product[];
}

interface ProductDetailResponse {
  product?: Product;
  data?: Product;
}

interface CategoryListResponse {
  categories?: Category[];
  data?: Category[];
}

interface ToppingListResponse {
  toppings?: Topping[];
  data?: Topping[];
}

export const productService = {
  getProducts: async (params?: { category?: string; search?: string }): Promise<Product[]> => {
    let path = "/api/products";
    if (params) {
      const qs = new URLSearchParams();
      if (params.category) qs.set("category", params.category);
      if (params.search) qs.set("search", params.search);
      if ([...qs].length) path += `?${qs}`;
    }
    const res = await api.get<Product[] | ProductListResponse>(path);
    if (Array.isArray(res)) return res;
    return (res as ProductListResponse).products ?? (res as ProductListResponse).data ?? [];
  },

  getProduct: async (id: string): Promise<Product | null> => {
    try {
      const res = await api.get<Product | ProductDetailResponse>(`/api/products/${id}`);
      if ((res as Product)._id) return res as Product;
      return (res as ProductDetailResponse).product ?? (res as ProductDetailResponse).data ?? null;
    } catch {
      return null;
    }
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<Category[] | CategoryListResponse>("/api/products/categories");
    if (Array.isArray(res)) return res;
    return (res as CategoryListResponse).categories ?? (res as CategoryListResponse).data ?? [];
  },

  getToppings: async (): Promise<Topping[]> => {
    const res = await api.get<Topping[] | ToppingListResponse>("/api/products/toppings");
    if (Array.isArray(res)) return res;
    return (res as ToppingListResponse).toppings ?? (res as ToppingListResponse).data ?? [];
  },
};

/** Get first available image URL from a product */
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) return product.images[0];
  if (product.image) return product.image;
  return "https://images.unsplash.com/photo-1649612427727-31f1e184e9e8?w=400";
}

/** Get the category name string from a product */
export function getCategoryName(product: Product): string {
  if (typeof product.category === "string") return product.category;
  return product.category?.name ?? "";
}
