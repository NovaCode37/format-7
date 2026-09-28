"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, Info } from "@/lib/icons";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload, usePricing,
  ConfigurableField, quantityPresets,
} from "./calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

type Format = "А6 (105×148 мм)" | "А5 (148×210 мм)" | "А4 (210×297 мм)";
type Sides = "Односторонняя" | "Двусторонняя";
type BlockColor = "Без печати" | "Чёрно-белая" | "Цветная";
type Sheets = "30 листов" | "50 листов";
type YesNo = "Да" | "Нет";
type Track = "upload" | "design";

const NOTEBOOK_SLUGS = ["блокноты", "блокнот"];

const NOTEBOOK_PRICING = PRICING_DEFAULTS["блокноты"].data;
const QTY_PRESETS = [1, 10, 20, 30, 50, 100];

const QTY_TIERS_BY_FORMAT: Record<Format, readonly number[]> = {
  "А6 (105×148 мм)": [4, 10, 20, 30, 50, 100],
  "А5 (148×210 мм)": [2, 10, 20, 30, 50, 100],
  "А4 (210×297 мм)": [1, 10, 20, 30, 50, 100],
};

function blockModeKey(color: BlockColor, sides: Sides): string {
  if (color === "Без печати") return "Без печати";
  const isColor = color === "Цветная";
  const isDouble = sides === "Двусторонняя";
  if (isColor && isDouble) return "4:4";
  if (isColor && !isDouble) return "4:0";
  if (!isColor && isDouble) return "1:1";
  return "1:0";
}

export default function NotebookCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(NOTEBOOK_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [format, setFormat] = useState<Format>("А5 (148×210 мм)");
  const [coverSides, setCoverSides] = useState<Sides>("Двусторонняя");
  const [blockColor, setBlockColor] = useState<BlockColor>("Без печати");
  const [blockSides, setBlockSides] = useState<Sides>("Двусторонняя");
  const [sheets, setSheets] = useState<Sheets>("50 листов");
  const [rounding, setRounding] = useState<YesNo>("Нет");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [paperFinish, setPaperFinish] = useState<"Матовая" | "Глянцевая">("Матовая");
  const [quantity, setQuantity] = useState<number>(10);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const pricing = usePricing("блокноты", NOTEBOOK_PRICING);

  const calc = useMemo(() => {
    const coverKey = coverSides === "Двусторонняя" ? "4:4" : "4:0";
    const sheetsKey = sheets === "50 листов" ? "50" : "30";
    const blockKey = blockModeKey(blockColor, blockSides);
    const table = (pricing.price as any)[format][coverKey][sheetsKey][blockKey];
    const printUnit = tierValue(QTY_TIERS_BY_FORMAT[format], table, quantity);
    const printTotal = printUnit * quantity;
    const lamUnit = (pricing.lamination as any)[format];
    const lamTotal = lamination === "Да" ? lamUnit * quantity : 0;
    const roundTotal = rounding === "Да" ? pricing.rounding * quantity : 0;
    const designTotal = track === "design" ? pricing.design : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + roundTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamUnit, lamTotal, roundTotal, designTotal, deliveryTotal, grandTotal };
  }, [format, coverSides, sheets, blockColor, blockSides, quantity, lamination, rounding, track, delivery, pricing]);

  const blockSidesLine = blockColor !== "Без печати" ? ` · блок: ${blockSides.toLowerCase()}` : "";
  const roundingLine = rounding === "Да" ? " · скругление углов" : "";

  const orderSummary = {
    productLabel: `Блокнот ${format}, блок ${blockColor.toLowerCase()}`,
    lines: [
      `${format} · блок ${blockColor} · ${sheets} · ${quantity} шт.`,
      `Обложка: ${coverSides.toLowerCase()}${blockSidesLine}${roundingLine}`,
      `Бумага обложки: ${paperFinish.toLowerCase()}`,
      lamination === "Да" ? "Ламинация обложки и подложки" : null,
      track === "design" ? `Разработка макета дизайнером (${pricing.design} ₽)` : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      format, cover_sides: coverSides, block_color: blockColor, block_sides: blockSides,
      sheets, rounding, paper_finish: paperFinish, lamination,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Блокноты</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Полноцветная печать обложки и подложки. Обложка/подложка — картон 300 г/м², блок — бумага 80 г/м².
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузка макета" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 000 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              {track === "upload" ? (
                <>
                  <button onClick={() => fileInputRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`grid place-items-center w-11 h-11 rounded-lg ${uploadedFile ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                        {uploadedFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                      </span>
                      <div>
                        <p className="font-heading text-base font-bold text-ink-900">{uploadedFile ? "Макет загружен" : "Загрузить ваш макет"}</p>
                        <p className="text-[12px] text-ink-500">PDF, CDR</p>
                      </div>
                    </div>
                    {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                    <p className="mt-3 text-[11px] text-ink-500">Обложка, подложка и блок.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.cdr" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Блокноты">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость — <strong>1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-start gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Скрепление — металлическая пружина. Цена блока 4+0 — за заливку менее 50%; при большей заливке +100%.</p>
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <ConfigurableField id="format" pricing={pricing} value={format} onChange={(v) => setFormat(v as Format)} />
              <ConfigurableField id="blockColor" pricing={pricing} value={blockColor} onChange={(v) => setBlockColor(v as BlockColor)} />
              <ConfigurableField id="coverSides" pricing={pricing} value={coverSides} onChange={(v) => setCoverSides(v as Sides)} />
              {blockColor !== "Без печати" && (
                <ConfigurableField id="blockSides" pricing={pricing} value={blockSides} onChange={(v) => setBlockSides(v as Sides)} />
              )}
              <ConfigurableField id="sheets" pricing={pricing} value={sheets} onChange={(v) => setSheets(v as Sheets)} />
              <ConfigurableField id="rounding" pricing={pricing} value={rounding} onChange={(v) => setRounding(v as YesNo)} hint={rounding === "Да" ? `+${pricing.rounding} ₽/шт` : undefined} />

              <ConfigurableField id="paperFinish" pricing={pricing} value={paperFinish} onChange={(v) => setPaperFinish(v as any)} hint="на цену не влияет" />

              <div className="pt-4 border-t border-ink-100">
                <ConfigurableField id="lamination" pricing={pricing} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${calc.lamUnit} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={quantityPresets(pricing, "quantity", QTY_PRESETS)} value={quantity} onChange={setQuantity} min={1} />
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
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинация" hint={`${quantity} × ${calc.lamUnit} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.roundTotal > 0 && <BreakdownRow label="Скругление углов" hint={`${quantity} × ${pricing.rounding} ₽`} value={`${fmt(calc.roundTotal)} ₽`} />}
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
