import { api } from "../lib/api";

export interface ProductSize {
  label: string;
  additionalPrice?: number;
}

export interface Category {
  _id: string;
  categoryId: string;
  name: string;
  description?: string;
  status?: string;
  slug?: string;
}

export const TOPPING_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Nghỉ bán",
  OUT_OF_SEASON: "Hết mùa",
};

export interface Topping {
  _id: string;
  toppingId?: string;
  name: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
  status?: string;
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
  status?: string;
  sizes?: ProductSize[];
  tags?: string[];
  slug?: string;
  productCategoryId?: string;
}

export const DEFAULT_PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23cccccc' width='400' height='400'/%3E%3Cg transform='translate(200,200)'%3E%3Crect x='-50' y='-40' width='80' height='65' rx='6' fill='none' stroke='%23fff' stroke-width='4' transform='rotate(-10)'/%3E%3Crect x='-30' y='-25' width='80' height='65' rx='6' fill='%23b0b0b0' stroke='%23fff' stroke-width='4'/%3E%3Cpath d='M-20 25 L0 5 L15 18 L30 0 L50 25Z' fill='%23888'/%3E%3Ccircle cx='-5' cy='-5' r='8' fill='%23ccc'/%3E%3C/g%3E%3C/svg%3E";

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  OUT_OF_SEASON: "OUT_OF_SEASON",
} as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Nghỉ bán",
  OUT_OF_SEASON: "Hết mùa",
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map backend product fields to frontend Product shape */
function mapProduct(raw: any): Product {
  const status = raw.status ?? (raw.isAvailable === false ? "INACTIVE" : "ACTIVE");
  return {
    _id: raw._id ?? raw.productId,
    name: raw.productName ?? raw.name ?? "",
    description: raw.description ?? "",
    price: raw.price ?? 0,
    category: raw.category ?? raw.productCategoryId ?? "",
    images: raw.images,
    image: raw.image,
    isAvailable: raw.isAvailable ?? status === "ACTIVE",
    status,
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
    description: raw.description,
    status: raw.status ?? "ACTIVE",
    slug: raw.slug,
  };
}

export interface Ingredient {
  _id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  currentQuantity: number;
  image?: string;
  status: string;
  updatedAt: string;
}

export interface ImportLog {
  _id: string;
  ingredientId: string;
  quantityImported: number;
  unitPrice?: number;
  supplier?: string;
  note?: string;
  importedAt: string;
}

function mapTopping(raw: any): Topping {
  return {
    _id: raw._id ?? raw.toppingId,
    toppingId: raw.toppingId ?? raw._id,
    name: raw.toppingName ?? raw.name ?? "",
    price: raw.price ?? 0,
    image: raw.image,
    isAvailable: raw.isAvailable ?? raw.status === "ACTIVE",
    status: raw.status ?? "ACTIVE",
  };
}

function mapIngredient(raw: any): Ingredient {
  return {
    _id: raw._id ?? raw.ingredientId,
    ingredientId: raw.ingredientId ?? raw._id,
    ingredientName: raw.ingredientName ?? "",
    unit: raw.unit ?? "",
    currentQuantity: raw.currentQuantity ?? 0,
    image: raw.image,
    status: raw.status ?? "ACTIVE",
    updatedAt: raw.updatedAt ?? "",
  };
}

export const productService = {
  // ── Upload ──
  uploadProductImage: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.upload<{ url: string }>("/api/products/upload/product", fd);
    return res.url;
  },

  uploadToppingImage: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.upload<{ url: string }>("/api/products/upload/topping", fd);
    return res.url;
  },

  uploadIngredientImage: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.upload<{ url: string }>("/api/products/upload/ingredient", fd);
    return res.url;
  },

  // ── Products ──
  getProducts: async (params?: { category?: string; search?: string; all?: boolean }): Promise<Product[]> => {
    const qs = new URLSearchParams();
    qs.set("limit", "100");
    if (params?.category) qs.set("categoryId", params.category);
    if (params?.search) qs.set("search", params.search);
    if (params?.all) qs.set("all", "true");
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

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const status = data.status ?? (data.isAvailable === false ? "INACTIVE" : "ACTIVE");
    const payload: any = {
      productName: data.name,
      price: data.price,
      description: data.description,
      productCategoryId: data.productCategoryId ?? (typeof data.category === "string" ? data.category : ""),
      image: data.image || DEFAULT_PRODUCT_IMAGE,
      status,
      isAvailable: status === "ACTIVE",
    };
    const res = await api.post<any>("/api/products", payload);
    return mapProduct(res);
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const payload: any = {};
    if (data.name !== undefined) payload.productName = data.name;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) payload.description = data.description;
    if (data.productCategoryId !== undefined) payload.productCategoryId = data.productCategoryId;
    if (data.image !== undefined) payload.image = data.image || DEFAULT_PRODUCT_IMAGE;
    if (data.status !== undefined) {
      payload.status = data.status;
      payload.isAvailable = data.status === "ACTIVE";
    } else if (data.isAvailable !== undefined) {
      payload.isAvailable = data.isAvailable;
      payload.status = data.isAvailable ? "ACTIVE" : "INACTIVE";
    }
    const res = await api.put<any>(`/api/products/${id}`, payload);
    return mapProduct(res);
  },

  deactivateProduct: async (id: string): Promise<void> => {
    await api.put(`/api/products/${id}`, { status: "INACTIVE", isAvailable: false });
  },

  reactivateProduct: async (id: string): Promise<void> => {
    await api.put(`/api/products/${id}`, { status: "ACTIVE", isAvailable: true });
  },

  // ── Categories ──
  getCategories: async (all?: boolean): Promise<Category[]> => {
    const url = all ? "/api/products/categories?all=true" : "/api/products/categories";
    const res = await api.get<any>(url);
    const list: any[] = Array.isArray(res) ? res : (res?.categories ?? res?.data ?? []);
    return list.map(mapCategory);
  },

  createCategory: async (data: { name: string; description?: string }): Promise<Category> => {
    const res = await api.post<any>("/api/products/categories", {
      categoryName: data.name,
      description: data.description ?? "",
    });
    return mapCategory(res);
  },

  updateCategory: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<Category> => {
    const payload: any = {};
    if (data.name !== undefined) payload.categoryName = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.status !== undefined) payload.status = data.status;
    const res = await api.put<any>(`/api/products/categories/${id}`, payload);
    return mapCategory(res);
  },

  // Soft-delete: sets status INACTIVE
  deleteCategory: async (id: string): Promise<void> => {
    await api.put(`/api/products/categories/${id}`, { status: "INACTIVE" });
  },

  reactivateCategory: async (id: string): Promise<void> => {
    await api.put(`/api/products/categories/${id}`, { status: "ACTIVE" });
  },

  // ── Toppings ──
  getToppings: async (all?: boolean): Promise<Topping[]> => {
    const url = all ? "/api/products/toppings?all=true" : "/api/products/toppings";
    const res = await api.get<any>(url);
    const list: any[] = Array.isArray(res) ? res : (res?.toppings ?? res?.data ?? []);
    return list.map(mapTopping);
  },

  createTopping: async (data: { name: string; price: number; image?: string }): Promise<Topping> => {
    const res = await api.post<any>("/api/products/toppings", {
      toppingName: data.name,
      price: data.price,
      image: data.image ?? "",
    });
    return mapTopping(res);
  },

  updateTopping: async (id: string, data: { name?: string; price?: number; image?: string; isAvailable?: boolean; status?: string }): Promise<Topping> => {
    const payload: any = {};
    if (data.name !== undefined) payload.toppingName = data.name;
    if (data.price !== undefined) payload.price = data.price;
    if (data.image !== undefined) payload.image = data.image;
    if (data.status !== undefined) {
      payload.status = data.status;
      payload.isAvailable = data.status === "ACTIVE";
    } else if (data.isAvailable !== undefined) {
      payload.isAvailable = data.isAvailable;
      payload.status = data.isAvailable ? "ACTIVE" : "INACTIVE";
    }
    const res = await api.put<any>(`/api/products/toppings/${id}`, payload);
    return mapTopping(res);
  },

  deactivateTopping: async (id: string, status: string): Promise<void> => {
    await api.put(`/api/products/toppings/${id}`, { status, isAvailable: status === "ACTIVE" });
  },

  // ── Ingredients ──
  getIngredients: async (): Promise<Ingredient[]> => {
    const res = await api.get<any>("/api/products/ingredients");
    const list: any[] = Array.isArray(res) ? res : (res?.ingredients ?? res?.data ?? []);
    return list.map(mapIngredient);
  },

  createIngredient: async (data: { ingredientName: string; unit: string; currentQuantity?: number; image?: string }): Promise<Ingredient> => {
    const res = await api.post<any>("/api/products/ingredients", data);
    return mapIngredient(res);
  },

  updateIngredient: async (id: string, data: Partial<Ingredient>): Promise<Ingredient> => {
    const res = await api.put<any>(`/api/products/ingredients/${id}`, data);
    return mapIngredient(res);
  },

  importIngredient: async (id: string, quantity: number, note?: string): Promise<void> => {
    await api.post(`/api/products/ingredients/${id}/import`, { quantity, note });
  },

  getImportLogs: async (id: string): Promise<ImportLog[]> => {
    const res = await api.get<any>(`/api/products/ingredients/${id}/import-logs`);
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  // ── Reviews ──
  getAllReviews: async (): Promise<Review[]> => {
    const res = await api.get<any>("/api/products/reviews/all");
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/api/products/reviews/${reviewId}`);
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
    orderId?: string;
  }): Promise<Review> => {
    return await api.post<Review>("/api/products/reviews", data);
  },

  getOrderReviews: async (orderId: string): Promise<Review[]> => {
    const res = await api.get<any>(`/api/products/reviews/order/${orderId}`);
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  checkOrderReviewed: async (orderId: string): Promise<boolean> => {
    try {
      const res = await api.get<any>(`/api/products/reviews/order/${orderId}/checked`);
      return res?.reviewed ?? false;
    } catch {
      return false;
    }
  },
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/** Resolve image path — if relative (/uploads/...), prepend API base URL */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return DEFAULT_PRODUCT_IMAGE;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

/** Get first available image URL from a product */
export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) return resolveImageUrl(product.images[0]);
  if (product.image) return resolveImageUrl(product.image);
  return DEFAULT_PRODUCT_IMAGE;
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
