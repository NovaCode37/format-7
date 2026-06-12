"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type User, type CartItem } from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  cartCount: number;
  loading: boolean;
  login: (email: string, password: string, turnstile?: string) => Promise<void>;
  register: (email: string, name: string, password: string, phone?: string, turnstile?: string) => Promise<void>;
  logout: () => void;
  refreshCart: () => Promise<void>;
  refresh: () => Promise<void>;
  addToCart: (serviceId: number, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  setToken: (t: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const saveToken = (t: string) => {
    localStorage.setItem("f7_token", t);
    setToken(t);
  };

  const refreshCart = useCallback(async () => {
    if (!token) { setCart([]); return; }
    try {
      const items = await api.getCart(token);
      setCart(items);
    } catch { setCart([]); }
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem("f7_token");
    if (stored) {
      setToken(stored);
      api.getMe(stored)
        .then(u => { setUser(u); })
        .catch(() => { localStorage.removeItem("f7_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const loginFn = async (email: string, password: string, turnstile = "") => {
    const res = await api.login(email, password, turnstile);
    saveToken(res.access_token);
    const u = await api.getMe(res.access_token);
    setUser(u);
  };

  const registerFn = async (email: string, name: string, password: string, phone = "", turnstile = "") => {
    const res = await api.register(email, name, password, phone, turnstile);
    saveToken(res.access_token);
    const u = await api.getMe(res.access_token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("f7_token");
    setToken(null);
    setUser(null);
    setCart([]);
  };

  const addToCartFn = async (serviceId: number, quantity = 1) => {
    if (!token) throw new Error("Необходима авторизация");
    await api.addToCart(serviceId, quantity, undefined, token);
    await refreshCart();
  };

  const removeFromCartFn = async (itemId: number) => {
    if (!token) return;
    await api.removeFromCart(token, itemId);
    await refreshCart();
  };

  const refresh = async () => {
    if (!token) return;
    try { setUser(await api.getMe(token)); } catch {}
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <AuthContext.Provider
      value={{ user, token, cart, cartCount, loading, login: loginFn, register: registerFn, logout, refreshCart, refresh, addToCart: addToCartFn, removeFromCart: removeFromCartFn, setToken: saveToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
