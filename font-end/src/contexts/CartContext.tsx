import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
  itemId: string;
  productId: string;
  name: string;
  image?: string;
  size: string;
  quantity: number;
  price: number;
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (item: { productId: string; size: string; quantity: number; price: number; name: string; image?: string }) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  cartCount: 0,
  loading: false,
  fetchCart: async () => {},
  addToCart: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

/* eslint-disable @typescript-eslint/no-explicit-any */

const IMAGE_CACHE_KEY = "coffea_product_image_cache";

function getImageCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || "{}"); } catch { return {}; }
}

function saveImageCache(cache: Record<string, string>) {
  try { localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function mapCartItemWithCache(raw: any, cache: Record<string, string>): CartItem {
  const productId = raw.product_id ?? raw.productId ?? "";
  return {
    itemId: raw.cart_item_id ?? raw.itemId ?? "",
    productId,
    name: raw.product_name ?? raw.productName ?? raw.name ?? "",
    image: raw.image ?? cache[productId],
    size: raw.size ?? "",
    quantity: raw.quantity ?? 1,
    price: Number(raw.unit_price ?? raw.price ?? 0),
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); return; }
    try {
      setLoading(true);
      const data = await api.get<any>("/api/orders/cart");
      const rawItems: any[] = data?.items ?? data?.cartItems ?? [];
      const cache = getImageCache();
      setItems(rawItems.map(r => mapCartItemWithCache(r, cache)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (item: {
    productId: string;
    size: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
  }) => {
    // Cache image by productId so it survives re-fetch (backend CartItem has no image column)
    if (item.image && item.productId) {
      const cache = getImageCache();
      cache[item.productId] = item.image;
      saveImageCache(cache);
    }
    await api.post("/api/orders/cart/items", {
      productId: item.productId,
      size: item.size || null,
      quantity: item.quantity,
    });
    await fetchCart();
  }, [fetchCart]);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    await api.put(`/api/orders/cart/items/${itemId}`, { quantity });
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    await api.delete(`/api/orders/cart/items/${itemId}`);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await api.delete("/api/orders/cart");
    setItems([]);
  }, []);

  const cartCount = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  return (
    <CartContext.Provider value={{ items, cartCount, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
