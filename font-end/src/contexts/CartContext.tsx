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

interface CartResponse {
  items?: CartItem[];
  cartItems?: CartItem[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); return; }
    try {
      setLoading(true);
      const data = await api.get<CartResponse>("/api/orders/cart");
      setItems(data?.items ?? data?.cartItems ?? []);
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
    await api.post("/api/orders/cart/items", item);
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
