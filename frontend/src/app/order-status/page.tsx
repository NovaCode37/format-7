"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<{ order_number: string; status: string; created_at: string; total: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabels: Record<string, string> = {
    new: "Новый",
    processing: "В обработке",
    ready: "Готов",
    completed: "Выполнен",
    cancelled: "Отменён",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!orderNumber.trim()) return;
    setLoading(true);
    try {
      const data = await api.checkOrderStatus(orderNumber.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Заказ не найден");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ink-50 border-t border-ink-200 min-h-[70vh] py-16 sm:py-24">
      <div className="container-page">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-start">

          <div className="col-span-12 lg:col-span-6">
            <p className="eyebrow mb-4">Проверка</p>
            <h1 className="h-display">
              Статус
              <br />
              <span className="text-ink-400">вашего заказа.</span>
            </h1>
            <p className="lead mt-6 text-ink-600">
              Введите номер, указанный в&nbsp;письме&nbsp;— например,
              <span className="tabular">&nbsp;F7-XXXXXXXX</span>. Без&nbsp;авторизации.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="card p-6 sm:p-8 max-w-[520px] lg:ml-auto">
              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="order-num"
                  className="block text-[12px] font-medium text-ink-700 mb-1.5"
                >
                  Номер заказа
                </label>
                <div className="flex gap-2">
                  <input
                    id="order-num"
                    type="text"
                    placeholder="F7-XXXXXXXX"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="input tabular"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Search size={15} strokeWidth={1.75} />
                    Найти
                  </button>
                </div>
              </form>

              {error && (
                <div
                  role="alert"
                  className="mt-5 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md px-4 py-2.5"
                >
                  {error}
                </div>
              )}

              {result && (
                <dl className="mt-6 pt-6 border-t border-ink-200 space-y-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="eyebrow">Заказ</dt>
                    <dd className="font-heading text-xl font-semibold text-ink-900 tabular">
                      {result.order_number}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="eyebrow">Статус</dt>
                    <dd>
                      <span className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-ink-100 border border-ink-200 text-[12px] font-medium text-ink-900">
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-brand" />
                        {statusLabels[result.status] || result.status}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="eyebrow">Создан</dt>
                    <dd className="text-sm text-ink-700 tabular">
                      {new Date(result.created_at).toLocaleString("ru-RU")}
                    </dd>
                  </div>
                  {result.total > 0 && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="eyebrow">Сумма</dt>
                      <dd className="font-heading text-lg font-semibold text-ink-900 tabular">
                        {result.total.toLocaleString("ru-RU")}&nbsp;₽
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
