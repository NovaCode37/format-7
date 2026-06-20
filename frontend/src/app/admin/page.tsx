"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, type Order } from "@/lib/api";
import { Loader2, Search, RefreshCw } from "@/lib/icons";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminOffices from "@/components/admin/AdminOffices";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminPricing from "@/components/admin/AdminPricing";
import AdminSettings from "@/components/admin/AdminSettings";

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  paid: "Оплачен",
  processing: "В работе",
  ready: "Готов",
  completed: "Выдан",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-brand/10 text-brand",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  ready: "bg-blue-100 text-blue-700",
  completed: "bg-ink-100 text-ink-700",
  cancelled: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, string[]> = {
  new: ["paid", "processing", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "products" | "categories" | "offices" | "reviews" | "pricing" | "settings">("orders");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const downloadFile = async (id: number, name: string) => {
    if (!token) return;
    try {
      await api.downloadUpload(token, id, name);
    } catch (e: any) {
      toast.error(e.message || "Не удалось скачать файл");
    }
  };

  const parseOpts = (raw: string): Record<string, any> => {
    try {
      const o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch {
      return {};
    }
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        api.adminListOrders(token, { status: filter || undefined, q: search || undefined, limit: 200 }),
        api.adminStats(token),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.is_admin) {
        router.push("/");
        return;
      }
      load();
    }
  }, [authLoading, user, router, load]);

  const changeStatus = async (orderNumber: string, newStatus: string) => {
    if (!token) return;
    setSaving(orderNumber);
    try {
      await api.adminUpdateOrderStatus(token, orderNumber, newStatus);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Не удалось обновить статус");
    } finally {
      setSaving(null);
    }
  };

  const resetRevenue = async () => {
    if (!token) return;
    if (!confirm("Обнулить выручку? Текущие оплаченные заказы перестанут учитываться в выручке (сами заказы останутся). Новые оплаты будут считаться заново.")) return;
    try {
      const res = await api.adminResetRevenue(token);
      toast.success(`Выручка обнулена (исключено заказов: ${res.excluded})`);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Не удалось обнулить выручку");
    }
  };

  if (authLoading || !user?.is_admin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={28} />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <Reveal>
            <p className="eyebrow mb-3">Администрирование</p>
            <h1 className="h-display">Управление</h1>
          </Reveal>
          <div className="mt-6 flex gap-1">
            {([["orders", "Заказы"], ["products", "Товары"], ["categories", "Категории"], ["pricing", "Цены"], ["settings", "Контакты"], ["offices", "Офисы"], ["reviews", "Отзывы"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === key ? "border-ink-900 text-ink-900" : "border-transparent text-ink-400 hover:text-ink-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {tab === "products" && token && (
        <div className="container-page py-8"><AdminProducts token={token} /></div>
      )}
      {tab === "categories" && token && (
        <div className="container-page py-8"><AdminCategories token={token} /></div>
      )}
      {tab === "pricing" && token && (
        <div className="container-page py-8"><AdminPricing token={token} /></div>
      )}
      {tab === "settings" && token && (
        <div className="container-page py-8"><AdminSettings token={token} /></div>
      )}
      {tab === "offices" && token && (
        <div className="container-page py-8"><AdminOffices token={token} /></div>
      )}
      {tab === "reviews" && token && (
        <div className="container-page py-8"><AdminReviews token={token} /></div>
      )}

      {tab === "orders" && (
      <>
      {stats && (
        <section className="border-b border-ink-200 bg-ink-50/50">
          <div className="container-page py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBlock label="Всего заказов" value={stats.total_orders} />
            <StatBlock label="Оплачено" value={stats.paid_orders} />
            <div className="relative">
              <StatBlock
                label="Выручка"
                value={`${Math.round(stats.revenue).toLocaleString("ru-RU")} ₽`}
              />
              <button
                onClick={resetRevenue}
                className="absolute top-2 right-2 text-[11px] text-ink-400 hover:text-red-600 underline underline-offset-2 cursor-pointer"
                title="Исключить текущие оплаченные заказы из выручки"
              >
                Обнулить
              </button>
            </div>
            <StatBlock
              label="В работе"
              value={stats.by_status?.processing || 0}
            />
          </div>
        </section>
      )}

      <section className="border-b border-ink-200">
        <div className="container-page py-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-ink-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Поиск: номер, имя, email, телефон"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load()}
              className="flex-1 text-sm border-0 bg-transparent outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border border-ink-200 rounded-md px-3 py-1.5 bg-white cursor-pointer"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="btn btn-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={2} />
            Обновить
          </button>
        </div>
      </section>

      <div className="container-page py-8">
        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-ink-400" size={24} />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-ink-500 text-center py-20">Заказы не найдены</p>
        ) : (
          <div className="overflow-x-auto border border-ink-200 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                <tr>
                  <th className="px-4 py-3">Номер</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Оплата</th>
                  <th className="px-4 py-3">Создан</th>
                  <th className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map(o => (
                  <Fragment key={o.id}>
                  <tr className="hover:bg-ink-50/50 cursor-pointer" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    <td className="px-4 py-3 font-mono text-[12px]">
                      <span className="text-ink-400 mr-1">{expandedId === o.id ? "▾" : "▸"}</span>
                      {o.order_number}
                      {(o.files?.length || 0) > 0 && <span className="ml-1.5 text-brand" title="Есть вложения">📎{o.files.length}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink-900">{o.customer_name}</div>
                      <div className="text-[11px] text-ink-500">{o.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 tabular">{o.total.toLocaleString("ru-RU")} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[11px] rounded ${STATUS_COLORS[o.status] || "bg-ink-100 text-ink-700"}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-600">
                      {o.payment_status === "paid" ? "✓ Оплачен" : "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-500">
                      {new Date(o.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {(NEXT_STATUS[o.status] || []).length > 0 && (
                        <select
                          disabled={saving === o.order_number}
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) changeStatus(o.order_number, e.target.value);
                            e.target.value = "";
                          }}
                          className="text-[12px] border border-ink-200 rounded px-2 py-1 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Сменить…</option>
                          {NEXT_STATUS[o.status].map(s => (
                            <option key={s} value={s}>→ {STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr className="bg-ink-50/40">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-ink-400 mb-2">Состав заказа</p>
                            <ul className="space-y-2">
                              {(o.items || []).map((it) => {
                                const opts = parseOpts(it.options);
                                const specs = Object.entries(opts).filter(([k]) => !k.startsWith("_") && k !== "Товар").map(([k, v]) => `${k}: ${v}`).join(" · ");
                                return (
                                  <li key={it.id} className="text-[13px] text-ink-700">
                                    <span className="font-medium text-ink-900">{opts["Товар"] || it.service?.name || "Позиция"}</span>
                                    {" — "}{(it.price || 0).toLocaleString("ru-RU")} ₽
                                    {specs && <div className="text-[11px] text-ink-500">{specs}</div>}
                                  </li>
                                );
                              })}
                            </ul>
                            {o.comment && <p className="mt-3 text-[12px] text-ink-600"><span className="text-ink-400">Комментарий:</span> {o.comment}</p>}
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-ink-400 mb-2">Файлы клиента</p>
                            {(o.files?.length || 0) === 0 ? (
                              <p className="text-[12px] text-ink-400">Без вложений</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {o.files.map((f) => (
                                  <li key={f.id}>
                                    <button
                                      onClick={() => downloadFile(f.id, f.original_name)}
                                      className="inline-flex items-center gap-1.5 text-[13px] text-brand hover:underline cursor-pointer"
                                    >
                                      📎 {f.original_name}
                                      <span className="text-[11px] text-ink-400">({Math.max(1, Math.round((f.size || 0) / 1024))} КБ)</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-ink-200 rounded-md px-5 py-4">
      <p className="eyebrow text-[10px]">{label}</p>
      <p className="font-heading text-2xl font-semibold text-ink-900 tabular mt-1">{value}</p>
    </div>
  );
}
