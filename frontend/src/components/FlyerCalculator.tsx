"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone, LayoutTemplate, Palette,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";
import { DesignBriefCard, CheckoutModal, usePricing } from "./calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

type Track = "template" | "upload" | "design";
type Color = "Цветная" | "Чёрно-белая";
type Sides = "Двусторонняя" | "Односторонняя";
type Orient = "Вертикальная" | "Горизонтальная";
type Lamination = "Нет" | "Да";
type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";

const FLYER_SLUG = "флаеры";

const PRINT_TIERS = [100, 200, 500, 1000] as const;
type Tier = (typeof PRINT_TIERS)[number];

const FLYER_PRICING = PRICING_DEFAULTS["флаеры"].data;

const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

const MIN_QTY = 100;
const QTY_PRESETS = [100, 200, 500, 1000];

function unitPrintPrice(pricing: any, mode: "4+4" | "4+0" | "1+1" | "1+0", qty: number): number {
  const tierKey =
    qty >= 1000 ? "1000" :
    qty >= 500  ? "500"  :
    qty >= 200  ? "200"  : "100";
  return pricing.print[mode][tierKey];
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

  const pricing = usePricing("флаеры", FLYER_PRICING);

  const calc = useMemo(() => {
    const mode = modeKey(color, sides);
    const printUnit = unitPrintPrice(pricing, mode, quantity);
    const printTotal = printUnit * quantity;

    const laminationUnit = lamination === "Да" ? pricing.lamination : 0;
    const laminationTotal = laminationUnit * quantity;

    const designTotal = track === "design" ? pricing.design : 0;

    const deliveryTotal = DELIVERY_PRICE[delivery];

    const grandTotal = printTotal + laminationTotal + designTotal + deliveryTotal;

    return {
      mode, printUnit, printTotal,
      laminationUnit, laminationTotal,
      designTotal,
      deliveryTotal,
      grandTotal,
    };
  }, [color, sides, quantity, lamination, delivery, track, pricing]);

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

  const trackLabel: Record<Track, string> = {
    template: "Шаблон из каталога",
    upload: "Загрузка готового макета",
    design: "Заказ дизайна",
  };

  const orderSummary = {
    productLabel: "Флаеры",
    lines: [
      `Евро 98×210 · ${calc.mode} · ${quantity} шт.`,
      `${sides} · ${orient}`,
      `Макет: ${trackLabel[track]}`,
      lamination !== "Нет" ? `Ламинация: ${lamination}` : null,
      calc.designTotal > 0 ? `Разработка макета: от ${calc.designTotal} ₽` : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      Макет: trackLabel[track],
      Формат: "Евро 98×210",
      Режим: calc.mode,
      Цветность: color,
      Стороны: sides,
      Ориентация: orient,
      Ламинация: lamination,
      Бумага: "130 г/м² мелованная",
      Файл: uploadedFile?.name || "—",
    },
    delivery,
    quantity,
    total: calc.grandTotal,
    fileId: uploadedFile?.id ?? null,
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
            <div className="lg:sticky lg:top-24 space-y-3">
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
            <div className="lg:sticky lg:top-24 space-y-3">
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
