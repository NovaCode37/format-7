"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, ArrowRight } from "@/lib/icons";
import { api, type PaymentInfo } from "@/lib/api";
import Reveal, { ScaleIn } from "@/components/Reveal";

export default function PaymentPage() {
  const { number } = useParams<{ number: string }>();
  const searchParams = useSearchParams();
  const paymentToken = searchParams.get("pt") || "";
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrAttempt, setQrAttempt] = useState(0);

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
    if (!info || info.payment_status === "paid" || !paymentToken || qrPayload) return;
    let cancelled = false;
    setQrLoading(true);
    setQrError(null);
    api.initPayment(number, paymentToken)
      .then((res) => {
        if (cancelled) return;
        if (res.qr_payload) {
          setQrPayload(res.qr_payload);
        } else if (res.provider === "none") {
          setQrError("Онлайн-оплата не настроена. Свяжитесь с менеджером для оплаты.");
        } else {
          setQrError("Не удалось сформировать QR-код. Попробуйте обновить.");
        }
        if (res.payment_url) setPayUrl(res.payment_url);
      })
      .catch((e: any) => { if (!cancelled) setQrError(e?.message || "Ошибка платёжного сервиса"); })
      .finally(() => { if (!cancelled) setQrLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.payment_status, paymentToken, number, qrAttempt]);

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
                    <div className="mb-6 text-[12px] uppercase tracking-[0.16em] text-ink-500">
                      Оплата через СБП
                    </div>
                    <div className="bg-white p-4 border border-ink-200 rounded-md grid place-items-center text-center" style={{ minWidth: 268, minHeight: 268 }}>
                      {qrPayload ? (
                        <QRCodeSVG value={qrPayload} size={260} level="M" marginSize={2} />
                      ) : qrError ? (
                        <div className="px-4 max-w-[240px]">
                          <p className="text-[13px] text-ink-600 mb-4">{qrError}</p>
                          <button
                            type="button"
                            onClick={() => { setQrPayload(null); setQrError(null); setQrAttempt((n) => n + 1); }}
                            className="btn-secondary btn-sm cursor-pointer"
                          >
                            Обновить
                          </button>
                        </div>
                      ) : (
                        <Loader2 className="animate-spin text-ink-400" size={32} strokeWidth={2} />
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

            {!isPaid && payUrl && (
              <Reveal delay={0.12}>
                <div className="card p-6 space-y-3">
                  <p className="eyebrow">Быстрая оплата</p>
                  <p className="text-[13px] text-ink-600">
                    T-Pay — оплата в&nbsp;один тап через приложение Т-Банка.
                  </p>
                  <a
                    href={payUrl}
                    aria-label="Оплатить через T-Pay"
                    className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img src="/tpay-button.svg" alt="T-Pay" className="w-full h-12 object-contain" />
                  </a>
                  <a
                    href={payUrl}
                    className="btn-secondary btn-sm w-full cursor-pointer text-center"
                  >
                    Картой или другим способом
                  </a>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
