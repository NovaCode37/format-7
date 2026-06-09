"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, LayoutTemplate } from "lucide-react";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal,
  TemplateCatalogCard, DesignBriefCard, DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Density = "200 г/м²" | "250 г/м²" | "300 г/м²";
type Orientation = "Вертикальная" | "Горизонтальная";
type YesNo = "Да" | "Нет";
type Track = "template" | "upload" | "design";

const DIPLOMA_SLUGS = ["грамоты-и-дипломы", "грамоты", "дипломы", "грамоты-дипломы"];

const QTY_TIERS = [1, 10, 20, 50, 100] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [1, 10, 20, 50, 100];

const PRICE: Record<Density, Record<Tier, number>> = {
  "200 г/м²": { 1: 700, 10: 70, 20: 65, 50: 60, 100: 55 },
  "250 г/м²": { 1: 900, 10: 90, 20: 85, 50: 80, 100: 75 },
  "300 г/м²": { 1: 1100, 10: 110, 20: 105, 50: 100, 100: 95 },
};

const LAMINATION_PER_UNIT = 50;
const DESIGN_FEE = 1000;

export default function DiplomaCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(DIPLOMA_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [density, setDensity] = useState<Density>("250 г/м²");
  const [orientation, setOrientation] = useState<Orientation>("Вертикальная");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(20);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE[density], quantity);
    const printTotal = printUnit * quantity;
    const lamTotal = lamination === "Да" ? LAMINATION_PER_UNIT * quantity : 0;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamTotal, designTotal, deliveryTotal, grandTotal };
  }, [density, quantity, lamination, track, delivery]);

  const orderSummary = {
    productLabel: `Грамоты и дипломы А4, ${density}, 4+0`,
    lines: [
      `А4 · ${density} · ${orientation} · ${quantity} шт.`,
      lamination === "Да" ? "Ламинирование" : null,
      track === "design" ? "Разработка макета дизайнером (от 1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : track === "template" ? "Каталог шаблонов" : "Загрузка макета",
      density, orientation, lamination,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Грамоты и дипломы</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Грамоты, дипломы и благодарственные письма. Формат А4, полноцветная односторонняя печать.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TrackCard active={track === "template"} onClick={() => setTrack("template")} icon={<LayoutTemplate size={18} />} title="Каталог шаблонов" hint="Готовые макеты" />
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузить ваш макет" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка от 1 000 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              {track === "template" ? (
                <TemplateCatalogCard />
              ) : track === "design" ? (
                <DesignBriefCard product="Грамоты и дипломы">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость — <strong>от 1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              ) : (
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
                    <p className="mt-3 text-[11px] text-ink-500">Формат макета — А4 (210×297 мм) с вылетами.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p>Дизайнерская / мелованная бумага 200–300 г/м². Дополнительно — ламинирование плёнкой.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Материал для печати (плотность)" values={["200 г/м²", "250 г/м²", "300 г/м²"]} value={density} onChange={(v) => setDensity(v as Density)} />
              <PillsField label="Ориентация" values={["Вертикальная", "Горизонтальная"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint="на цену не влияет" />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинирование" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${LAMINATION_PER_UNIT} ₽/шт` : undefined} />
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
            <div className="sticky top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">Расчёт стоимости</p>
                <BreakdownRow label="Печать" hint={`${quantity} × ${fmt(calc.printUnit)} ₽`} value={`${fmt(calc.printTotal)} ₽`} />
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинирование" hint={`${quantity} × ${LAMINATION_PER_UNIT} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.designTotal > 0 && <BreakdownRow label="Разработка макета" hint="2 доработки в стоимости" value={`${fmt(calc.designTotal)} ₽`} />}
                <BreakdownRow label="Доставка" hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined} value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"} />
                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">{fmt(calc.grandTotal)}&nbsp;₽</p>
                </div>
                <button onClick={() => setCheckoutOpen(true)} className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors">Оформить заказ</button>
                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">После оформления менеджер проверит макет и пришлёт <strong>QR-код для оплаты</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && <CheckoutModal summary={orderSummary} serviceId={resolvedServiceId} onClose={() => setCheckoutOpen(false)} />}
    </section>
  );
}
