"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileCheck2, Truck, Package, Info } from "@/lib/icons";
import {
  PillsField, QuantityField, BreakdownRow, CheckoutModal,
  DELIVERY_VALUES, DELIVERY_PRICE, type Delivery,
  fmt, useResolvedServiceId, useUpload,
} from "./calc/kit";

type Size = "А6 (10×15 см)" | "А5 (15×20 см)" | "А4 (21×30 см)" | "А3 (30×40 см)";
type Margins = "Без полей" | "С полями";
type Paper = "Глянцевая" | "Матовая";
type Packaging = "Без упаковки" | "Конверт E65 (110×220)" | "Конверт C5 (162×229)" | "Конверт C4 (229×324)";
type YesNo = "Да" | "Нет";

const PHOTO_SLUGS = ["печать-фотографий", "печать-фото", "фотопечать"];

const PRICE: Record<Size, number> = {
  "А6 (10×15 см)": 22,
  "А5 (15×20 см)": 50,
  "А4 (21×30 см)": 100,
  "А3 (30×40 см)": 200,
};

const LAMINATION_BY_SIZE: Record<Size, number> = {
  "А6 (10×15 см)": 15,
  "А5 (15×20 см)": 25,
  "А4 (21×30 см)": 50,
  "А3 (30×40 см)": 100,
};

const PACKAGING_PRICE: Record<Packaging, number> = {
  "Без упаковки": 0,
  "Конверт E65 (110×220)": 30,
  "Конверт C5 (162×229)": 40,
  "Конверт C4 (229×324)": 45,
};

const HAND_FEE = 100;
const MIN_ORDER = 500;
const QTY_PRESETS = [1, 5, 10, 25, 50, 100];

export default function PhotoCalculator({ serviceId }: { serviceId?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFile, handleUpload } = useUpload();
  const resolvedServiceId = useResolvedServiceId(PHOTO_SLUGS, serviceId);

  const [size, setSize] = useState<Size>("А6 (10×15 см)");
  const [margins, setMargins] = useState<Margins>("Без полей");
  const [paper, setPaper] = useState<Paper>("Глянцевая");
  const [packaging, setPackaging] = useState<Packaging>("Без упаковки");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [handWork, setHandWork] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState<number>(10);
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const calc = useMemo(() => {
    const printUnit = PRICE[size];
    const printTotal = printUnit * quantity;
    const lamUnit = LAMINATION_BY_SIZE[size];
    const lamTotal = lamination === "Да" ? lamUnit * quantity : 0;
    const packTotal = PACKAGING_PRICE[packaging];
    const handTotal = handWork === "Да" ? HAND_FEE : 0;
    const subtotal = printTotal + lamTotal + packTotal + handTotal;
    const minSurcharge = subtotal < MIN_ORDER ? MIN_ORDER - subtotal : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];
    const grandTotal = subtotal + minSurcharge + deliveryTotal;
    return { printUnit, printTotal, lamUnit, lamTotal, packTotal, handTotal, subtotal, minSurcharge, deliveryTotal, grandTotal };
  }, [size, quantity, lamination, packaging, handWork, delivery]);

  const orderSummary = {
    productLabel: `Печать фото ${size}, ${paper.toLowerCase()}`,
    lines: [
      `${size} · ${paper} · ${margins} · ${quantity} шт.`,
      packaging !== "Без упаковки" ? `Упаковка: ${packaging}` : null,
      lamination === "Да" ? "Ламинирование" : null,
      handWork === "Да" ? "Ручная обработка файлов" : null,
      `Доставка: ${delivery}`,
    ].filter(Boolean) as string[],
    options: {
      size, margins, paper, packaging,
      lamination, hand_work: handWork,
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Печать фотографий</h1>
          <p className="mt-2 text-ink-500 text-sm">
            Срок изготовления — 1 день. Минимальная стоимость заказа — 500 ₽.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              <button onClick={() => fileInputRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${uploadedFile ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`grid place-items-center w-11 h-11 rounded-lg ${uploadedFile ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                    {uploadedFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                  </span>
                  <div>
                    <p className="font-heading text-base font-bold text-ink-900">{uploadedFile ? "Фото загружено" : "Загрузить ваши фото"}</p>
                    <p className="text-[12px] text-ink-500">JPG, PNG, TIFF, HEIC</p>
                  </div>
                </div>
                {uploadedFile && <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>}
                <p className="mt-3 text-[11px] text-ink-500">Чем выше разрешение файла, тем лучше результат печати.</p>
              </button>
              <input ref={fileInputRef} type="file" hidden accept=".jpg,.jpeg,.png,.tiff,.heic,.webp" onChange={(e) => handleUpload(e.target.files)} />

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-ink-700 space-y-2">
                <p className="flex items-start gap-2">
                  <Info size={13} className="text-amber-600 mt-0.5 shrink-0" />
                  Цветопередача на фото может отличаться от изображения на экране — это зависит от исходного файла, настроек и яркости вашего устройства и выбранной бумаги.
                </p>
                <p className="flex items-start gap-2">
                  <Info size={13} className="text-amber-600 mt-0.5 shrink-0" />
                  При несоответствии формата файла выбранному формату фото выполняется ручная обработка файла (+100 ₽).
                </p>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p className="flex items-center gap-1.5"><Truck size={13} /> Доставка по Тюмени — 700 ₽.</p>
                <p className="flex items-center gap-1.5"><Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <PillsField label="Формат" values={["А6 (10×15 см)", "А5 (15×20 см)", "А4 (21×30 см)", "А3 (30×40 см)"]} value={size} onChange={(v) => setSize(v as Size)} hint={`${PRICE[size]} ₽/фото`} />
              <PillsField label="Поля" values={["Без полей", "С полями"]} value={margins} onChange={(v) => setMargins(v as Margins)} hint={margins === "Без полей" ? "часть фото может обрезаться" : "возможны белые поля"} />
              <PillsField label="Бумага" values={["Глянцевая", "Матовая"]} value={paper} onChange={(v) => setPaper(v as Paper)} />

              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Упаковка" values={["Без упаковки", "Конверт E65 (110×220)", "Конверт C5 (162×229)", "Конверт C4 (229×324)"]} value={packaging} onChange={(v) => setPackaging(v as Packaging)} hint={PACKAGING_PRICE[packaging] ? `+${PACKAGING_PRICE[packaging]} ₽` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ламинирование" values={["Нет", "Да"]} value={lamination} onChange={(v) => setLamination(v as YesNo)} hint={lamination === "Да" ? `+${calc.lamUnit} ₽/фото` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <PillsField label="Ручная обработка файлов" values={["Нет", "Да"]} value={handWork} onChange={(v) => setHandWork(v as YesNo)} hint={handWork === "Да" ? `+${HAND_FEE} ₽` : undefined} />
              </div>
              <div className="pt-4 border-t border-ink-100">
                <QuantityField label="Количество фото, шт." presets={QTY_PRESETS} value={quantity} onChange={setQuantity} min={1} />
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
                {calc.lamTotal > 0 && <BreakdownRow label="Ламинирование" hint={`${quantity} × ${calc.lamUnit} ₽`} value={`${fmt(calc.lamTotal)} ₽`} />}
                {calc.packTotal > 0 && <BreakdownRow label="Упаковка" value={`${fmt(calc.packTotal)} ₽`} />}
                {calc.handTotal > 0 && <BreakdownRow label="Ручная обработка" value={`${fmt(calc.handTotal)} ₽`} />}
                {calc.minSurcharge > 0 && <BreakdownRow label="До минимального заказа" hint={`мин. ${MIN_ORDER} ₽`} value={`${fmt(calc.minSurcharge)} ₽`} />}
                <BreakdownRow label="Доставка" hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined} value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"} />
                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">{fmt(calc.grandTotal)}&nbsp;₽</p>
                </div>
                <button onClick={() => setCheckoutOpen(true)} className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors">Оформить заказ</button>
                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">После оформления менеджер проверит файлы и свяжется для подтверждения и оплаты.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && <CheckoutModal summary={orderSummary} serviceId={resolvedServiceId} onClose={() => setCheckoutOpen(false)} />}
    </section>
  );
}
