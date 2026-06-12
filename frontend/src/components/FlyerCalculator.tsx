"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone, LayoutTemplate, Palette,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";
import { DesignBriefCard } from "./calc/kit";

type Track = "template" | "upload" | "design";
type Color = "Цветная" | "Чёрно-белая";
type Sides = "Двусторонняя" | "Односторонняя";
type Orient = "Вертикальная" | "Горизонтальная";
type Lamination = "Нет" | "Да";
type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";

const FLYER_SLUG = "флаеры";

const PRINT_TIERS = [100, 200, 500, 1000] as const;
type Tier = (typeof PRINT_TIERS)[number];

const PRINT_PRICE: Record<"4+4" | "4+0" | "1+1" | "1+0", Record<Tier, number>> = {
  "4+4": { 100: 21, 200: 17, 500: 12, 1000: 9 },
  "4+0": { 100: 14, 200: 12, 500: 9,  1000: 7 },
  "1+1": { 100: 12, 200: 11, 500: 9,  1000: 7 },
  "1+0": { 100: 8,  200: 7,  500: 6,  1000: 5 },
};

const LAMINATION_PRICE: Record<Lamination, number> = {
  "Нет": 0,
  "Да": 15,
};

const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

const DESIGN_FEE = 1200;
const MIN_QTY = 100;
const QTY_PRESETS = [100, 200, 500, 1000];

function unitPrintPrice(mode: "4+4" | "4+0" | "1+1" | "1+0", qty: number): number {
  const tierKey: Tier =
    qty >= 1000 ? 1000 :
    qty >= 500  ? 500  :
    qty >= 200  ? 200  : 100;
  return PRINT_PRICE[mode][tierKey];
}

function modeKey(color: Color, sides: Sides): "4+4" | "4+0" | "1+1" | "1+0" {
  const isColor = color === "Цветная";
  const isDouble = sides === "Двусторонняя";
  if (isColor && isDouble) return "4+4";
  if (isColor && !isDouble) return "4+0";
  if (!isColor && isDouble) return "1+1";
  return "1+0";
}

export default function FlyerCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [track, setTrack] = useState<Track>("upload");
  const [color, setColor] = useState<Color>("Цветная");
  const [sides, setSides] = useState<Sides>("Двусторонняя");
  const [orient, setOrient] = useState<Orient>("Вертикальная");
  const [lamination, setLamination] = useState<Lamination>("Нет");
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [quantity, setQuantity] = useState<number>(100);
  const [qtyInput, setQtyInput] = useState<string>("100");

  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: number | null } | null>(null);
  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (serviceId) { setResolvedServiceId(serviceId); return; }
    let mounted = true;
    api.getServices()
      .then((services) => {
        if (!mounted) return;
        const target = services.find((s) => s.slug.toLowerCase() === FLYER_SLUG);
        setResolvedServiceId(target?.id ?? null);
      })
      .catch(() => mounted && setResolvedServiceId(null));
    return () => { mounted = false; };
  }, [serviceId]);

  const calc = useMemo(() => {
    const mode = modeKey(color, sides);
    const printUnit = unitPrintPrice(mode, quantity);
    const printTotal = printUnit * quantity;

    const laminationUnit = LAMINATION_PRICE[lamination];
    const laminationTotal = laminationUnit * quantity;

    const designTotal = track === "design" ? DESIGN_FEE : 0;

    const deliveryTotal = DELIVERY_PRICE[delivery];

    const grandTotal = printTotal + laminationTotal + designTotal + deliveryTotal;

    return {
      mode, printUnit, printTotal,
      laminationUnit, laminationTotal,
      designTotal,
      deliveryTotal,
      grandTotal,
    };
  }, [color, sides, quantity, lamination, delivery, track]);

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
    track, color, sides, orient,
    mode: calc.mode,
    lamination,
    delivery,
    quantity,
    fileName: uploadedFile?.name || null,
    fileId: uploadedFile?.id ?? null,
    total: calc.grandTotal,
    designFee: calc.designTotal,
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Флаеры
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Евро 98×210 мм, мелованная глянцевая бумага 130 г/м². Цена тиража действует на 1 вид макета.
            Размер готового изделия может отличаться от стандартного на ±2 мм.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard
            active={track === "upload"}
            onClick={() => setTrack("upload")}
            icon={<Upload size={18} />}
            title="Загрузить ваш макет"
            hint="У вас уже есть готовый файл"
          />
          <TrackCard
            active={track === "design"}
            onClick={() => setTrack("design")}
            icon={<Palette size={18} />}
            title="Заказ дизайна"
            hint="Разработка 1200 ₽"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              {track === "upload" && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${
                      uploadedFile
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-amber-300 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`grid place-items-center w-11 h-11 rounded-lg ${
                        uploadedFile ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {uploadedFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                      </span>
                      <div>
                        <p className="font-heading text-base font-bold text-ink-900">
                          {uploadedFile ? "Макет загружен" : "Загрузить ваш макет"}
                        </p>
                        <p className="text-[12px] text-ink-500">
                          PDF, AI, CDR, PSD, TIFF, JPG (до вылетов +2 мм)
                        </p>
                      </div>
                    </div>
                    {uploadedFile && (
                      <p className="mt-2 text-[12px] text-emerald-700 break-all">
                        {uploadedFile.name}
                      </p>
                    )}
                    <p className="mt-3 text-[11px] text-ink-500">
                      Размер готового макета: от среза стандарт +2 мм с каждой стороны
                    </p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </>
              )}

              {track === "template" && (
                <div className="rounded-xl border border-ink-200 bg-ink-50 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="grid place-items-center w-11 h-11 rounded-lg bg-ink-900 text-white">
                      <LayoutTemplate size={20} />
                    </span>
                    <p className="font-heading text-base font-bold text-ink-900">
                      Каталог шаблонов
                    </p>
                  </div>
                  <p className="text-[12px] text-ink-600 mb-3">
                    Выберите готовый макет — мы подставим ваши данные и пришлём превью на утверждение.
                  </p>
                  <Link
                    href="/catalog?type=flyer-templates"
                    className="inline-flex items-center justify-center w-full h-10 rounded-md bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800"
                  >
                    Открыть шаблоны
                  </Link>
                  <p className="mt-3 text-[11px] text-ink-500">
                    Шаблон бесплатный — оплачивается только печать и доп. услуги.
                  </p>
                </div>
              )}

              {track === "design" && (
                <DesignBriefCard product="Флаеры">
                  <p className="text-[12px] text-ink-700 mb-1.5">
                    Стоимость — <strong>1200 ₽</strong>. В цену включены <strong>2 доработки</strong>.
                  </p>
                  <p className="text-[12px] text-ink-700">
                    Каждая последующая правка — <strong>+100 ₽</strong>.
                  </p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p><strong className="text-ink-900">Формат:</strong> Евро 98×210 мм.</p>
                <p>Печать на мелованной (глянцевой) бумаге плотностью 130 г/м².</p>
                <p>Цена тиража действует на 1 вид макета.</p>
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
                label="Цветность"
                values={["Цветная", "Чёрно-белая"]}
                value={color}
                onChange={(v) => setColor(v as Color)}
              />

              <PillsField
                label="Стороны печати"
                values={["Двусторонняя", "Односторонняя"]}
                value={sides}
                onChange={(v) => setSides(v as Sides)}
              />

              <PillsField
                label="Ориентация"
                values={["Вертикальная", "Горизонтальная"]}
                value={orient}
                onChange={(v) => setOrient(v as Orient)}
                hint="на цену не влияет"
              />

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Ламинация"
                  values={["Нет", "Да"]}
                  value={lamination}
                  onChange={(v) => setLamination(v as Lamination)}
                  hint={lamination === "Да" ? "+15 ₽/шт" : undefined}
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

              <div className="pt-4 border-t border-ink-100">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Тираж, шт.
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
                  setValue={(n) => { const c = Math.max(MIN_QTY, n); setQuantity(c); setQtyInput(String(c)); }}
                  min={MIN_QTY}
                  step={10}
                  inputValue={qtyInput}
                  onInputChange={(raw) => { setQtyInput(raw); const p = parseInt(raw); if (!isNaN(p) && p > 0) setQuantity(p); }}
                  onInputBlur={() => { const p = parseInt(qtyInput); const c = isNaN(p) || p < MIN_QTY ? MIN_QTY : p; setQuantity(c); setQtyInput(String(c)); }}
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
                  label={`Печать ${calc.mode}`}
                  hint={`${quantity} × ${fmt(calc.printUnit)} ₽`}
                  value={`${fmt(calc.printTotal)} ₽`}
                />
                {lamination !== "Нет" && (
                  <BreakdownRow
                    label="Ламинация"
                    hint={`${quantity} × ${fmt(calc.laminationUnit)} ₽`}
                    value={`${fmt(calc.laminationTotal)} ₽`}
                  />
                )}
                {calc.designTotal > 0 && (
                  <BreakdownRow
                    label="Разработка макета"
                    hint="1200 ₽, 2 доработки в стоимости"
                    value={`${fmt(calc.designTotal)} ₽`}
                  />
                )}
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
                  className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors"
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

function TrackCard({
  active, onClick, icon, title, hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-colors ${
        active
          ? "border-amber-400 bg-amber-50"
          : "border-ink-200 bg-white hover:border-ink-300"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`grid place-items-center w-9 h-9 rounded-md ${
          active ? "bg-amber-500 text-white" : "bg-ink-100 text-ink-700"
        }`}>
          {icon}
        </span>
        <div>
          <p className="font-heading text-[14px] font-bold text-ink-900">{title}</p>
          <p className="text-[11px] text-ink-500">{hint}</p>
        </div>
      </div>
    </button>
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
  value, setValue, min = 1, step = 1,
  inputValue, onInputChange, onInputBlur,
}: {
  value: number; setValue: (n: number) => void; min?: number; step?: number;
  inputValue?: string; onInputChange?: (raw: string) => void; onInputBlur?: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-ink-200 overflow-hidden w-44">
      <button
        onClick={() => setValue(Math.max(min, value - step))}
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
        onClick={() => setValue(value + step)}
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
      <p className="text-[13px] font-semibold text-ink-900 tabular whitespace-nowrap">{value}</p>
    </div>
  );
}

type Summary = {
  track: Track;
  color: string; sides: string; orient: string;
  mode: string;
  lamination: string;
  delivery: string;
  quantity: number;
  fileName: string | null;
  fileId: number | null;
  total: number;
  designFee: number;
};

function CheckoutModal({
  summary,
  serviceId,
  onClose,
}: {
  summary: Summary;
  serviceId: number | null;
  onClose: () => void;
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

  const trackLabel: Record<Track, string> = {
    template: "Шаблон из каталога",
    upload: "Загрузка готового макета",
    design: "Заказ дизайна",
  };

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
        product: "Флаер Евро 98×210, 130 г/м² мелованная",
        track: trackLabel[summary.track],
        mode: summary.mode,
        color: summary.color,
        sides: summary.sides,
        orientation: summary.orient,
        quantity: summary.quantity,
        lamination: summary.lamination,
        design_fee: summary.designFee,
        delivery: summary.delivery,
        file: summary.fileName || "—",
      };

      const fullComment = [
        `Флаеры (${trackLabel[summary.track]})`,
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
          quantity: 1,
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
              <p>{trackLabel[summary.track]} · Евро 98×210 · {summary.mode}</p>
              <p>{summary.sides} · {summary.orient} · {summary.quantity} шт.</p>
              {summary.lamination !== "Нет" && <p>Ламинация: {summary.lamination}</p>}
              {summary.designFee > 0 && <p>Разработка макета: от {summary.designFee} ₽</p>}
              <p>Доставка: {summary.delivery}</p>
              <p className="pt-1 font-semibold text-ink-900">Итого: {summary.total.toLocaleString("ru-RU")} ₽</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя *"
                className="input h-11" required
              />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон *"
                className="input h-11 tabular" required
              />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (для чека)"
                className="input h-11 sm:col-span-2"
              />
              <input
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder={summary.delivery === "Самовывоз" ? "Офис самовывоза (опц.)" : "Адрес доставки"}
                className="input h-11 sm:col-span-2"
              />
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий / пожелания к макету (опц.)"
                rows={3}
                className="input sm:col-span-2 py-2 resize-none"
              />
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
              <Link href="/legal/privacy" className="text-brand hover:underline">
                политикой обработки данных
              </Link>
            </p>
          </form>
        ) : (
          <div>
            <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-ink-900 text-center">
              Заказ принят
            </h3>
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
              <a
                href="tel:+79324759511"
                className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 border border-ink-200 text-ink-900 text-[13px] font-medium hover:bg-ink-50"
              >
                <Phone size={14} /> Позвонить
              </a>
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800"
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
