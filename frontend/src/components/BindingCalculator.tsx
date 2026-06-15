"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone, Info,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

type SpringType = "Пластиковая" | "Металлическая";
type Format = "А4" | "А3";
type Orientation = "По короткой стороне" | "По длинной стороне";
type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";

const PLASTIC_PRICE_A4: { maxSheets: number; price: number }[] = [
  { maxSheets: 30,  price: 80 },
  { maxSheets: 70,  price: 85 },
  { maxSheets: 150, price: 90 },
  { maxSheets: 200, price: 95 },
  { maxSheets: 300, price: 100 },
  { maxSheets: 400, price: 105 },
  { maxSheets: 498, price: 110 },
];

const PLASTIC_PRICE_A3: { maxSheets: number; price: number }[] = [
  { maxSheets: 30,  price: 85 },
  { maxSheets: 70,  price: 90 },
  { maxSheets: 150, price: 95 },
  { maxSheets: 200, price: 100 },
  { maxSheets: 300, price: 105 },
  { maxSheets: 400, price: 110 },
  { maxSheets: 498, price: 115 },
];

const METAL_PRICE_A4: { maxSheets: number; price: number }[] = [
  { maxSheets: 30,  price: 100 },
  { maxSheets: 70,  price: 105 },
  { maxSheets: 120, price: 110 },
];

const METAL_PRICE_A3: { maxSheets: number; price: number }[] = [
  { maxSheets: 30,  price: 105 },
  { maxSheets: 70,  price: 110 },
  { maxSheets: 120, price: 115 },
];

function getPriceTable(spring: SpringType, format: Format) {
  if (spring === "Пластиковая") return format === "А4" ? PLASTIC_PRICE_A4 : PLASTIC_PRICE_A3;
  return format === "А4" ? METAL_PRICE_A4 : METAL_PRICE_A3;
}

function getMaxSheets(spring: SpringType): number {
  return spring === "Пластиковая" ? 498 : 120;
}

function getBindingPrice(spring: SpringType, format: Format, sheets: number): number | null {
  const table = getPriceTable(spring, format);
  for (const tier of table) {
    if (sheets <= tier.maxSheets) return tier.price;
  }
  return null;
}

const SHEET_PRESETS_PLASTIC = [10, 30, 50, 70, 100, 150, 200, 300];
const SHEET_PRESETS_METAL = [10, 30, 50, 70, 100, 120];

const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

const QTY_PRESETS = [1, 2, 3, 5, 10, 25];

export default function BindingCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [spring, setSpring] = useState<SpringType>("Пластиковая");
  const [format, setFormat] = useState<Format>("А4");
  const [orientation, setOrientation] = useState<Orientation>("По короткой стороне");
  const [sheets, setSheets] = useState(30);
  const [sheetsInput, setSheetsInput] = useState("30");
  const [copies, setCopies] = useState(1);
  const [copiesInput, setCopiesInput] = useState("1");
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");

  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: number | null } | null>(null);
  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (format === "А3") setOrientation("По короткой стороне");
  }, [format]);

  useEffect(() => {
    const max = getMaxSheets(spring);
    if (sheets > max) {
      setSheets(max);
      setSheetsInput(String(max));
    }

  }, [spring]);

  useEffect(() => {
    if (serviceId) { setResolvedServiceId(serviceId); return; }
    let mounted = true;
    api.getServices().then((services) => {
      if (!mounted) return;
      const target = services.find((s) =>
        s.slug.toLowerCase() === "переплёт-и-брошюровка" ||
        s.slug.toLowerCase() === "брошюровка"
      );
      setResolvedServiceId(target?.id ?? null);
    }).catch(() => { if (!mounted) return; setResolvedServiceId(null); });
    return () => { mounted = false; };
  }, [serviceId]);

  const sheetPresets = spring === "Пластиковая" ? SHEET_PRESETS_PLASTIC : SHEET_PRESETS_METAL;
  const maxSheets = getMaxSheets(spring);

  const calc = useMemo(() => {
    const unitPrice = getBindingPrice(spring, format, sheets);
    if (unitPrice === null) return { unitPrice: 0, bindingTotal: 0, deliveryTotal: 0, grandTotal: 0, error: true };

    const bindingTotal = unitPrice * copies;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = bindingTotal + deliveryTotal;

    return { unitPrice, bindingTotal, deliveryTotal, grandTotal, error: false };
  }, [spring, format, sheets, copies, delivery]);

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    try {
      const up = await api.uploadFile(f);
      setUploadedFile({ name: up.original_name, id: up.id });
      toast.success(`Макет «${up.original_name}» загружен`);
    } catch {
      setUploadedFile({ name: f.name, id: null });
      toast.success(`Макет «${f.name}» принят (будет передан менеджеру)`);
    }
  };

  const orderSummary = {
    spring, format, orientation, sheets, copies, delivery,
    fileName: uploadedFile?.name || null,
    fileId: uploadedFile?.id ?? null,
    total: calc.grandTotal,
    unitPrice: calc.unitPrice,
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Брошюровка
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Выберите параметры и сразу получите стоимость
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-ink-700 space-y-2">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-ink-900">В стоимость брошюровки включена</strong> обложка
                    (прозрачная) и подложка (чёрная).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    Переплёт формата <strong className="text-ink-900">А3 только по короткой стороне</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-center gap-1.5">
                  <Truck size={13} /> Доставка по Тюмени — 700 ₽.
                </p>
                <p className="flex items-center gap-1.5">
                  <Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField
                label="Пружина"
                values={["Пластиковая", "Металлическая"]}
                value={spring}
                onChange={(v) => setSpring(v as SpringType)}
                hint={spring === "Пластиковая" ? "до 498 листов" : "до 120 листов"}
              />

              <PillsField
                label="Формат"
                values={["А4", "А3"]}
                value={format}
                onChange={(v) => setFormat(v as Format)}
              />

              <div>
                <PillsField
                  label="Ориентация переплёта"
                  values={format === "А3"
                    ? ["По короткой стороне"]
                    : ["По длинной стороне", "По короткой стороне"]
                  }
                  value={orientation}
                  onChange={(v) => setOrientation(v as Orientation)}
                  hint={format === "А3" ? "А3 — только по короткой стороне" : undefined}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Количество листов в одной брошюре
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sheetPresets.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setSheets(q); setSheetsInput(String(q)); }}
                      className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        sheets === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <NumberStepper
                  value={sheets}
                  setValue={(n) => {
                    const c = Math.max(1, Math.min(maxSheets, n));
                    setSheets(c);
                    setSheetsInput(String(c));
                  }}
                  min={1}
                  max={maxSheets}
                  inputValue={sheetsInput}
                  onInputChange={(raw) => {
                    setSheetsInput(raw);
                    const p = parseInt(raw);
                    if (!isNaN(p) && p > 0 && p <= maxSheets) setSheets(p);
                  }}
                  onInputBlur={() => {
                    const p = parseInt(sheetsInput);
                    const c = isNaN(p) || p < 1 ? 1 : Math.min(p, maxSheets);
                    setSheets(c);
                    setSheetsInput(String(c));
                  }}
                />
                {calc.error && (
                  <p className="mt-1.5 text-[11px] text-red-600">
                    Превышено максимальное количество листов для {spring.toLowerCase()} пружины ({maxSheets} листов)
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-ink-100">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Количество экземпляров (брошюр)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QTY_PRESETS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setCopies(q); setCopiesInput(String(q)); }}
                      className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        copies === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <NumberStepper
                  value={copies}
                  setValue={(n) => {
                    const c = Math.max(1, n);
                    setCopies(c);
                    setCopiesInput(String(c));
                  }}
                  min={1}
                  inputValue={copiesInput}
                  onInputChange={(raw) => {
                    setCopiesInput(raw);
                    const p = parseInt(raw);
                    if (!isNaN(p) && p > 0) setCopies(p);
                  }}
                  onInputBlur={() => {
                    const p = parseInt(copiesInput);
                    const c = isNaN(p) || p < 1 ? 1 : p;
                    setCopies(c);
                    setCopiesInput(String(c));
                  }}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Доставка"
                  values={["Самовывоз", "Доставка по Тюмени", "СДЭК (наложенный платёж)"]}
                  value={delivery}
                  onChange={(v) => setDelivery(v as Delivery)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">
                  Расчёт стоимости
                </p>

                <BreakdownRow
                  label="Брошюровка"
                  hint={`${copies} × ${fmt(calc.unitPrice)} ₽`}
                  value={`${fmt(calc.bindingTotal)} ₽`}
                />
                <BreakdownRow
                  label="Пружина"
                  hint={`${spring.toLowerCase()}, ${sheets} л.`}
                  value=""
                />
                <BreakdownRow
                  label="Формат"
                  hint={`${format}, ${orientation.toLowerCase()}`}
                  value=""
                />
                <BreakdownRow
                  label="Доставка"
                  hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined}
                  value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"}
                />

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    Итого
                  </p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">
                    {fmt(calc.grandTotal)}&nbsp;₽
                  </p>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={calc.error}
                  className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  Оформить заказ
                </button>

                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
                  После оформления менеджер проверит макет и свяжется для подтверждения и оплаты.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          summary={orderSummary}
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
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
  hint?: string;
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
  value, setValue, min = 1, max,
  inputValue, onInputChange, onInputBlur,
}: {
  value: number; setValue: (n: number) => void; min?: number; max?: number;
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
        max={max}
        value={inputValue ?? value}
        onChange={onInputChange
          ? (e) => onInputChange(e.target.value)
          : (e) => setValue(Math.max(min, parseInt(e.target.value) || min))
        }
        onBlur={onInputBlur}
        className="flex-1 h-10 text-center text-sm font-semibold text-ink-900 tabular bg-white outline-none"
      />
      <button
        onClick={() => {
          const next = value + 1;
          if (max !== undefined && next > max) return;
          setValue(next);
        }}
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
  spring: string; format: string; orientation: string;
  sheets: number; copies: number; delivery: string;
  fileName: string | null; fileId: number | null;
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
  const [address, setAddress] = useState("");
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

    const deliveryType = summary.delivery === "Самовывоз" ? "pickup" : "delivery";
    if (deliveryType === "delivery" && !address.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }

    setSending(true);
    try {
      const options = {
        spring: summary.spring,
        format: summary.format,
        orientation: summary.orientation,
        sheets: summary.sheets,
        copies: summary.copies,
        delivery: summary.delivery,
        file: summary.fileName || "—",
      };

      const fullComment = [
        `Брошюровка: ${summary.spring} пружина, ${summary.format}, ${summary.orientation}`,
        `${summary.sheets} л. × ${summary.copies} экз.`,
        `Итого: ${summary.total} ₽`,
        `Адрес: ${address || "—"}`,
        comment || "",
      ].filter(Boolean).join(" | ");

      const order = await api.createOrder({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        comment: fullComment,
        items: [{
          service_id: resolvedSid,
          quantity: summary.copies,
          price: summary.total,
          options,
        }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? address : "",
        office_id: null,
        file_ids: summary.fileId ? [summary.fileId] : [],
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
              Менеджер свяжется для подтверждения и оплаты.
            </p>

            <div className="mt-4 rounded-lg bg-ink-50 border border-ink-200 p-3 text-[12px] text-ink-700 space-y-0.5">
              <p>{summary.spring} пружина · {summary.format} · {summary.orientation}</p>
              <p>{summary.sheets} листов · {summary.copies} экз.</p>
              <p>Доставка: {summary.delivery}</p>
              <p className="pt-1 font-semibold text-ink-900">Итого: {summary.total.toLocaleString("ru-RU")} ₽</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя *" className="input h-11" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон *" className="input h-11 tabular" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (для чека)" className="input h-11 sm:col-span-2" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={summary.delivery === "Самовывоз" ? "Офис самовывоза (опц.)" : "Адрес доставки"} className="input h-11 sm:col-span-2" />
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
              Менеджер проверит макет и свяжется для оплаты по телефону {phone}
              {email ? <> и {email}</> : null}. После оплаты заказ уйдёт в работу.
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
                <p className="font-semibold text-ink-900">Оплата по согласованию</p>
                <p>Менеджер согласует способ оплаты после проверки макета</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <a href="tel:+79324759511" className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 border border-ink-200 text-ink-900 text-[13px] font-medium hover:bg-ink-50">
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
