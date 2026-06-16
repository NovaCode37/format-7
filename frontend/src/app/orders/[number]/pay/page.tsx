"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, Copy, Smartphone, ArrowRight, CreditCard } from "@/lib/icons";
import { api, type PaymentInfo } from "@/lib/api";
import Reveal, { ScaleIn } from "@/components/Reveal";
import { useToast } from "@/components/Toast";

export default function PaymentPage() {
  const { number } = useParams<{ number: string }>();
  const searchParams = useSearchParams();
  const paymentToken = searchParams.get("pt") || "";
  const toast = useToast();
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [tbankQr, setTbankQr] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [info, refresh]);

  useEffect(() => {
    if (!info || info.payment_status === "paid" || !paymentToken || tbankQr || qrLoading) return;
    let cancelled = false;
    setQrLoading(true);
    api.initPayment(number, paymentToken)
      .then((res) => {
        if (cancelled) return;
        if (res.provider === "tbank" && res.qr_image) setTbankQr(res.qr_image);
        if (res.payment_url) setPayUrl(res.payment_url);
        if (res.confirmation_url) setPayUrl(res.confirmation_url);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setQrLoading(false); });
    return () => { cancelled = true; };
  }, [info, paymentToken, number, tbankQr, qrLoading]);

  const handleCopy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.sbp_payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleCardPay = async () => {
    if (!paymentToken) {
      toast.error("Отсутствует токен оплаты");
      return;
    }
    setInitiating(true);
    try {
      const res = await api.initPayment(number, paymentToken);
      const url = res.confirmation_url || res.payment_url || payUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.info("Оплата картой временно недоступна. Воспользуйтесь QR-кодом СБП.");
    } catch (err: any) {
      toast.error(err.message || "Ошибка инициализации оплаты");
    } finally {
      setInitiating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!paymentToken) {
      toast.error("Откройте страницу оплаты по ссылке из корзины");
      return;
    }
    setMarking(true);
    try {
      const data = await api.markOrderPaid(number, paymentToken);
      setInfo(data);
    } catch (err: any) {
      toast.error(err.message || "Ошибка");
    } finally {
      setMarking(false);
    }
  };

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
                    <div className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink-500">
                      <Smartphone size={14} strokeWidth={2} />
                      Оплата через СБП
                    </div>
                    <div className="bg-white p-4 border border-ink-200 rounded-md grid place-items-center" style={{ minWidth: 268, minHeight: 268 }}>
                      {tbankQr ? (
                        <img
                          src={`data:image/svg+xml;base64,${tbankQr}`}
                          alt="QR-код для оплаты по СБП"
                          width={260}
                          height={260}
                        />
                      ) : qrLoading ? (
                        <Loader2 className="animate-spin text-ink-400" size={32} strokeWidth={2} />
                      ) : (
                        <QRCodeSVG
                          value={info.sbp_payload}
                          size={260}
                          level="M"
                          marginSize={2}
                        />
                      )}
                    </div>
                    <p className="mt-6 text-sm text-ink-700 text-center max-w-sm">
                      Откройте приложение&nbsp;вашего&nbsp;банка, выберите{" "}
                      <span className="font-semibold">«Оплата по&nbsp;QR&nbsp;/ СБП»</span>{" "}
                      и&nbsp;наведите камеру на&nbsp;код.
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

            {!isPaid && paymentToken && (
              <Reveal delay={0.12}>
                <div className="card p-6 space-y-3">
                  <p className="eyebrow">Оплатить картой</p>
                  <p className="text-[13px] text-ink-600">
                    Банковская карта через Т-Банк. Безопасное соединение, 3-D&nbsp;Secure.
                  </p>
                  <button
                    type="button"
                    onClick={handleCardPay}
                    disabled={initiating}
                    className="btn-primary btn-sm w-full cursor-pointer disabled:opacity-60"
                  >
                    <CreditCard size={14} strokeWidth={2} />
                    {initiating ? "Переход…" : "Оплатить картой"}
                  </button>
                </div>
              </Reveal>
            )}

            {!isPaid && (
              <Reveal delay={0.15}>
                <div className="card p-6 space-y-3">
                  <p className="eyebrow">Альтернатива</p>
                  <p className="text-[13px] text-ink-600">
                    Скопируйте платёжную строку и&nbsp;вставьте в&nbsp;приложение банка вручную.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary btn-sm w-full cursor-pointer"
                  >
                    <Copy size={14} strokeWidth={2} />
                    {copied ? "Скопировано ✓" : "Скопировать данные"}
                  </button>
                </div>
              </Reveal>
            )}

            {!isPaid && paymentToken && (
              <Reveal delay={0.2}>
                <div className="card p-6 space-y-3 border-dashed">
                  <p className="eyebrow text-amber-700">DEV / Тест</p>
                  <p className="text-[12px] text-ink-500">
                    Имитация колбэка от&nbsp;банка. В&nbsp;продакшене статус приходит через webhook.
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={marking}
                    className="btn btn-sm w-full cursor-pointer disabled:opacity-60"
                  >
                    {marking ? "…" : "Отметить как оплачено"}
                  </button>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
