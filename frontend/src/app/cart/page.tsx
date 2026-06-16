"use client";

import { useAuth } from "@/lib/auth-context";
import { api, type CartItem } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag } from "@/lib/icons";
import { useState } from "react";
import { useToast } from "@/components/Toast";

function parseOptions(raw: string): Record<string, any> {
  try {
    const o = typeof raw === "string" && raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

export default function CartPage() {
  const { user, token, cart, cartCount, removeFromCart, refreshCart } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [orderLoading, setOrderLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [orderResult, setOrderResult] = useState<{ number: string } | null>(null);

  const total = cart.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0);

  const emptyShell = (heading: string, sub: string, cta: React.ReactNode) => (
    <div className="bg-ink-50 border-t border-ink-200 min-h-[60vh] py-16 sm:py-24">
      <div className="container-page max-w-xl mx-auto text-center">
        <ShoppingBag size={36} strokeWidth={2} className="mx-auto mb-6 text-ink-300" />
        <h1 className="h-section mb-3">{heading}</h1>
        <p className="text-ink-500 mb-8">{sub}</p>
        {cta}
      </div>
    </div>
  );

  if (!user || !token) {
    return emptyShell(
      "Корзина",
      "Войдите, чтобы оформить заказ.",
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
          <p className="font-heading text-3xl font-semibold text-ink-900 tabular mb-6">{orderResult.number}</p>
          <p className="text-ink-500 mb-8">
            Менеджер свяжется с вами для подтверждения макета и оплаты. Статус заказа — в личном кабинете.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/profile" className="btn-primary">Мои заказы</Link>
            <Link href="/catalog" className="btn-secondary">Продолжить покупки</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return emptyShell(
      "Корзина пуста",
      "Добавьте услуги из каталога — рассчитайте товар в калькуляторе и нажмите «Добавить в корзину».",
      <Link href="/catalog" className="btn-primary">В каталог</Link>,
    );
  }

  const handleOrder = async () => {
    setOrderLoading(true);
    try {
      const fileIds: number[] = [];
      const items = cart.map((c) => {
        const opts = parseOptions(c.options);
        if (opts._fileId) {
          fileIds.push(Number(opts._fileId));
          delete opts._fileId;
        }
        return { service_id: c.service_id, quantity: c.quantity, price: c.price || 0, options: opts };
      });
      const order = await api.createOrder({
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || "",
        comment: comment.trim(),
        items,
        file_ids: fileIds,
      }, token);
      await refreshCart();
      if (order.payment_token) {
        router.push(`/orders/${encodeURIComponent(order.order_number)}/pay?pt=${encodeURIComponent(order.payment_token)}`);
        return;
      }
      setOrderResult({ number: order.order_number });
    } catch (err: any) {
      toast.error(err.message || "Ошибка оформления заказа");
    } finally {
      setOrderLoading(false);
    }
  };

  const itemTitle = (c: CartItem) => {
    const opts = parseOptions(c.options);
    return opts.Товар || c.service?.name || "Позиция";
  };
  const itemSpecs = (c: CartItem) => {
    const opts = parseOptions(c.options);
    return Object.entries(opts)
      .filter(([k]) => k !== "Товар" && !k.startsWith("_"))
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
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
              <li key={item.id} className="flex items-start gap-4 bg-white px-5 py-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink-900">{itemTitle(item)}</h3>
                  {itemSpecs(item) && (
                    <p className="text-[12px] text-ink-500 mt-0.5 leading-relaxed">{itemSpecs(item)}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-ink-900 tabular">{(item.price || 0).toLocaleString("ru-RU")} ₽</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="grid place-items-center w-8 h-8 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="Удалить"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Комментарий к заказу (опц.)"
            rows={3}
            className="input mt-4 w-full py-2.5 resize-none"
          />
        </div>

        <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Позиций</span>
              <span className="font-heading text-base font-semibold text-ink-900 tabular">{cart.length}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-100 pt-4">
              <span className="eyebrow">Итого</span>
              <span className="font-heading text-2xl font-semibold text-ink-900 tabular">{total.toLocaleString("ru-RU")} ₽</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={orderLoading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {orderLoading ? "Оформляем…" : "Оформить заказ"}
            </button>
            <p className="text-[11px] text-ink-500 text-center">
              Менеджер свяжется для подтверждения и оплаты.
            </p>
            <Link href="/catalog" className="btn w-full text-center">
              Продолжить покупки
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
