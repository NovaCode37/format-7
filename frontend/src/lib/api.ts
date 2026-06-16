const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface NavItem {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface TabProduct {
  id: number;
  name: string;
  icon: string;
  slug: string;
  order: number;
}

export interface TabGroup {
  id: number;
  name: string;
  order: number;
  products: TabProduct[];
}

export interface SectionCard {
  id: number;
  name: string;
  icon: string;
  slug: string;
  button_text: string;
  order: number;
}

export interface SectionBlock {
  id: number;
  title: string;
  slug: string;
  order: number;
  cards: SectionCard[];
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  category_id: number | null;
  order: number;
  image: string;
  price_from: number;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  order: number;
  services: Service[];
}

export interface ServiceInput {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  category_id?: number | null;
  order?: number;
  image?: string;
  price_from?: number;
  is_active?: boolean;
}

export interface CategoryInput {
  name: string;
  slug: string;
  icon?: string;
  order?: number;
}

export interface OfficeInput {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  is_open?: boolean;
  lat?: string;
  lng?: string;
}

export function resolveImageUrl(src?: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/api/")) return `${API_BASE}${src}`;
  return src;
}

export interface Office {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  is_open: boolean;
  lat: string;
  lng: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  is_admin?: boolean;
  email_verified?: boolean;
}

export interface CartItem {
  id: number;
  service_id: number;
  quantity: number;
  note: string;
  price: number;
  options: string;
  service: Service;
}

export interface OrderItem {
  id: number;
  service_id: number;
  quantity: number;
  price: number;
  options: string;
  service: Service;
}

export interface UploadedFile {
  id: number;
  original_name: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  comment: string;
  delivery_type: string;
  delivery_address: string;
  office_id: number | null;
  payment_status?: string;
  payment_method?: string;
  payment_token?: string;
  paid_at?: string | null;
  created_at: string;
  items: OrderItem[];
  files: UploadedFile[];
}

export interface PaymentInfo {
  order_number: string;
  total: number;
  payment_status: "pending" | "paid" | "failed";
  payment_method: string;
  paid_at: string | null;
  sbp_payload: string;
  merchant_name: string;
}

export interface PaymentInit {
  order_number: string;
  provider: "yookassa" | "tbank" | "none" | string;
  confirmation_url?: string | null;
  provider_payment_id?: string | null;
  qr_payload?: string | null;
  payment_url?: string | null;
}

export interface Quote {
  unit_price: number;
  total_price: number;
  quantity: number;
  breakdown: { label: string; value: string; multiplier: number; running: number }[];
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const d = (body as any)?.detail;
      let msg: string;
      if (typeof d === "string") msg = d;
      else if (Array.isArray(d)) msg = d.map((e: any) => e?.msg || (typeof e === "string" ? e : JSON.stringify(e))).join("; ");
      else if (d && typeof d === "object") msg = d.msg || JSON.stringify(d);
      else msg = `Ошибка ${res.status}`;
      throw new ApiError(msg, res.status);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export const api = {

  getNav: () => fetchApi<NavItem[]>("/api/nav", { cache: "no-store" }),
  getTabs: () => fetchApi<TabGroup[]>("/api/tabs", { cache: "no-store" }),
  getSections: () => fetchApi<SectionBlock[]>("/api/sections", { cache: "no-store" }),
  getServices: () => fetchApi<Service[]>("/api/services", { cache: "no-store" }),
  getCategories: () => fetchApi<Category[]>("/api/categories", { cache: "no-store" }),
  getOffices: () => fetchApi<Office[]>("/api/offices", { cache: "no-store" }),

  search: (q: string) => fetchApi<Service[]>(`/api/search?q=${encodeURIComponent(q)}`),

  register: (email: string, name: string, password: string, phone = "", turnstile = "") =>
    fetchApi<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, phone, turnstile_token: turnstile, website: "" }),
    }),
  login: (email: string, password: string, turnstile = "") =>
    fetchApi<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, turnstile_token: turnstile }),
    }),
  exchangeOAuthCode: (code: string) =>
    fetchApi<{ access_token: string }>("/api/auth/oauth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),
  getMe: (token: string) =>
    fetchApi<User>("/api/auth/me", { headers: authHeaders(token) }),
  forgotPassword: (email: string, turnstile = "") =>
    fetchApi<{ ok: boolean; message: string }>("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstile_token: turnstile }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    fetchApi<{ access_token: string }>("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
  verifyEmail: (token: string) =>
    fetchApi<{ ok: boolean }>("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  resendVerification: (token: string) =>
    fetchApi<{ ok: boolean }>("/api/auth/resend-verification", {
      method: "POST",
      headers: authHeaders(token),
    }),

  getCart: (token: string) =>
    fetchApi<CartItem[]>("/api/cart", { headers: authHeaders(token) }),
  addToCart: (service_id: number, quantity = 1, data?: { options?: Record<string, any>; fileIds?: number[]; note?: string; price?: number }, token?: string) =>
    fetchApi<CartItem>("/api/cart", {
      method: "POST",
      headers: token ? authHeaders(token) : { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id, quantity, note: data?.note || "", options: data?.options, price: data?.price || 0 }),
    }),
  removeFromCart: (token: string, itemId: number) =>
    fetchApi<{ ok: boolean }>(`/api/cart/${itemId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  clearCart: (token: string) =>
    fetchApi<{ ok: boolean }>("/api/cart", {
      method: "DELETE",
      headers: authHeaders(token),
    }),

  createOrder: (data: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    comment?: string;
    items: { service_id: number; quantity: number; price: number; options?: Record<string, any> }[];
    delivery_type?: "pickup" | "delivery";
    delivery_address?: string;
    office_id?: number | null;
    file_ids?: number[];
  }, token?: string) => {

    const idempKey = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return fetchApi<Order>("/api/orders", {
      method: "POST",
      headers: {
        ...(token ? authHeaders(token) : { "Content-Type": "application/json" }),
        "Idempotency-Key": idempKey,
      },
      body: JSON.stringify(data),
    });
  },
  getMyOrders: (token: string) =>
    fetchApi<Order[]>("/api/orders", { headers: authHeaders(token) }),
  getOrderDetails: (token: string, orderNumber: string) =>
    fetchApi<Order>(`/api/orders/${encodeURIComponent(orderNumber)}`, { headers: authHeaders(token) }),
  cancelOrder: (token: string, orderNumber: string) =>
    fetchApi<Order>(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  repeatOrder: (token: string, orderNumber: string) =>
    fetchApi<{ ok: boolean; added: number }>(
      `/api/orders/${encodeURIComponent(orderNumber)}/repeat`,
      { method: "POST", headers: authHeaders(token) }
    ),
  checkOrderStatus: (orderNumber: string) =>
    fetchApi<{ order_number: string; status: string; created_at: string; total: number }>(
      `/api/orders/status/${encodeURIComponent(orderNumber)}`
    ),

  getPaymentInfo: (orderNumber: string) =>
    fetchApi<PaymentInfo>(`/api/orders/${encodeURIComponent(orderNumber)}/payment`),
  markOrderPaid: (orderNumber: string, paymentToken: string) =>
    fetchApi<PaymentInfo>(`/api/orders/${encodeURIComponent(orderNumber)}/mark-paid`, {
      method: "POST",
      headers: { "X-Payment-Token": paymentToken },
    }),
  initPayment: (orderNumber: string, paymentToken: string) =>
    fetchApi<PaymentInit>(`/api/orders/${encodeURIComponent(orderNumber)}/pay/init`, {
      method: "POST",
      headers: { "X-Payment-Token": paymentToken },
    }),

  adminListOrders: (token: string, params?: { status?: string; q?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.q) qs.set("q", params.q);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return fetchApi<Order[]>(`/api/admin/orders${q ? `?${q}` : ""}`, {
      headers: authHeaders(token),
    });
  },
  adminUpdateOrderStatus: (token: string, orderNumber: string, status: string) =>
    fetchApi<Order>(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),
  adminRefund: (token: string, orderNumber: string, amount: number, reason: string = "") =>
    fetchApi<{ id: number; amount: number; status: string; created_at: string }>(
      `/api/admin/orders/${encodeURIComponent(orderNumber)}/refund`,
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ amount, reason }),
      }
    ),
  adminAuditLog: (token: string, limit = 100) =>
    fetchApi<Array<{
      id: number; admin_email: string; action: string; target: string;
      diff: string; ip: string; created_at: string;
    }>>(`/api/admin/audit?limit=${limit}`, { headers: authHeaders(token) }),
  adminStats: (token: string) =>
    fetchApi<{
      total_orders: number;
      paid_orders: number;
      revenue: number;
      by_status: Record<string, number>;
    }>("/api/admin/stats", { headers: authHeaders(token) }),

  adminListServices: (token: string) =>
    fetchApi<Service[]>("/api/admin/services", { headers: authHeaders(token) }),
  adminCreateService: (token: string, data: ServiceInput) =>
    fetchApi<Service>("/api/admin/services", {
      method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminUpdateService: (token: string, id: number, data: ServiceInput) =>
    fetchApi<Service>(`/api/admin/services/${id}`, {
      method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminDeleteService: (token: string, id: number) =>
    fetchApi<{ ok: boolean; soft: boolean }>(`/api/admin/services/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    }),

  adminListCategories: (token: string) =>
    fetchApi<Category[]>("/api/admin/categories", { headers: authHeaders(token) }),
  adminCreateCategory: (token: string, data: CategoryInput) =>
    fetchApi<Category>("/api/admin/categories", {
      method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminUpdateCategory: (token: string, id: number, data: CategoryInput) =>
    fetchApi<Category>(`/api/admin/categories/${id}`, {
      method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminDeleteCategory: (token: string, id: number) =>
    fetchApi<{ ok: boolean }>(`/api/admin/categories/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    }),

  adminUploadImage: async (token: string, file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new ApiError((b as any)?.detail || `Ошибка ${res.status}`, res.status);
    }
    return res.json();
  },

  adminListOffices: (token: string) =>
    fetchApi<Office[]>("/api/admin/offices", { headers: authHeaders(token) }),
  adminCreateOffice: (token: string, data: OfficeInput) =>
    fetchApi<Office>("/api/admin/offices", {
      method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminUpdateOffice: (token: string, id: number, data: OfficeInput) =>
    fetchApi<Office>(`/api/admin/offices/${id}`, {
      method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
    }),
  adminDeleteOffice: (token: string, id: number) =>
    fetchApi<{ ok: boolean }>(`/api/admin/offices/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    }),

  adminListReviews: (token: string) =>
    fetchApi<Review[]>("/api/admin/reviews", { headers: authHeaders(token) }),
  adminDeleteReview: (token: string, id: number) =>
    fetchApi<{ ok: boolean }>(`/api/admin/reviews/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    }),

  wishlistList: (token: string) =>
    fetchApi<Array<{ id: number; service_id: number; service: Service; created_at: string }>>(
      "/api/wishlist", { headers: authHeaders(token) }
    ),
  wishlistAdd: (token: string, serviceId: number) =>
    fetchApi<{ id: number }>("/api/wishlist", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ service_id: serviceId }),
    }),
  wishlistRemove: (token: string, itemId: number) =>
    fetchApi<{ ok: boolean }>(`/api/wishlist/${itemId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),

  addressesList: (token: string) =>
    fetchApi<Array<{ id: number; label: string; address: string; is_default: boolean; created_at: string }>>(
      "/api/addresses", { headers: authHeaders(token) }
    ),
  addressesAdd: (token: string, data: { label?: string; address: string; is_default?: boolean }) =>
    fetchApi<{ id: number }>("/api/addresses", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  addressesRemove: (token: string, id: number) =>
    fetchApi<{ ok: boolean }>(`/api/addresses/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    }),
  addressesSetDefault: (token: string, id: number) =>
    fetchApi<{ id: number }>(`/api/addresses/${id}/default`, {
      method: "POST", headers: authHeaders(token),
    }),

  pushVapidKey: () => fetchApi<{ key: string }>("/api/push/vapid-public"),
  pushSubscribe: (sub: { endpoint: string; p256dh: string; auth: string; user_agent?: string }, token?: string) =>
    fetchApi<{ ok: boolean; id: number }>("/api/push/subscribe", {
      method: "POST",
      headers: token
        ? authHeaders(token)
        : { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sub, user_agent: sub.user_agent || "" }),
    }),
  pushUnsubscribe: (endpoint: string, token?: string) =>
    fetchApi<{ ok: boolean }>("/api/push/unsubscribe", {
      method: "POST",
      headers: token
        ? authHeaders(token)
        : { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }),

  updateProfile: (token: string, data: { name?: string; phone?: string }) =>
    fetchApi<User>("/api/auth/me", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  changePassword: (token: string, current_password: string, new_password: string) =>
    fetchApi<{ ok: boolean; access_token?: string }>("/api/auth/change-password", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ current_password, new_password }),
    }),

  uploadFile: async (file: File, token?: string): Promise<UploadedFile> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Ошибка загрузки: ${res.status}`);
    }
    return res.json();
  },
  getFileUrl: (id: number) => `${API_BASE}/api/uploads/${id}`,
  deleteFile: (token: string, id: number) =>
    fetchApi<{ ok: boolean }>(`/api/uploads/${id}`, { method: "DELETE", headers: authHeaders(token) }),

  calculateQuote: (data: {
    service_id: number;
    base_price: number;
    quantity: number;
    options: { label: string; value: string; multiplier: number }[];
  }) =>
    fetchApi<Quote>("/api/calculator/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  subscribe: (email: string) =>
    fetchApi<{ id: number; email: string }>("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),

  getReviews: () => fetchApi<Review[]>("/api/reviews"),
  createReview: (data: { author_name: string; rating: number; text: string }, token?: string) =>
    fetchApi<Review>("/api/reviews", {
      method: "POST",
      headers: token ? authHeaders(token) : { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
