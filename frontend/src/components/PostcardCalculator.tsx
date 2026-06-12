"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Palette, LayoutTemplate } from "@/lib/icons";
import {
  PillsField, QuantityField, TrackCard, BreakdownRow, CheckoutModal, DesignBriefCard,
  TemplateCatalogCard, DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, tierValue, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Size = "Евро (98×210 мм)" | "А6 (105×148 мм)" | "А5 (148×210 мм)";
type Color = "Цветная" | "Цветная + ч/б" | "Чёрно-белая";
type Sides = "Односторонняя" | "Двусторонняя";
type Orientation = "По вертикали" | "По горизонтали";
type YesNo = "Да" | "Нет";
type Mode = "one" | "combo" | "two";
type Track = "template" | "upload" | "design";

const POSTCARD_SLUGS = ["открытки", "открытка"];

const QTY_TIERS = [50, 100, 200] as const;
type Tier = (typeof QTY_TIERS)[number];
const QTY_PRESETS = [50, 100, 200, 300, 500];
const MIN_QTY = 50;

const PRICE: Record<Size, Record<Mode, Record<Tier, number>>> = {
  "Евро (98×210 мм)": {
    one:   { 50: 35, 100: 30, 200: 24 },
    combo: { 50: 38, 100: 33, 200: 28 },
    two:   { 50: 42, 100: 37, 200: 32 },
  },
  "А6 (105×148 мм)": {
    one:   { 50: 32, 100: 21, 200: 14 },
    combo: { 50: 35, 100: 25, 200: 18 },
    two:   { 50: 38, 100: 27, 200: 21 },
  },
  "А5 (148×210 мм)": {
    one:   { 50: 43, 100: 33, 200: 26 },
    combo: { 50: 47, 100: 37, 200: 30 },
    two:   { 50: 50, 100: 40, 200: 34 },
  },
};

const LAMINATION_BY_SIZE: Record<Size, number> = {
  "Евро (98×210 мм)": 25,
  "А6 (105×148 мм)": 15,
  "А5 (148×210 мм)": 25,
};
const BIGOVKA_PER_UNIT = 10;
const FOIL_ONE = 50;
const FOIL_TWO = 100;
const DESIGN_FEE = 1000;

function resolveMode(color: Color, sides: Sides): { mode: Mode; approx: boolean } {
  if (color === "Цветная") return { mode: sides === "Двусторонняя" ? "two" : "one", approx: false };
  if (color === "Цветная + ч/б") return { mode: "combo", approx: false };

  return sides === "Двусторонняя" ? { mode: "combo", approx: true } : { mode: "one", approx: true };
}

export default function PostcardCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(POSTCARD_SLUGS, serviceId);

  const [track, setTrack] = useState<Track>("upload");
  const [size, setSize] = useState<Size>("Евро (98×210 мм)");
  const [color, setColor] = useState<Color>("Цветная");
  const [sides, setSides] = useState<Sides>("Двусторонняя");
  const [orientation, setOrientation] = useState<Orientation>("По вертикали");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [bigovka, setBigovka] = useState<YesNo>("Нет");
  const [foil, setFoil] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(100);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { mode, approx } = useMemo(() => resolveMode(color, sides), [color, sides]);

  const calc = useMemo(() => {
    const printUnit = tierValue(QTY_TIERS, PRICE[size][mode], quantity);
    const printTotal = printUnit * quantity;
    const lamUnit = LAMINATION_BY_SIZE[size];
    const lamTotal = lamination === "Да" ? lamUnit * quantity : 0;
    const bigTotal = bigovka === "Да" ? BIGOVKA_PER_UNIT * quantity : 0;
    const foilUnit = sides === "Двусторонняя" ? FOIL_TWO : FOIL_ONE;
    const foilTotal = foil === "Да" ? foilUnit * quantity : 0;
    const designTotal = track === "design" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = printTotal + lamTotal + bigTotal + foilTotal + designTotal + deliveryTotal;
    return { printUnit, printTotal, lamUnit, lamTotal, bigTotal, foilUnit, foilTotal, designTotal, deliveryTotal, grandTotal };
  }, [size, mode, quantity, lamination, bigovka, foil, sides, track, delivery]);

  const orderSummary = {
    productLabel: `Открытки ${size}, ${color.toLowerCase()}, ${sides.toLowerCase()}`,
    lines: [
      `${size} · ${color} · ${sides} · ${orientation} · ${quantity} шт.`,
      lamination === "Да" ? "Ламинация" : null,
      bigovka === "Да" ? "Биговка" : null,
      foil === "Да" ? `Фольгирование (${sides === "Двусторонняя" ? "двустороннее" : "одностороннее"})` : null,
      track === "design" ? "Разработка макета дизайнером (1000 ₽)" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      track: track === "design" ? "Заказ дизайна" : "Загрузка макета",
      size, color, sides, orientation, lamination, bigovka, foil,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Открытки</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Печать на бумаге 300 г/м². Цена тиража действует на 1 вид макета. Минимальный заказ — 50 шт.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TrackCard active={track === "upload"} onClick={() => setTrack("upload")} icon={<Upload size={18} />} title="Загрузить ваш макет" hint="У вас уже есть готовый файл" />
          <TrackCard active={track === "design"} onClick={() => setTrack("design")} icon={<Palette size={18} />} title="Заказ дизайна" hint="Разработка 1 000 ₽" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
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
                    <p className="mt-3 text-[11px] text-ink-500">Учтите вылеты +2 мм и линию биговки.</p>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.eps,.tiff,.psd" onChange={(e) => handleUpload(e.target.files)} />
                </>
              ) : (
                <DesignBriefCard product="Открытки">
                  <p className="text-[12px] text-ink-700 mb-1.5">Стоимость — <strong>1 000 ₽</strong>. В цену включены <strong>2 доработки</strong>.</p>
                  <p className="text-[12px] text-ink-700">Каждая последующая правка — <strong>+100 ₽</strong>.</p>
                </DesignBriefCard>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p>Бумага 300 г/м². Фольгирование: одностороннее +50 ₽, двустороннее +100 ₽ за открытку.</p>
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Размер" values={["Евро (98×210 мм)", "А6 (105×148 мм)", "А5 (148×210 мм)"]} value={size} onChange={(v) => setSize(v as Size)} />
              <PillsField label="Цветность" values={["Цветная", "Цветная + ч/б", "Чёрно-белая"]} value={color} onChange={(v) => setColor(v as Color)} hint={approx ? "ч/б — по ближайшей позиции прайса" : undefined} />
              <PillsField label="Стороны печати" values={["Двусторонняя", "Односторонняя"]} value={sides} onChange={(v) => setSides(v as Sides)} />
              <PillsField label="Ориентация" values={["По вертикали", "По горизонтали"]} value={orientation} onChange={(v) => setOrientation(v as Orientation)} hint="на цену не влияет" />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинация" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${calc.lamUnit} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Биговка" values={["Нет", "Да"]} value={bigovka} onChange={(v) => setBigovka(v as YesNo)} hint={bigovka === "Да" ? `+${BIGOVKA_PER_UNIT} ₽/шт` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Фольгирование" values={["Нет", "Да"]} value={foil} onChange={(v) => setFoil(v as YesNo)} hint={foil === "Да" ? `+${calc.foilUnit} ₽/шт (${sides === "Двусторонняя" ? "двустороннее" : "одностороннее"})` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={MIN_QTY} step={10} />
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
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинация" hint={`${quantity} × ${calc.lamUnit} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.bigTotal > 0 && <BreakdownRow label="Биговка" hint={`${quantity} × ${BIGOVKA_PER_UNIT} ₽`} value={`${fmt(calc.bigTotal)} ₽`} />}
                {calc.foilTotal > 0 && <BreakdownRow label="Фольгирование" hint={`${quantity} × ${calc.foilUnit} ₽`} value={`${fmt(calc.foilTotal)} ₽`} />}
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
