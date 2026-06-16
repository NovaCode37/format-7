"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, Info } from "@/lib/icons";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, useResolvedServiceId, useUpload, usePricing,
} from "./calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

type AdField = "Без полей" | "1 рекламное поле" | "3 рекламных поля";
type Cursor = "Пластиковый" | "Статический" | "Магнитный";
type PiccoloColor = "Золото" | "Серебро" | "Чёрный";
type SpringColor = "Белый" | "Чёрный";
type YesNo = "Да" | "Нет";
type Track = "upload" | "design";

const QUARTERLY_SLUGS = ["квартальный-календарь", "квартальные-календари", "календари"];

const QUARTERLY_PRICING = PRICING_DEFAULTS["квартальный-календарь"].data;
const QTY_PRESETS = [1, 5, 10, 25, 50];

export default function QuarterlyCalendarCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(QUARTERLY_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [adField, setAdField] = useState<AdField>("Без полей");
  const [cursor, setCursor] = useState<Cursor>("Пластиковый");
  const [piccolo, setPiccolo] = useState<PiccoloColor>("Золото");
  const [lamPoster, setLamPoster] = useState<YesNo>("Нет");
  const [lamBlock, setLamBlock] = useState<YesNo>("Нет");
  const [springColor, setSpringColor] = useState<SpringColor>("Белый");
  const [quantity, setQuantity] = useState<number>(10);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const pricing = usePricing("квартальный-календарь", QUARTERLY_PRICING);

  const calc = useMemo(() => {
    const printUnit = (pricing.price as any)[adField];
    const printTotal = printUnit * quantity;
    const lamPosterTotal = lamPoster === "Да" ? pricing.lamPoster * quantity : 0;
    const lamBlockTotal = lamBlock === "Да" ? pricing.lamBlock * quantity : 0;
    const designTotal = track === "design" ? pricing.design : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamPosterTotal + lamBlockTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamPosterTotal, lamBlockTotal, designTotal, deliveryTotal, grandTotal };
  }, [adField, quantity, lamPoster, lamBlock, track, delivery, pricing]);

  const orderSummary = {
    productLabel: `Квартальный календарь А4, ${adField.toLowerCase()}`,
    lines: [
      `А4 · ${adField} · ${quantity} шт.`,
      `Курсор: ${cursor.toLowerCase()} · пиколло ${piccolo.toLowerCase()} · пружина ${springColor.toLowerCase()}`,
      lamPoster === "Да" ? "Ламинация постера и подложек блоков" : null,
      lamBlock === "Да" ? "Ламинация листов блоков" : null,
      track === "design" ? "Разработка макета дизайнером (1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      ad_field: adField, cursor, piccolo_color: piccolo, spring_color: springColor,
      lamination_poster: lamPoster, lamination_block: lamBlock,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Квартальный календарь</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Размер А4, постер 210×297 мм. Полноцветная односторонняя печать постера и подложек блоков.
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
                        <p className="text-[12px] text-ink-500">PDF, AI, CDR, PSD, TIFF</p>
                      </div>
                    </div>
                    {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                    <p className="mt-3 text-[11px] text-ink-500">Рекламное поле постера 290×200 мм, нижнее — 50 мм.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Квартальный календарь">
                  <p className="text-[12px] text-ink-700 mb-1.5">Изготовление макета нашим дизайнером — <strong>1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-start gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Постер и подложки — картон 250 г/м², блоки — бумага 80–90 г/м². Скрепление на 3 пружины.</p>
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Рекламное поле" values={["Без полей", "1 рекламное поле", "3 рекламных поля"]} value={adField} onChange={(v) => setAdField(v as AdField)} />
              <PillsField label="Курсор" values={["Пластиковый", "Статический", "Магнитный"]} value={cursor} onChange={(v) => setCursor(v as Cursor)} hint="входит в стоимость" />
              <PillsField label="Цвет пиколло (поверх)" values={["Золото", "Серебро", "Чёрный"]} value={piccolo} onChange={(v) => setPiccolo(v as PiccoloColor)} hint="на цену не влияет" />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация постера и подложек блоков" values={["Нет", "Да"]} value={lamPoster} onChange={(v) => setLamPoster(v as YesNo)} hint={lamPoster === "Да" ? `+${pricing.lamPoster} ₽/шт (А4)` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация листов блоков" values={["Нет", "Да"]} value={lamBlock} onChange={(v) => setLamBlock(v as YesNo)} hint={lamBlock === "Да" ? `+${pricing.lamBlock} ₽/шт (А5)` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Цвет пружины" values={["Белый", "Чёрный"]} value={springColor} onChange={(v) => setSpringColor(v as SpringColor)} hint="на цену не влияет" />
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
                {calc.lamPosterTotal > 0 && <BreakdownRow label="Ламинация постера" hint={`${quantity} × ${pricing.lamPoster} ₽`} value={`${fmt(calc.lamPosterTotal)} ₽`} />}
                {calc.lamBlockTotal > 0 && <BreakdownRow label="Ламинация блоков" hint={`${quantity} × ${pricing.lamBlock} ₽`} value={`${fmt(calc.lamBlockTotal)} ₽`} />}
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
