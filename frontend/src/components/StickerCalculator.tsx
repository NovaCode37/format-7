"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Info, Palette, LayoutTemplate } from "lucide-react";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  TemplateCatalogCard, DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, useResolvedServiceId, useUpload,
} from "./calc/kit";
import {
  STICKER_PRICES, STICKER_SHAPES, STICKER_SHEET_TIERS,
  type StickerMaterial, type StickerFinish, type StickerShape,
} from "@/lib/stickerPrices";

type YesNo = "Да" | "Нет";
type Track = "template" | "upload" | "design";

const STICKER_SLUGS = ["наклейки", "наклейки-и-стикеры", "стикеры", "оперативная-полиграфия"];

const SHEET_PRESETS = [...STICKER_SHEET_TIERS];
const LAMINATION_PER_SHEET = 100;
const DESIGN_FEE = 1000;

function tierIndex(sheets: number): number {
  let idx = 0;
  STICKER_SHEET_TIERS.forEach((t, i) => { if (sheets >= t) idx = i; });
  return idx;
}

export default function StickerCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(STICKER_SLUGS, serviceId);

  const [material, setMaterial] = useState<StickerMaterial>("Бумага");
  const [finish, setFinish] = useState<StickerFinish>("Без фольги");
  const [shape, setShape] = useState<StickerShape>("Круглые");
  const [sizeLabel, setSizeLabel] = useState<string>("d 2 см");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [sheets, setSheets] = useState<number>(2);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [track, setTrack] = useState<Track>("upload");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const sizes = useMemo(
    () => STICKER_PRICES[material][finish][shape],
    [material, finish, shape]
  );

  useEffect(() => {
    if (!sizes.some((s) => s.label === sizeLabel)) setSizeLabel(sizes[0].label);
  }, [sizes, sizeLabel]);

  const calc = useMemo(() => {
    const entry = sizes.find((s) => s.label === sizeLabel) ?? sizes[0];
    const perSheet = entry.tiers[tierIndex(sheets)];
    const printTotal = perSheet * sheets;
    const lamTotal = lamination === "Да" ? LAMINATION_PER_SHEET * sheets : 0;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + designTotal + deliveryTotal;
    const stickerCount = entry.count * sheets;
    return {
      perSheet, printTotal, lamTotal, designTotal, deliveryTotal, grandTotal,
      stickerCount,
      perSticker: stickerCount ? printTotal / stickerCount : 0,
      count: entry.count,
    };
  }, [sizes, sizeLabel, sheets, lamination, track, delivery]);

  const sizeValues = useMemo(() => sizes.map((s) => s.label), [sizes]);

  const orderSummary = {
    productLabel: `Наклейки ${shape.toLowerCase()} ${sizeLabel}, ${material.toLowerCase()}${finish === "С фольгой" ? ", с фольгой" : ""}`,
    lines: [
      `${material} · ${finish} · ${shape} · ${sizeLabel} · ${sheets} л. А3 (≈ ${calc.stickerCount} шт.)`,
      lamination === "Да" ? "Ламинация" : null,
      track === "design" ? "Разработка макета дизайнером (1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : track === "template" ? "Каталог шаблонов" : "Загрузка макета",
      material, finish, shape, size: sizeLabel,
      sheets, sticker_count: calc.stickerCount,
      lamination, design_fee: calc.designTotal, delivery,
      file: uploadedFile?.name || "—",
    },
    delivery,
    quantity: sheets,
    total: calc.grandTotal,
    fileId: uploadedFile?.id ?? null,
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Наклейки и стикеры
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Самоклеящиеся наклейки на бумаге и плёнке. Печать на листе формата А3, на одной подложке.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TrackCard active={track === "template"} onClick={() => setTrack("template")} icon={<LayoutTemplate size={18} />} title="Каталог шаблонов" hint="Готовые макеты" />
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузить ваш макет" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 000 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              {track === "template" ? (
                <TemplateCatalogCard />
              ) : track === "design" ? (
                <DesignBriefCard product="Наклейки и стикеры">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость нашего дизайна — <strong>1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              ) : (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${
                      uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"
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
                        <p className="text-[12px] text-ink-500">PDF, AI, CDR, PSD, TIFF, PNG</p>
                      </div>
                    </div>
                    {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                    <p className="mt-3 text-[11px] text-ink-500">Один лист А3 содержит несколько наклеек одного макета.</p>
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

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-start gap-2">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  Наклейки печатаются на листе А3, на одной подложке.
                </p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField label="Материал" values={["Бумага", "Плёнка"]} value={material} onChange={(v) => setMaterial(v as StickerMaterial)} hint="самоклеящаяся" />

              <PillsField label="Фольгирование" values={["Без фольги", "С фольгой"]} value={finish} onChange={(v) => setFinish(v as StickerFinish)} />

              <PillsField label="Форма наклеек" values={STICKER_SHAPES} value={shape} onChange={(v) => setShape(v as StickerShape)} />

              <div>
                <PillsField label="Размер" values={sizeValues} value={sizeLabel} onChange={setSizeLabel} />
                <p className="mt-1.5 text-[12px] text-ink-700">
                  На листе А3: <strong className="text-ink-900">{calc.count} наклеек</strong>.
                </p>
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${LAMINATION_PER_SHEET} ₽/лист А3` : undefined} />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <QuantityField
                  label="Тираж, листов А3"
                  presets={SHEET_PRESETS}
                  value={sheets}
                  onChange={setSheets}
                  min={2}
                />
                <p className="mt-1.5 text-[12px] text-ink-700">
                  Итого: <strong className="text-ink-900">≈ {calc.stickerCount} наклеек</strong>.
                </p>
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

                <BreakdownRow
                  label={finish === "С фольгой" ? "Печать с фольгой" : "Печать"}
                  hint={`${sheets} л. × ${fmt(calc.perSheet)} ₽`}
                  value={`${fmt(calc.printTotal)} ₽`}
                />
                {calc.lamTotal > 0 && (
                  <BreakdownRow label="Ламинация" hint={`${sheets} л. × ${LAMINATION_PER_SHEET} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />
                )}
                {calc.designTotal > 0 && (
                  <BreakdownRow label="Разработка макета" hint="2 доработки в стоимости" value={`${fmt(calc.designTotal)} ₽`} />
                )}
                <BreakdownRow label="Доставка" hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined} value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"} />

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">{fmt(calc.grandTotal)}&nbsp;₽</p>
                  <p className="mt-1 text-[11px] text-ink-500">≈ {calc.perSticker.toFixed(1)} ₽ / наклейка</p>
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
