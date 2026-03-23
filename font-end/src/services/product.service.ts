import { api } from "../lib/api";

export interface ProductSize {
  label: string;
  additionalPrice?: number;
}

export interface Category {
  _id: string;
  categoryId: string;
  name: string;
  slug?: string;
}

export interface Topping {
  _id: string;
  name: string;
  price: number;
}

export interface Review {
  reviewId: string;
  customerName: string;
  avatar: string;
  rating: number;
  comment: string;
  productId: string | null;
  createdAt: string;
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
  productCategoryId?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map backend product fields to frontend Product shape */
function mapProduct(raw: any): Product {
  return {
    _id: raw._id ?? raw.productId,
    name: raw.productName ?? raw.name ?? "",
    description: raw.description ?? "",
    price: raw.price ?? 0,
    category: raw.category ?? raw.productCategoryId ?? "",
    images: raw.images,
    image: raw.image,
    isAvailable: raw.isAvailable ?? raw.status === "ACTIVE",
    sizes: raw.sizes,
    tags: raw.tags,
    slug: raw.slug,
    productCategoryId: raw.productCategoryId,
  };
}

/** Map backend category fields to frontend Category shape */
function mapCategory(raw: any): Category {
  return {
    _id: raw._id ?? raw.categoryId,
    categoryId: raw.categoryId ?? raw._id,
    name: raw.categoryName ?? raw.name ?? "",
    slug: raw.slug,
  };
}

export const productService = {
  getProducts: async (params?: { category?: string; search?: string }): Promise<Product[]> => {
    const qs = new URLSearchParams();
    qs.set("limit", "100");
    if (params?.category) qs.set("categoryId", params.category);
    if (params?.search) qs.set("search", params.search);
    const path = `/api/products?${qs}`;
    const res = await api.get<any>(path);
    const list: any[] = Array.isArray(res) ? res : (res?.products ?? res?.data ?? []);
    return list.map(mapProduct);
  },

  getProduct: async (id: string): Promise<Product | null> => {
    try {
      const res = await api.get<any>(`/api/products/${id}`);
      const raw = res?._id ? res : (res?.product ?? res?.data ?? null);
      return raw ? mapProduct(raw) : null;
    } catch {
      return null;
    }
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<any>("/api/products/categories");
    const list: any[] = Array.isArray(res) ? res : (res?.categories ?? res?.data ?? []);
    return list.map(mapCategory);
  },

  getToppings: async (): Promise<Topping[]> => {
    const res = await api.get<Topping[] | any>("/api/products/toppings");
    if (Array.isArray(res)) return res;
    return res?.toppings ?? res?.data ?? [];
  },

  getStoreReviews: async (): Promise<Review[]> => {
    const res = await api.get<any>("/api/products/reviews");
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  getProductReviews: async (productId: string): Promise<Review[]> => {
    const res = await api.get<any>(`/api/products/reviews/product/${productId}`);
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  createReview: async (data: {
    customerName: string;
    avatar?: string;
    rating: number;
    comment: string;
    productId?: string;
  }): Promise<Review> => {
    return await api.post<Review>("/api/products/reviews", data);
  },
};

/** Get first available image URL from a product */
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) return product.images[0];
  if (product.image) return product.image;
  return "https://images.unsplash.com/photo-1649612427727-31f1e184e9e8?w=400";
}

/** Get the category name string from a product */
export function getCategoryName(product: Product, categories?: Category[]): string {
  if (typeof product.category === "object" && product.category?.name) {
    return product.category.name;
  }
  // If category is a categoryId string, look it up in the categories list
  if (categories && typeof product.category === "string" && product.category) {
    const found = categories.find(
      (c) => c.categoryId === product.category || c._id === product.category
    );
    if (found) return found.name;
  }
  if (typeof product.category === "string") return product.category;
  return "";
}
