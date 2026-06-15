"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, LayoutTemplate } from "@/lib/icons";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  TemplateCatalogCard, DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Format = "А7 (74×105 мм)" | "А6 (105×148 мм)" | "А5 (148×210 мм)" | "А4 (210×297 мм)" | "А3 (297×420 мм)";
type Orientation = "Горизонтальная" | "Вертикальная";
type Material = "80" | "170";
type Color = "Цветная" | "Чёрно-белая";
type Sides = "Односторонняя" | "Двусторонняя";
type YesNo = "Да" | "Нет";
type Mode = "4+0" | "4+4" | "1+0" | "1+1";
type Track = "template" | "upload" | "design";

const LEAFLET_SLUGS = ["листовки", "листовка"];

const QTY_TIERS = [100, 200, 500, 1000] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [100, 200, 500, 1000];
const MIN_QTY = 100;

const PRICE: Record<Format, Record<Mode, Record<Tier, number>>> = {
  "А7 (74×105 мм)": {
    "4+0": { 100: 10, 200: 8, 500: 7, 1000: 5 },
    "4+4": { 100: 16, 200: 14, 500: 10, 1000: 7 },
    "1+0": { 100: 7, 200: 6, 500: 5, 1000: 4 },
    "1+1": { 100: 11, 200: 10, 500: 8, 1000: 6 },
  },
  "А6 (105×148 мм)": {
    "4+0": { 100: 15, 200: 13, 500: 9, 1000: 8 },
    "4+4": { 100: 25, 200: 20, 500: 13, 1000: 10 },
    "1+0": { 100: 9, 200: 8, 500: 6, 1000: 5 },
    "1+1": { 100: 13, 200: 12, 500: 10, 1000: 7 },
  },
  "А5 (148×210 мм)": {
    "4+0": { 100: 25, 200: 18, 500: 15, 1000: 13 },
    "4+4": { 100: 35, 200: 23, 500: 21, 1000: 20 },
    "1+0": { 100: 12, 200: 11, 500: 9, 1000: 7 },
    "1+1": { 100: 16, 200: 15, 500: 13, 1000: 11 },
  },
  "А4 (210×297 мм)": {
    "4+0": { 100: 35, 200: 32, 500: 25, 1000: 16 },
    "4+4": { 100: 60, 200: 55, 500: 36, 1000: 30 },
    "1+0": { 100: 17, 200: 16, 500: 14, 1000: 12 },
    "1+1": { 100: 24, 200: 23, 500: 21, 1000: 19 },
  },
  "А3 (297×420 мм)": {
    "4+0": { 100: 100, 200: 90, 500: 80, 1000: 70 },
    "4+4": { 100: 170, 200: 160, 500: 140, 1000: 120 },
    "1+0": { 100: 26, 200: 24, 500: 22, 1000: 20 },
    "1+1": { 100: 36, 200: 34, 500: 32, 1000: 30 },
  },
};

const LAMINATION_BY_FORMAT: Record<Format, number> = {
  "А7 (74×105 мм)": 10,
  "А6 (105×148 мм)": 15,
  "А5 (148×210 мм)": 25,
  "А4 (210×297 мм)": 50,
  "А3 (297×420 мм)": 100,
};
const ROUNDING_PER_UNIT = 2;
const DESIGN_FEE = 1500;

function modeKey(color: Color, sides: Sides): Mode {
  const isColor = color === "Цветная";
  const isDouble = sides === "Двусторонняя";
  if (isColor && isDouble) return "4+4";
  if (isColor && !isDouble) return "4+0";
  if (!isColor && isDouble) return "1+1";
  return "1+0";
}

export default function LeafletCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(LEAFLET_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [format, setFormat] = useState<Format>("А5 (148×210 мм)");
  const [orientation, setOrientation] = useState<Orientation>("Вертикальная");
  const [color, setColor] = useState<Color>("Цветная");
  const [sides, setSides] = useState<Sides>("Двусторонняя");
  const [rounding, setRounding] = useState<YesNo>("Нет");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(500);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const mode = useMemo(() => modeKey(color, sides), [color, sides]);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE[format][mode], quantity);
    const printTotal = printUnit * quantity;
    const lamUnit = LAMINATION_BY_FORMAT[format];
    const lamTotal = lamination === "Да" ? lamUnit * quantity : 0;
    const roundTotal = rounding === "Да" ? ROUNDING_PER_UNIT * quantity : 0;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + roundTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamUnit, lamTotal, roundTotal, designTotal, deliveryTotal, grandTotal };
  }, [format, mode, quantity, lamination, rounding, track, delivery]);

  const orderSummary = {
    productLabel: "Листовки",
    lines: [
      `${format} · ${orientation} · ${color} · ${sides} (${mode}) · ${quantity} шт.`,
      "Бумага: глянцевая 170 г/м²",
      rounding === "Да" ? "Скругление углов" : null,
      lamination === "Да" ? "Ламинация" : null,
      track === "design" ? "Разработка макета дизайнером (1500 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      format, orientation, color, sides, mode, rounding, lamination,
      design_fee: calc.designTotal, delivery, file: uploadedFile?.name || "—",
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Листовки</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Цена тиража действует на 1 вид макета. Размер готового изделия может отличаться от стандартного на ±2 мм.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузить ваш макет" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 500 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              {track === "template" ? (
                <TemplateCatalogCard />
              ) : track === "upload" ? (
                <>
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
                    <p className="mt-3 text-[11px] text-ink-500">Печать на глянцевой бумаге плотностью 170 г/м². Размер изделия может отличаться от стандарта на ±2 мм.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Листовки">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость — <strong>1 500 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Формат" values={["А7 (74×105 мм)", "А6 (105×148 мм)", "А5 (148×210 мм)", "А4 (210×297 мм)", "А3 (297×420 мм)"]} value={format} onChange={(v) => setFormat(v as Format)} />
              <PillsField label="Ориентация" values={["Горизонтальная", "Вертикальная"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint="на цену не влияет" />
              <PillsField label="Цветность" values={["Цветная", "Чёрно-белая"]} value={color} onChange={(v) => setColor(v as Color)} />
              <PillsField label="Стороны печати" values={["Двусторонняя", "Односторонняя"]} value={sides} onChange={(v) => setSides(v as Sides)} hint={`режим ${mode}`} />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Скругление углов" values={["Нет", "Да"]} value={rounding} onChange={(v) => setRounding(v as YesNo)} hint={rounding === "Да" ? `+${ROUNDING_PER_UNIT} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${calc.lamUnit} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={MIN_QTY} step={50} />
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
                <BreakdownRow label={`Печать ${mode}`} hint={`${quantity} × ${fmt(calc.printUnit)} ₽`} value={`${fmt(calc.printTotal)} ₽`} />
                {calc.roundTotal > 0 && <BreakdownRow label="Скругление углов" hint={`${quantity} × ${ROUNDING_PER_UNIT} ₽`} value={`${fmt(calc.roundTotal)} ₽`} />}
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинация" hint={`${quantity} × ${calc.lamUnit} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.designTotal > 0 && <BreakdownRow label="Разработка макета" hint="2 доработки в стоимости" value={`${fmt(calc.designTotal)} ₽`} />}
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
