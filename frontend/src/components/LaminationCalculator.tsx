"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Minus, Plus, X, QrCode, Info,
  CheckCircle2, Phone,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

type Format = "А4" | "А3";

const PRICE: Record<Format, number> = { "А4": 50, "А3": 100 };

const QTY_PRESETS = [1, 5, 10, 25, 50, 100];

export default function LaminationCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();

  const [format, setFormat] = useState<Format>("А4");
  const [quantity, setQuantity] = useState(5);
  const [qtyInput, setQtyInput] = useState("5");

  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (serviceId) { setResolvedServiceId(serviceId); return; }
    let mounted = true;
    api.getServices().then((services) => {
      if (!mounted) return;
      const target = services.find((s) => s.slug.toLowerCase() === "ламинирование");
      setResolvedServiceId(target?.id ?? null);
    }).catch(() => { if (!mounted) return; setResolvedServiceId(null); });
    return () => { mounted = false; };
  }, [serviceId]);

  const calc = useMemo(() => {
    const unitPrice = PRICE[format];
    const total = unitPrice * quantity;
    return { unitPrice, total };
  }, [format, quantity]);

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Ламинирование
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Выберите параметры и сразу получите стоимость
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-ink-700 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    Ламинирование документов форматом <strong className="text-ink-900">менее А4</strong> рассчитывается
                    по стоимости формата А4.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p><strong className="text-ink-900">А4</strong> — {PRICE["А4"]} ₽ / шт.</p>
                <p><strong className="text-ink-900">А3</strong> — {PRICE["А3"]} ₽ / шт.</p>
                <p className="pt-1 border-t border-ink-200 text-ink-500">Плёнка 80–100 мкм</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField
                label="Формат"
                values={["А4", "А3"]}
                value={format}
                onChange={(v) => setFormat(v as Format)}
                hint="менее А4 = по цене А4"
              />

              <div className="pt-4 border-t border-ink-100">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Количество, шт.
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QTY_PRESETS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuantity(q); setQtyInput(String(q)); }}
                      className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        quantity === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <NumberStepper
                  value={quantity}
                  setValue={(n) => { const c = Math.max(1, n); setQuantity(c); setQtyInput(String(c)); }}
                  min={1}
                  inputValue={qtyInput}
                  onInputChange={(raw) => { setQtyInput(raw); const p = parseInt(raw); if (!isNaN(p) && p > 0) setQuantity(p); }}
                  onInputBlur={() => { const p = parseInt(qtyInput); const c = isNaN(p) || p < 1 ? 1 : p; setQuantity(c); setQtyInput(String(c)); }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">
                  Расчёт стоимости
                </p>

                <BreakdownRow
                  label="Ламинирование"
                  hint={`${quantity} × ${fmt(calc.unitPrice)} ₽`}
                  value={`${fmt(calc.total)} ₽`}
                />
                <BreakdownRow
                  label="Формат"
                  hint={format}
                  value=""
                />

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    Итого
                  </p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">
                    {fmt(calc.total)}&nbsp;₽
                  </p>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Оформить заказ
                </button>

                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
                  После оформления менеджер свяжется с вами и подтвердит заказ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          summary={{ format, quantity, total: calc.total, unitPrice: calc.unitPrice }}
          serviceId={resolvedServiceId}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </section>
  );
}

function PillsField({
  label, values, value, onChange, hint,
}: {
  label: string; values: string[]; value: string;
  onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label className="block text-[12px] font-semibold text-ink-700">{label}:</label>
        {hint && <span className="text-[11px] text-ink-500">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-3 h-9 rounded-md text-[12px] font-medium transition-colors ${
              v === value
                ? "bg-amber-50 text-amber-900 border border-amber-300"
                : "bg-white text-ink-700 border border-ink-200 hover:border-ink-300"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberStepper({
  value, setValue, min = 1,
  inputValue, onInputChange, onInputBlur,
}: {
  value: number; setValue: (n: number) => void; min?: number;
  inputValue?: string; onInputChange?: (raw: string) => void; onInputBlur?: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-ink-200 overflow-hidden w-44">
      <button
        onClick={() => setValue(Math.max(min, value - 1))}
        className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50"
        aria-label="Уменьшить"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={min}
        value={inputValue ?? value}
        onChange={onInputChange
          ? (e) => onInputChange(e.target.value)
          : (e) => setValue(Math.max(min, parseInt(e.target.value) || min))
        }
        onBlur={onInputBlur}
        className="flex-1 h-10 text-center text-sm font-semibold text-ink-900 tabular bg-white outline-none"
      />
      <button
        onClick={() => setValue(value + 1)}
        className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50"
        aria-label="Увеличить"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function BreakdownRow({
  label, value, hint,
}: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-700">{label}</p>
        {hint && <p className="text-[11px] text-ink-500">{hint}</p>}
      </div>
      {value && <p className="text-[13px] font-semibold text-ink-900 tabular whitespace-nowrap">{value}</p>}
    </div>
  );
}

type Summary = {
  format: string; quantity: number;
  total: number; unitPrice: number;
};

function CheckoutModal({
  summary, serviceId, onClose,
}: {
  summary: Summary; serviceId: number | null; onClose: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<"form" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Укажите имя, телефон и email");
      return;
    }
    const resolvedSid = serviceId || 0;

    setSending(true);
    try {
      const options = {
        format: summary.format,
        quantity: summary.quantity,
      };

      const fullComment = [
        `Ламинирование: ${summary.format}, ${summary.quantity} шт.`,
        `Итого: ${summary.total} ₽`,
        comment || "",
      ].filter(Boolean).join(" | ");

      const order = await api.createOrder({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        comment: fullComment,
        items: [{
          service_id: resolvedSid,
          quantity: summary.quantity,
          price: summary.total,
          options,
        }],
        delivery_type: "pickup",
        delivery_address: "",
        office_id: null,
        file_ids: [],
      });
      setOrderNumber(order.order_number);
      setSending(false);
      setStep("done");
    } catch (e: any) {
      setSending(false);
      toast.error(e?.message || "Не удалось оформить заказ");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl border border-ink-200 p-6 sm:p-7 relative my-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
        >
          <X size={16} />
        </button>

        {step === "form" ? (
          <form onSubmit={submit}>
            <h3 className="font-heading text-xl font-bold text-ink-900">Оформление заказа</h3>
            <p className="mt-1 text-sm text-ink-600">
              Менеджер свяжется с вами и подтвердит заказ.
            </p>

            <div className="mt-4 rounded-lg bg-ink-50 border border-ink-200 p-3 text-[12px] text-ink-700 space-y-0.5">
              <p>Ламинирование · {summary.format} · {summary.quantity} шт.</p>
              <p className="pt-1 font-semibold text-ink-900">Итого: {summary.total.toLocaleString("ru-RU")} ₽</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя *" className="input h-11" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон *" className="input h-11 tabular" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="input h-11 sm:col-span-2" required />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий к заказу (опц.)" rows={3} className="input sm:col-span-2 py-2 resize-none" />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full h-11 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
            >
              {sending ? "Отправляем…" : "Передать менеджеру"}
            </button>

            <p className="mt-3 text-[11px] text-ink-500 text-center">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <Link href="/legal/privacy" className="text-brand hover:underline">политикой обработки данных</Link>
            </p>
          </form>
        ) : (
          <div>
            <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-ink-900 text-center">Заказ принят</h3>
            <p className="mt-2 text-sm text-ink-600 text-center">
              Менеджер свяжется с вами по телефону {phone}
              {email ? <> или email {email}</> : null} для подтверждения.
            </p>
            {!!orderNumber && (
              <p className="mt-1 text-[12px] text-ink-500 text-center">
                Номер заказа: <span className="font-semibold text-ink-900">{orderNumber}</span>
              </p>
            )}

            <div className="mt-5 rounded-lg border border-ink-200 bg-ink-50 p-4 flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-md bg-white border border-ink-200 text-ink-700">
                <QrCode size={22} />
              </span>
              <div className="text-[12px] text-ink-700">
                <p className="font-semibold text-ink-900">Оплата по QR-коду СБП</p>
                <p>Ссылка придёт после подтверждения менеджером</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <a href="tel:+73452000000" className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 border border-ink-200 text-ink-900 text-[13px] font-medium hover:bg-ink-50">
                <Phone size={14} /> Позвонить
              </a>
              <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800">
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
