"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, LayoutTemplate } from "@/lib/icons";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  TemplateCatalogCard, DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Orientation = "По вертикали" | "По горизонтали";
type YesNo = "Да" | "Нет";
type Track = "template" | "upload" | "design";

const POCKET_SLUGS = ["карманные-календари", "карманный-календарь", "календари"];

const QTY_TIERS = [50] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [10, 25, 50];
const MIN_QTY = 1;
const MAX_QTY = 50;

const PRICE: Record<Tier, number> = { 50: 18 };

const LAMINATION_PER_UNIT = 10;
const ROUNDING_PER_UNIT = 2;
const DESIGN_FEE = 1000;

export default function PocketCalendarCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(POCKET_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [orientation, setOrientation] = useState<Orientation>("По вертикали");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [rounding, setRounding] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(50);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE, quantity);
    const printTotal = printUnit * quantity;
    const lamTotal = lamination === "Да" ? LAMINATION_PER_UNIT * quantity : 0;
    const roundTotal = rounding === "Да" ? ROUNDING_PER_UNIT * quantity : 0;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + roundTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamTotal, roundTotal, designTotal, deliveryTotal, grandTotal };
  }, [quantity, lamination, rounding, track, delivery]);

  const orderSummary = {
    productLabel: "Карманный календарь 70×100 мм, 4+4",
    lines: [
      `70×100 мм · ${orientation} · ${quantity} шт.`,
      lamination === "Да" ? "Ламинация" : null,
      rounding === "Да" ? "Скругление углов 5 мм" : null,
      track === "design" ? "Разработка макета дизайнером (1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      orientation, lamination, rounding,
      design_fee: calc.designTotal, delivery,
      file: uploadedFile?.name || "—",
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Карманные календари</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Размер 70×100 мм. Цветная двусторонняя печать (4+4), бумага 300 г/м². Цена тиража действует на 1 вид макета.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузить ваш макет" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 000 ₽" />
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
                    <p className="mt-3 text-[11px] text-ink-500">Двусторонний макет 70×100 мм с вылетами.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Карманные календари">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость нашего дизайна — <strong>1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p><strong className="text-ink-900">Формат:</strong> 70×100 мм, бумага 300 г/м², печать 4+4.</p>
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Ориентация" values={["По вертикали", "По горизонтали"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint="на цену не влияет" />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${LAMINATION_PER_UNIT} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Скругление углов" values={["Нет", "Да"]} value={rounding} onChange={(v) => setRounding(v as YesNo)} hint={rounding === "Да" ? `+${ROUNDING_PER_UNIT} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={MIN_QTY} max={MAX_QTY} step={5} />
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
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинация" hint={`${quantity} × ${LAMINATION_PER_UNIT} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.roundTotal > 0 && <BreakdownRow label="Скругление углов" hint={`${quantity} × ${ROUNDING_PER_UNIT} ₽`} value={`${fmt(calc.roundTotal)} ₽`} />}
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
