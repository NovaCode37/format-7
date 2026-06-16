"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";
import { CheckoutModal, usePricing } from "./calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

type Format = "А4" | "А3";
type Color = "Ч/Б" | "Цветная";
type Sides = "Односторонняя" | "Двусторонняя";
type Density = "80" | "120" | "160" | "200" | "250" | "300";
type Binding = "Без брошюровки" | "Пластиковая пружина" | "Металлическая пружина";
type Lamination = "Нет" | "Да";
type Orientation = "По вертикали" | "По горизонтали";
type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";

type PrintMode = "1+0" | "1+1" | "4+0" | "4+4";

function pageTierIndex(pages: number): number {
  if (pages <= 10) return 0;
  if (pages <= 50) return 1;
  if (pages <= 100) return 2;
  if (pages <= 300) return 3;
  if (pages <= 500) return 4;
  return 5;
}

function printMode(color: Color, sides: Sides): PrintMode {
  const isColor = color === "Цветная";
  const isDouble = sides === "Двусторонняя";
  if (isColor && isDouble) return "4+4";
  if (isColor) return "4+0";
  if (isDouble) return "1+1";
  return "1+0";
}

const COPYPRINT_PRICING = PRICING_DEFAULTS["копирование-и-печать-документов"].data;

const BINDING_LIMIT: Record<Binding, number | null> = {
  "Без брошюровки": null,
  "Пластиковая пружина": 500,
  "Металлическая пружина": 120,
};

const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

const QTY_PRESETS = [10, 25, 50, 100, 250, 500];

export default function CopyPrintCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<Format>("А4");
  const [color, setColor] = useState<Color>("Цветная");
  const [sides, setSides] = useState<Sides>("Двусторонняя");
  const [density, setDensity] = useState<Density>("80");
  const [binding, setBinding] = useState<Binding>("Без брошюровки");
  const [bindingCopies, setBindingCopies] = useState(1);
  const [lamination, setLamination] = useState<Lamination>("Нет");
  const [laminationSheets, setLaminationSheets] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("По вертикали");
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");

  const [quantity, setQuantity] = useState(50);
  const [qtyInput, setQtyInput] = useState("50");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: number | null } | null>(null);
  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (serviceId) {
      setResolvedServiceId(serviceId);
      return;
    }
    let mounted = true;
    api
      .getServices()
      .then((services) => {
        if (!mounted) return;
        const target = services.find((s) => s.slug.toLowerCase() === "копирование-и-печать-документов");
        setResolvedServiceId(target?.id ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setResolvedServiceId(null);
      });
    return () => {
      mounted = false;
    };
  }, [serviceId]);

  const pricing = usePricing("копирование-и-печать-документов", COPYPRINT_PRICING);

  const calc = useMemo(() => {
    const mode = printMode(color, sides);
    const pagePrice = (pricing.page as any)[format][mode][density][pageTierIndex(quantity)];
    const printTotal = Math.round(pagePrice * quantity);

    const bindingBase = (pricing.binding as any)[binding] || 0;
    const bindingUnit = bindingBase * (format === "А3" ? 1.4 : 1);
    const bindingTotal = binding === "Без брошюровки" ? 0 : Math.round(bindingUnit * bindingCopies);

    const laminationUnit = (lamination === "Да" ? pricing.lamination : 0) * (format === "А3" ? 2 : 1);
    const laminationTotal =
      lamination === "Нет" ? 0 : Math.round(laminationUnit * laminationSheets);

    const deliveryTotal = DELIVERY_PRICE[delivery];

    const grandTotal = Math.round(printTotal + bindingTotal + laminationTotal + deliveryTotal);

    return {
      pagePrice,
      printTotal,
      bindingUnit: Math.round(bindingUnit),
      bindingTotal,
      laminationUnit: Math.round(laminationUnit),
      laminationTotal,
      deliveryTotal,
      grandTotal,
    };
  }, [format, color, sides, density, quantity, binding, bindingCopies, lamination, laminationSheets, delivery, pricing]);

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
    productLabel: "Копирование и печать документов",
    lines: [
      `${format} · ${color} · ${sides} · ${density} г/м² · ${quantity} стр.`,
      binding !== "Без брошюровки" ? `Брошюровка: ${binding} ×${bindingCopies}` : null,
      lamination !== "Нет" ? `Ламинация: ${lamination} ×${laminationSheets}` : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      Формат: format,
      Цветность: color,
      Стороны: sides,
      Плотность: `${density} г/м²`,
      Ориентация: orientation,
      Брошюровка: binding !== "Без брошюровки" ? `${binding} ×${bindingCopies}` : "Нет",
      Ламинация: lamination !== "Нет" ? `${lamination} ×${laminationSheets}` : "Нет",
      Страниц: quantity,
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
            Копирование и печать документов
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Загрузите макет, выберите параметры и сразу получите стоимость
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
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
                      PDF, JPG, PNG, DOCX, AI, CDR
                    </p>
                  </div>
                </div>
                {uploadedFile && (
                  <p className="mt-2 text-[12px] text-emerald-700 break-all">
                    {uploadedFile.name}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-ink-500">
                  Файл будет передан менеджеру вместе с заказом
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.ai,.cdr,.eps,.tiff,.psd"
                onChange={(e) => handleUpload(e.target.files)}
              />

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p><strong className="text-ink-900">Примечание:</strong> Формат А3 — брошюровка по короткой стороне.</p>
                <p>В стоимость брошюровки включены прозрачная обложка и подложка.</p>
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
                label="Формат"
                values={["А4", "А3"]}
                value={format}
                onChange={(v) => setFormat(v as Format)}
              />

              <PillsField
                label="Цветность печати"
                values={["Цветная", "Ч/Б"]}
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
                label="Ориентация печати"
                values={["По вертикали", "По горизонтали"]}
                value={orientation}
                onChange={(v) => setOrientation(v as Orientation)}
                hint="на цену не влияет"
              />

              <PillsField
                label="Плотность бумаги, г/м²"
                values={["80", "120", "160", "200", "250", "300"]}
                value={density}
                onChange={(v) => setDensity(v as Density)}
              />

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Брошюровка"
                  values={["Нет", "Да"]}
                  value={binding === "Без брошюровки" ? "Нет" : "Да"}
                  onChange={(v) => {
                    if (v === "Нет") setBinding("Без брошюровки");
                    else setBinding("Пластиковая пружина");
                  }}
                />
                {binding !== "Без брошюровки" && (
                  <>
                    <div className="mt-3">
                      <PillsField
                        label="Тип пружины"
                        values={["Пластиковая пружина", "Металлическая пружина"]}
                        value={binding}
                        onChange={(v) => setBinding(v as Binding)}
                        hint={BINDING_LIMIT[binding] ? `до ${BINDING_LIMIT[binding]} листов` : undefined}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                        Количество экземпляров (брошюр)
                      </label>
                      <NumberStepper value={bindingCopies} setValue={setBindingCopies} min={1} />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Ламинирование"
                  values={["Нет", "Да"]}
                  value={lamination}
                  onChange={(v) => setLamination(v as Lamination)}
                />
                {lamination !== "Нет" && (
                  <div className="mt-3">
                    <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                      Количество листов на ламинацию
                    </label>
                    <NumberStepper value={laminationSheets} setValue={setLaminationSheets} min={1} />
                  </div>
                )}
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
                  Количество страниц
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
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">
                  Расчёт стоимости
                </p>

                <BreakdownRow
                  label="Печать"
                  hint={`${quantity} × ${fmt(calc.pagePrice)} ₽`}
                  value={`${fmt(calc.printTotal)} ₽`}
                />
                {binding !== "Без брошюровки" && (
                  <BreakdownRow
                    label="Брошюровка"
                    hint={`${bindingCopies} × ${fmt(calc.bindingUnit)} ₽`}
                    value={`${fmt(calc.bindingTotal)} ₽`}
                  />
                )}
                {lamination !== "Нет" && (
                  <BreakdownRow
                    label="Ламинирование"
                    hint={`${laminationSheets} × ${fmt(calc.laminationUnit)} ₽`}
                    value={`${fmt(calc.laminationTotal)} ₽`}
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
      <p className="text-[13px] font-semibold text-ink-900 tabular whitespace-nowrap">{value}</p>
    </div>
  );
}
