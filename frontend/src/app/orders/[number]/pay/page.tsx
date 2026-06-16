"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "@/lib/icons";
import { api, type PaymentInfo } from "@/lib/api";
import Reveal, { ScaleIn } from "@/components/Reveal";

export default function PaymentPage() {
  const { number } = useParams<{ number: string }>();
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getPaymentInfo(number);
      setInfo(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Не удалось получить данные оплаты");
    } finally {
      setLoading(false);
    }
  }, [number]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!info || info.payment_status === "paid") return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [info, refresh]);

  if (loading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="bg-white">
        <div className="container-page py-20 text-center">
          <h1 className="h-display mb-3">Заказ не найден</h1>
          <p className="text-ink-500 mb-6">{error || "Проверьте номер заказа"}</p>
          <Link href="/" className="btn-primary">На главную</Link>
        </div>
      </div>
    );
  }

  const isPaid = info.payment_status === "paid";

  return (
    <div className="bg-white min-h-screen">

      <div className="border-b border-ink-200">
        <div className="container-page py-3 text-[12px] text-ink-400">
          <Link href="/" className="hover:text-ink-900 transition-colors">Главная</Link>
          <span className="mx-1.5">/</span>
          <Link href="/profile" className="hover:text-ink-900 transition-colors">Заказы</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-700">Оплата</span>
        </div>
      </div>

      <section className="border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <Reveal>
            <p className="eyebrow mb-4">Оплата заказа</p>
            <h1 className="h-display mb-2">№ {info.order_number}</h1>
            <p className="text-ink-500">
              К оплате:{" "}
              <span className="text-ink-900 font-semibold tabular">
                {info.total.toLocaleString("ru-RU")} ₽
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-page py-12 sm:py-16">
        <div className="grid grid-cols-12 gap-6 lg:gap-10">

          <div className="col-span-12 lg:col-span-7">
            <ScaleIn>
              <div className="card p-6 sm:p-10">
                {isPaid ? (
                  <div className="flex flex-col items-center text-center py-8">
                    <CheckCircle2
                      size={64}
                      strokeWidth={1.25}
                      className="text-emerald-600 mb-4"
                    />
                    <h2 className="h-section mb-2">Заказ оплачен</h2>
                    <p className="text-ink-500 mb-6 max-w-sm">
                      Спасибо! Мы получили оплату и&nbsp;уже&nbsp;приступили к&nbsp;вашему заказу.
                    </p>
                    <div className="flex gap-3">
                      <Link href="/profile" className="btn-primary btn-sm">
                        Мои заказы
                        <ArrowRight size={14} strokeWidth={2} />
                      </Link>
                      <Link href="/" className="btn-secondary btn-sm">
                        На главную
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <img src="/sbp-logo.png" alt="Система быстрых платежей" className="h-9 mb-6 object-contain" />
                    <div className="rounded-2xl overflow-hidden border border-ink-200 shadow-sm">
                      <img
                        src="/sbp-pay-qr.png"
                        alt="QR-код для оплаты по СБП"
                        className="block w-[300px] max-w-full h-auto"
                      />
                    </div>
                    <p className="mt-6 text-sm text-ink-700 text-center max-w-sm">
                      Откройте камеру телефона или приложение банка, наведите на&nbsp;код и&nbsp;оплатите{" "}
                      <span className="font-semibold tabular">{info.total.toLocaleString("ru-RU")} ₽</span>{" "}
                      по&nbsp;СБП.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-500">
                      <Loader2 size={12} className="animate-spin" strokeWidth={2} />
                      Ожидаем оплату…
                    </div>
                  </div>
                )}
              </div>
            </ScaleIn>
          </div>

          <aside className="col-span-12 lg:col-span-5 space-y-4">
            <Reveal delay={0.1}>
              <div className="card p-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-ink-100 pb-3">
                  <span className="eyebrow">Получатель</span>
                  <span className="text-[13px] text-ink-700 text-right">{info.merchant_name}</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-ink-100 pb-3">
                  <span className="eyebrow">Заказ</span>
                  <span className="text-[13px] text-ink-700 tabular">{info.order_number}</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-ink-100 pb-3">
                  <span className="eyebrow">Способ</span>
                  <span className="text-[13px] text-ink-700">СБП</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow">Сумма</span>
                  <span className="font-heading text-xl font-semibold text-ink-900 tabular">
                    {info.total.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>
            </Reveal>

            {!isPaid && (
              <Reveal delay={0.12}>
                <div className="card p-6 space-y-2">
                  <p className="eyebrow">Как оплатить</p>
                  <ol className="text-[13px] text-ink-600 space-y-1.5 list-decimal list-inside">
                    <li>Наведите камеру телефона на&nbsp;QR-код.</li>
                    <li>Выберите банк и&nbsp;подтвердите оплату по&nbsp;СБП.</li>
                    <li>Укажите сумму заказа — <span className="font-semibold text-ink-900 tabular">{info.total.toLocaleString("ru-RU")} ₽</span>.</li>
                  </ol>
                  <p className="text-[12px] text-ink-500 pt-1">
                    После оплаты менеджер подтвердит заказ. Статус — в&nbsp;личном кабинете.
                  </p>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
