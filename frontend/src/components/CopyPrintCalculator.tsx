"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

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

const PAGE_PRICE: Record<Format, Record<PrintMode, Record<Density, [number, number, number, number, number, number]>>> = {
  "А4": {
    "1+0": { "80": [11, 10, 9, 8, 7, 6], "120": [20, 19, 18, 17, 16, 15], "160": [25, 24, 23, 22, 21, 20], "200": [30, 29, 28, 27, 26, 25], "250": [40, 39, 38, 37, 36, 35], "300": [55, 54, 53, 52, 51, 50] },
    "1+1": { "80": [22, 20, 18, 16, 14, 12], "120": [40, 38, 36, 34, 32, 30], "160": [50, 48, 46, 44, 42, 40], "200": [60, 58, 56, 54, 52, 50], "250": [80, 78, 76, 74, 72, 70], "300": [110, 108, 106, 104, 102, 100] },
    "4+0": { "80": [35, 32, 30, 27, 24, 20], "120": [45, 42, 40, 37, 34, 30], "160": [50, 47, 45, 42, 39, 35], "200": [60, 57, 55, 52, 49, 45], "250": [70, 67, 65, 62, 59, 55], "300": [85, 82, 80, 77, 74, 70] },
    "4+4": { "80": [70, 64, 60, 54, 48, 40], "120": [90, 84, 80, 74, 68, 60], "160": [100, 94, 90, 84, 78, 70], "200": [120, 114, 110, 104, 98, 90], "250": [140, 134, 130, 124, 118, 110], "300": [170, 164, 160, 154, 148, 140] },
  },
  "А3": {
    "1+0": { "80": [26, 24, 21, 18, 14, 10], "120": [58, 56, 53, 50, 47, 43], "160": [70, 66, 62, 59, 56, 52], "200": [85, 81, 77, 74, 71, 67], "250": [95, 91, 87, 84, 81, 77], "300": [110, 106, 102, 99, 96, 92] },
    "1+1": { "80": [52, 48, 42, 36, 28, 20], "120": [116, 112, 106, 100, 94, 86], "160": [140, 132, 124, 118, 112, 104], "200": [170, 162, 154, 148, 142, 134], "250": [190, 182, 174, 168, 162, 154], "300": [220, 212, 204, 198, 192, 184] },
    "4+0": { "80": [58, 55, 52, 48, 42, 32], "120": [80, 77, 74, 70, 64, 60], "160": [100, 97, 94, 90, 84, 80], "200": [120, 117, 114, 110, 104, 100], "250": [130, 127, 124, 120, 114, 110], "300": [145, 142, 139, 135, 129, 125] },
    "4+4": { "80": [116, 110, 104, 96, 84, 64], "120": [160, 154, 148, 140, 128, 120], "160": [200, 194, 188, 180, 168, 160], "200": [240, 234, 228, 220, 208, 200], "250": [260, 254, 248, 240, 228, 220], "300": [290, 284, 278, 270, 258, 250] },
  },
};

const BINDING_PRICE: Record<Binding, number> = {
  "Без брошюровки": 0,
  "Пластиковая пружина": 250,
  "Металлическая пружина": 200,
};
const BINDING_LIMIT: Record<Binding, number | null> = {
  "Без брошюровки": null,
  "Пластиковая пружина": 500,
  "Металлическая пружина": 120,
};

const LAMINATION_PRICE: Record<Lamination, number> = {
  "Нет": 0,
  "Да": 50,
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

  const calc = useMemo(() => {
    const mode = printMode(color, sides);
    const pagePrice = PAGE_PRICE[format][mode][density][pageTierIndex(quantity)];
    const printTotal = Math.round(pagePrice * quantity);

    const bindingUnit = BINDING_PRICE[binding] * (format === "А3" ? 1.4 : 1);
    const bindingTotal = binding === "Без брошюровки" ? 0 : Math.round(bindingUnit * bindingCopies);

    const laminationUnit = LAMINATION_PRICE[lamination] * (format === "А3" ? 2 : 1);
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
  }, [format, color, sides, density, quantity, binding, bindingCopies, lamination, laminationSheets, delivery]);

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
    format, color, sides, density, orientation,
    binding, bindingCopies,
    lamination, laminationSheets,
    delivery,
    quantity,
    fileName: uploadedFile?.name || null,
    fileId: uploadedFile?.id ?? null,
    total: calc.grandTotal,
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

type Summary = {
  format: string; color: string; sides: string; density: string;
  binding: string; bindingCopies: number;
  lamination: string; laminationSheets: number;
  delivery: string; quantity: number;
  fileName: string | null;
  fileId: number | null;
  total: number;
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
        format: summary.format,
        color: summary.color,
        sides: summary.sides,
        density: `${summary.density} г/м²`,
        pages: summary.quantity,
        binding: summary.binding,
        binding_copies: summary.binding !== "Без брошюровки" ? summary.bindingCopies : 0,
        lamination: summary.lamination,
        lamination_sheets: summary.lamination !== "Нет" ? summary.laminationSheets : 0,
        delivery: summary.delivery,
        file: summary.fileName || "—",
      };

      const fullComment = [
        `Копирование и печать документов`,
        `Итого: ${summary.total} ₽`,
        `Адрес: ${address || "—"}`,
        comment || "",
      ]
        .filter(Boolean)
        .join(" | ");

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
              <p>{summary.format} · {summary.color} · {summary.sides} · {summary.density} г/м² · {summary.quantity} стр.</p>
              {summary.binding !== "Без брошюровки" && <p>Брошюровка: {summary.binding} ×{summary.bindingCopies}</p>}
              {summary.lamination !== "Нет" && <p>Ламинация: {summary.lamination} ×{summary.laminationSheets}</p>}
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
                placeholder="Комментарий к заказу (опц.)"
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
