"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette } from "lucide-react";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Track = "upload" | "design";
type Orientation = "По горизонтали" | "По вертикали";
type YesNo = "Да" | "Нет";

const CALENDAR_SLUGS = ["плакатный-календарь", "календари"];

const QTY_TIERS = [1, 5, 10, 30, 50] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [1, 5, 10, 30, 50];

const PRICE: Record<"Нет" | "Да", Record<Tier, number>> = {
  "Нет": { 1: 300, 5: 285, 10: 270, 30: 245, 50: 230 },
  "Да":  { 1: 430, 5: 415, 10: 400, 30: 375, 50: 360 },
};

const DESIGN_FEE = 1000;

export default function CalendarCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(CALENDAR_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [orientation, setOrientation] = useState<Orientation>("По горизонтали");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(10);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE[lamination], quantity);
    const printTotal = printUnit * quantity;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, designTotal, deliveryTotal, grandTotal };
  }, [lamination, quantity, track, delivery]);

  const orderSummary = {
    productLabel: "Плакатный календарь А3, 200 г/м², 4+0",
    lines: [
      `А3 · ${orientation} · ${lamination === "Да" ? "с ламинацией" : "без ламинации"} · ${quantity} шт.`,
      track === "design" ? "Разработка макета дизайнером (1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      orientation, lamination,
      design_fee: calc.designTotal,
      delivery,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Плакатный календарь</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Формат А3 (297×420 мм), бумага 200 г/м². Полноцветная односторонняя печать.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузка макета" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 000 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              {track === "upload" ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${
                      uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`grid place-items-center w-11 h-11 rounded-lg ${uploadedFile ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                        {uploadedFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                      </span>
                      <div>
                        <p className="font-heading text-base font-bold text-ink-900">{uploadedFile ? "Макет загружен" : "Загрузить ваш макет"}</p>
                        <p className="text-[12px] text-ink-500">PDF, AI, CDR, PSD, TIFF, JPG</p>
                      </div>
                    </div>
                    {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                    <p className="mt-3 text-[11px] text-ink-500">Размер макета: 297×420 мм + 2 мм вылеты с каждой стороны.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Плакатный календарь">
                  <p className="text-[12px] text-ink-700 mb-1.5">Разработка макета нашим дизайнером — <strong>1 000 ₽</strong>. В стоимость включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p><strong className="text-ink-900">Формат:</strong> А3 (297×420 мм), бумага 200 г/м².</p>
                <p>Полноцветная односторонняя печать. Цена тиража действует на 1 вид макета.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField label="Ориентация" values={["По горизонтали", "По вертикали"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint="на цену не влияет" />

              <PillsField label="Ламинация" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? "цена по таблице с ламинацией" : undefined} />

              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={1} hint="Цена за штуку — по ближайшему нижнему тиражу прайса (1 / 5 / 10 / 30 / 50)." />
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

                <BreakdownRow label={`Печать${lamination === "Да" ? " (с лам.)" : ""}`} hint={`${quantity} × ${fmt(calc.printUnit)} ₽`} value={`${fmt(calc.printTotal)} ₽`} />
                {calc.designTotal > 0 && <BreakdownRow label="Разработка макета" hint="2 доработки в стоимости" value={`${fmt(calc.designTotal)} ₽`} />}
                <BreakdownRow label="Доставка" hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined} value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"} />

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">{fmt(calc.grandTotal)}&nbsp;₽</p>
                </div>

                <button onClick={() => setCheckoutOpen(true)} className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                  Оформить заказ
                </button>
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
