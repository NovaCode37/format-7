"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Info } from "@/lib/icons";
import {
  PillsField, QuantityField, BreakdownRow, CheckoutModal,
  DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Format = "А4 (210×297 мм)" | "А3 (297×420 мм)";
type Orientation = "Горизонтальная" | "Вертикальная";
type SpringColor = "Белый" | "Золотистый" | "Чёрный";
type YesNo = "Да" | "Нет";

const FLIP_SLUGS = ["перекидной-календарь", "настенный-перекидной-календарь", "перекидные-календари", "календари"];

const QTY_TIERS = [1, 5, 10] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [1, 5, 10];

const PRICE: Record<Format, Record<Tier, number>> = {
  "А4 (210×297 мм)": { 1: 1400, 5: 1200, 10: 730 },
  "А3 (297×420 мм)": { 1: 1600, 5: 1400, 10: 1250 },
};

const LAMINATION_BY_FORMAT: Record<Format, number> = {
  "А4 (210×297 мм)": 50,
  "А3 (297×420 мм)": 100,
};

export default function FlipCalendarCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(FLIP_SLUGS, serviceId);

  const [format, setFormat] = useState<Format>("А3 (297×420 мм)");
  const [orientation, setOrientation] = useState<Orientation>("Вертикальная");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [springColor, setSpringColor] = useState<SpringColor>("Белый");
  const [quantity, setQuantity] = useState<number>(5);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE[format], quantity);
    const printTotal = printUnit * quantity;
    const lamUnit = LAMINATION_BY_FORMAT[format];
    const lamTotal = lamination === "Да" ? lamUnit * quantity : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + deliveryTotal;
    return { printUnit, printTotal, lamUnit, lamTotal, deliveryTotal, grandTotal };
  }, [format, quantity, lamination, delivery]);

  const isA3 = format.startsWith("А3");

  const orderSummary = {
    productLabel: `Перекидной настенный календарь ${format}, 4+0`,
    lines: [
      `${format} · ${orientation} · пружина ${springColor.toLowerCase()} · ${quantity} шт.`,
      lamination === "Да" ? "Ламинация подложки" : null,
      isA3 ? "А3: скрепление пружиной только по короткому краю" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      format, orientation, spring_color: springColor, lamination,
      delivery, file: uploadedFile?.name || "—",
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Перекидной настенный календарь</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Цветная односторонняя печать. Обложка и подложка 300 г/м², блок — бумага 120–170 г/м².
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              <button onClick={() => fileInputRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`grid place-items-center w-11 h-11 rounded-lg ${uploadedFile ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                    {uploadedFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                  </span>
                  <div>
                    <p className="font-heading text-base font-bold text-ink-900">{uploadedFile ? "Макет загружен" : "Загрузить ваш макет"}</p>
                    <p className="text-[12px] text-ink-500">PDF, AI, CDR, PSD, TIFF</p>
                  </div>
                </div>
                {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                <p className="mt-3 text-[11px] text-ink-500">Обложка, подложка и 12 листов блока.</p>
              </button>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-start gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Скрепление на металлическую белую пружину + ригель для подвеса.</p>
                <p>Блок — мелованная бумага 120 г/м² матовая или 170 г/м² глянцевая.</p>
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Формат" values={["А4 (210×297 мм)", "А3 (297×420 мм)"]} value={format} onChange={(v) => setFormat(v as Format)} />
              <PillsField label="Ориентация" values={["Горизонтальная", "Вертикальная"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint={isA3 ? "А3 — пружина по короткому краю" : "на цену не влияет"} />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация подложки" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${calc.lamUnit} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Цвет пружины" values={["Белый", "Золотистый", "Чёрный"]} value={springColor} onChange={(v) => setSpringColor(v as SpringColor)} hint="на цену не влияет" />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={1} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Доставка" values={DELIVERY_VALUES} value={delivery} onChange={(v) => setDelivery(v as Delivery)} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">Расчёт стоимости</p>
                <BreakdownRow label="Печать" hint={`${quantity} × ${fmt(calc.printUnit)} ₽`} value={`${fmt(calc.printTotal)} ₽`} />
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинация подложки" hint={`${quantity} × ${calc.lamUnit} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                <BreakdownRow label="Доставка" hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined} value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"} />
                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">{fmt(calc.grandTotal)}&nbsp;₽</p>
                </div>
                <button onClick={() => setCheckoutOpen(true)} className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors">Оформить заказ</button>
                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">После оформления менеджер проверит макет и свяжется для подтверждения и оплаты.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && <CheckoutModal summary={orderSummary} serviceId={resolvedServiceId} onClose={() => setCheckoutOpen(false)} />}
    </section>
  );
}
