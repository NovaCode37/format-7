"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function CartPage() {
  const { user, token, cart, cartCount, removeFromCart, refreshCart } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{ number: string; paymentToken: string } | null>(null);

  const emptyShell = (heading: string, sub: string, cta: React.ReactNode) => (
    <div className="bg-ink-50 border-t border-ink-200 min-h-[60vh] py-16 sm:py-24">
      <div className="container-page max-w-xl mx-auto text-center">
        <ShoppingBag size={36} strokeWidth={1.5} className="mx-auto mb-6 text-ink-300" />
        <h1 className="h-section mb-3">{heading}</h1>
        <p className="text-ink-500 mb-8">{sub}</p>
        {cta}
      </div>
    </div>
  );

  if (!user || !token) {
    return emptyShell(
      "Корзина",
      "Войдите, чтобы добавлять услуги в корзину.",
      <Link href="/login" className="btn-primary">Войти</Link>,
    );
  }

  if (orderResult) {
    return (
      <div className="bg-white min-h-[60vh] py-16 sm:py-24">
        <div className="container-page max-w-xl mx-auto text-center">
          <p className="eyebrow mb-4">Готово</p>
          <h1 className="h-display mb-4">Заказ оформлен.</h1>
          <p className="text-ink-500 mb-2">Номер вашего заказа:</p>
          <p className="font-heading text-3xl font-semibold text-ink-900 tabular mb-8">{orderResult.number}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/orders/${orderResult.number}/pay${orderResult.paymentToken ? `?pt=${encodeURIComponent(orderResult.paymentToken)}` : ""}`}
              className="btn-primary"
            >
              Оплатить онлайн (СБП)
            </Link>
            <Link href="/order-status" className="btn-secondary">
              Проверить статус
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return emptyShell(
      "Корзина пуста",
      "Добавьте услуги из каталога или конструктора.",
      <Link href="/" className="btn-primary">На главную</Link>,
    );
  }

  const handleOrder = async () => {
    setOrderLoading(true);
    try {
      const order = await api.createOrder({
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || "",
        items: cart.map(c => ({ service_id: c.service_id, quantity: c.quantity, price: 0 })),
      }, token);
      setOrderResult({ number: order.order_number, paymentToken: order.payment_token || "" });
      await refreshCart();
    } catch (err: any) {
      toast.error(err.message || "Ошибка оформления заказа");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow mb-4">Оформление</p>
              <h1 className="h-display">Корзина</h1>
            </div>
            <span className="text-ink-500 tabular text-sm">{cartCount} шт.</span>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 grid grid-cols-12 gap-x-6 gap-y-10">

        <div className="col-span-12 lg:col-span-8">
          <ul className="border border-ink-200 rounded-md overflow-hidden divide-y divide-ink-200">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center gap-4 bg-white px-5 py-4">
                <span
                  aria-hidden="true"
                  className="grid place-items-center w-11 h-11 rounded-md bg-ink-100 text-ink-700 font-heading text-lg font-semibold shrink-0"
                >
                  {item.service.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink-900 truncate">{item.service.name}</h3>
                  <p className="text-[12px] text-ink-500 tabular">Кол-во: {item.quantity}</p>
                  {item.note && <p className="text-[12px] text-ink-400 mt-0.5">{item.note}</p>}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="grid place-items-center w-8 h-8 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="Удалить"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Итого позиций</span>
              <span className="font-heading text-lg font-semibold text-ink-900 tabular">{cartCount}</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={orderLoading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {orderLoading ? "Оформляем…" : "Оформить заказ"}
            </button>
            <Link
              href="/"
              className="btn w-full text-center"
            >
              Продолжить покупки
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
