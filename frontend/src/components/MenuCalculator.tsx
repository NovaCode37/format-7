"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, Minus, Plus, X, FileCheck2, QrCode, Truck, Package,
  CheckCircle2, Phone, Info, Palette,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

type Material = "Бумага 300 г/м²" | "Бумага 250 г/м²" | "Пластик";
type Sides = "Односторонняя" | "Двусторонняя";
type YesNo = "Да" | "Нет";
type SpringColor = "Белый" | "Чёрный";
type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";

type Tier = 10 | 50 | 100;
const TIERS: Tier[] = [10, 50, 100];

const SHEET_PRICE: Record<Material, Record<Sides, Record<Tier, number>>> = {
  "Бумага 300 г/м²": {
    "Односторонняя": { 10: 200, 50: 180, 100: 150 },
    "Двусторонняя":  { 10: 250, 50: 220, 100: 200 },
  },
  "Бумага 250 г/м²": {
    "Односторонняя": { 10: 170, 50: 150, 100: 130 },
    "Двусторонняя":  { 10: 220, 50: 200, 100: 180 },
  },
  "Пластик": {
    "Односторонняя": { 10: 300, 50: 270, 100: 250 },
    "Двусторонняя":  { 10: 350, 50: 330, 100: 300 },
  },
};

function getSheetPrice(mat: Material, sides: Sides, qty: number): number {
  const tierKey: Tier = qty >= 100 ? 100 : qty >= 50 ? 50 : 10;
  return SHEET_PRICE[mat][sides][tierKey];
}

const LAMINATION_PRICE = 50;
const ROUNDING_PRICE = 2;
const SPRING_PRICE = 80;
const STAPLE_PRICE = 15;
const DESIGN_FEE = 2000;

const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

const QTY_PRESETS = [10, 50, 100];
const SHEET_PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export default function MenuCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [material, setMaterial] = useState<Material>("Бумага 300 г/м²");
  const [sides, setSides] = useState<Sides>("Двусторонняя");
  const [sheets, setSheets] = useState(2);
  const [sheetsInput, setSheetsInput] = useState("2");
  const [lamination, setLamination] = useState<YesNo>("Нет");
  const [rounding, setRounding] = useState<YesNo>("Нет");
  const [spring, setSpring] = useState<YesNo>("Нет");
  const [springColor, setSpringColor] = useState<SpringColor>("Белый");
  const [staple, setStaple] = useState<YesNo>("Нет");
  const [quantity, setQuantity] = useState(10);
  const [qtyInput, setQtyInput] = useState("10");
  const [delivery, setDelivery] = useState<Delivery>("Самовывоз");
  const [needDesign, setNeedDesign] = useState<YesNo>("Нет");

  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: number | null } | null>(null);
  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (material === "Пластик" && springColor === "Чёрный") {
      setSpringColor("Белый");
    }
  }, [material, springColor]);

  useEffect(() => {
    if (spring === "Да" && staple === "Да") setStaple("Нет");
  }, [spring, staple]);
  useEffect(() => {
    if (staple === "Да" && spring === "Да") setSpring("Нет");
  }, [staple, spring]);

  useEffect(() => {
    if (serviceId) { setResolvedServiceId(serviceId); return; }
    let mounted = true;
    api.getServices().then((services) => {
      if (!mounted) return;
      const target = services.find((s) =>
        s.slug.toLowerCase() === "меню-для-кафе" ||
        s.slug.toLowerCase() === "меню" ||
        s.name.toLowerCase().includes("меню")
      );
      setResolvedServiceId(target?.id ?? null);
    }).catch(() => { if (!mounted) return; setResolvedServiceId(null); });
    return () => { mounted = false; };
  }, [serviceId]);

  const calc = useMemo(() => {
    const sheetUnit = getSheetPrice(material, sides, quantity);
    const printPerCopy = sheetUnit * sheets;
    const printTotal = printPerCopy * quantity;

    const lamTotal = lamination === "Да" ? LAMINATION_PRICE * sheets * quantity : 0;
    const roundTotal = rounding === "Да" ? ROUNDING_PRICE * 4 * sheets * quantity : 0;
    const springTotal = spring === "Да" ? SPRING_PRICE * quantity : 0;
    const stapleTotal = staple === "Да" ? STAPLE_PRICE * quantity : 0;
    const designTotal = needDesign === "Да" ? DESIGN_FEE : 0;
    const deliveryTotal = DELIVERY_PRICE[delivery];

    const grandTotal = printTotal + lamTotal + roundTotal + springTotal + stapleTotal + designTotal + deliveryTotal;

    return {
      sheetUnit, printPerCopy, printTotal,
      lamTotal, roundTotal, springTotal, stapleTotal,
      designTotal, deliveryTotal, grandTotal,
    };
  }, [material, sides, sheets, lamination, rounding, spring, staple, quantity, delivery, needDesign]);

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    try {
      const up = await api.uploadFile(f);
      setUploadedFile({ name: up.original_name, id: up.id });
      toast.success(`Макет «${up.original_name}» загружен`);
    } catch {
      setUploadedFile({ name: f.name, id: null });
      toast.success(`Макет «${f.name}» принят (будет передан менеджеру)`);
    }
  };

  const orderSummary = {
    material, sides, sheets, lamination, rounding,
    spring, springColor: spring === "Да" ? springColor : null,
    staple, quantity, delivery, needDesign,
    fileName: uploadedFile?.name || null,
    fileId: uploadedFile?.id ?? null,
    total: calc.grandTotal,
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Меню для кафе и ресторанов
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Формат А4, полноцветная печать. Выберите параметры и сразу получите стоимость.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed p-6 text-left transition-colors ${
                  uploadedFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-amber-300 bg-amber-50 hover:bg-amber-100"
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
                    <p className="text-[12px] text-ink-500">PDF, JPG, PNG, AI, CDR, PSD</p>
                  </div>
                </div>
                {uploadedFile && (
                  <p className="mt-2 text-[12px] text-emerald-700 break-all">{uploadedFile.name}</p>
                )}
                <p className="mt-3 text-[11px] text-ink-500">Файл будет передан менеджеру вместе с заказом</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.ai,.cdr,.eps,.tiff,.psd"
                onChange={(e) => handleUpload(e.target.files)}
              />

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-ink-700 space-y-2">
                <div className="flex items-start gap-2">
                  <Palette size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-ink-900">Разработка макета</strong> нашим дизайнером — <strong>2 000 ₽</strong>.
                    Включены 2 доработки, каждая последующая правка — +100 ₽.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>Формат для печати меню — <strong className="text-ink-900">А4</strong>. Полноцветная печать.</p>
                </div>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p>Размер готового изделия может отличаться от стандартного на ±2 мм.</p>
                <p className="flex items-center gap-1.5">
                  <Truck size={13} /> Доставка по Тюмени — 700 ₽.
                </p>
                <p className="flex items-center gap-1.5">
                  <Package size={13} /> Возможна отправка СДЭК наложенным платежом по РФ.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField
                label="Материал"
                values={["Бумага 300 г/м²", "Бумага 250 г/м²", "Пластик"]}
                value={material}
                onChange={(v) => setMaterial(v as Material)}
              />

              <PillsField
                label="Сторона печати"
                values={["Двусторонняя", "Односторонняя"]}
                value={sides}
                onChange={(v) => setSides(v as Sides)}
              />

              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Количество листов (блоков) в одном меню
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SHEET_PRESETS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setSheets(q); setSheetsInput(String(q)); }}
                      className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        sheets === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <NumberStepper
                  value={sheets}
                  setValue={(n) => { const c = Math.max(1, n); setSheets(c); setSheetsInput(String(c)); }}
                  min={1}
                  inputValue={sheetsInput}
                  onInputChange={(raw) => { setSheetsInput(raw); const p = parseInt(raw); if (!isNaN(p) && p > 0) setSheets(p); }}
                  onInputBlur={() => { const p = parseInt(sheetsInput); const c = isNaN(p) || p < 1 ? 1 : p; setSheets(c); setSheetsInput(String(c)); }}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Ламинация"
                  values={["Нет", "Да"]}
                  value={lamination}
                  onChange={(v) => setLamination(v as YesNo)}
                  hint={lamination === "Да" ? `+${LAMINATION_PRICE} ₽/лист` : undefined}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Скругление углов"
                  values={["Нет", "Да"]}
                  value={rounding}
                  onChange={(v) => setRounding(v as YesNo)}
                  hint={rounding === "Да" ? `+${ROUNDING_PRICE} ₽/угол × 4` : undefined}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Пружина"
                  values={["Нет", "Да"]}
                  value={spring}
                  onChange={(v) => {
                    setSpring(v as YesNo);
                    if (v === "Да") setStaple("Нет");
                  }}
                  hint={spring === "Да" ? `+${SPRING_PRICE} ₽/экз.` : undefined}
                />
                {spring === "Да" && (
                  <div className="mt-3">
                    <PillsField
                      label="Цвет пружины"
                      values={material === "Пластик" ? ["Белый"] : ["Белый", "Чёрный"]}
                      value={springColor}
                      onChange={(v) => setSpringColor(v as SpringColor)}
                      hint={material === "Пластик" ? "для пластика только белый" : undefined}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Скоба"
                  values={["Нет", "Да"]}
                  value={staple}
                  onChange={(v) => {
                    setStaple(v as YesNo);
                    if (v === "Да") setSpring("Нет");
                  }}
                  hint={staple === "Да" ? `+${STAPLE_PRICE} ₽/экз.` : undefined}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Разработка макета дизайнером"
                  values={["Нет", "Да"]}
                  value={needDesign}
                  onChange={(v) => setNeedDesign(v as YesNo)}
                  hint={needDesign === "Да" ? `+${fmt(DESIGN_FEE)} ₽` : undefined}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Тираж, шт.
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QTY_PRESETS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuantity(q); setQtyInput(String(q)); }}
                      className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        quantity === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <NumberStepper
                  value={quantity}
                  setValue={(n) => { const c = Math.max(1, n); setQuantity(c); setQtyInput(String(c)); }}
                  min={1}
                  inputValue={qtyInput}
                  onInputChange={(raw) => { setQtyInput(raw); const p = parseInt(raw); if (!isNaN(p) && p > 0) setQuantity(p); }}
                  onInputBlur={() => { const p = parseInt(qtyInput); const c = isNaN(p) || p < 1 ? 1 : p; setQuantity(c); setQtyInput(String(c)); }}
                />
              </div>

              <div className="pt-4 border-t border-ink-100">
                <PillsField
                  label="Доставка"
                  values={["Самовывоз", "Доставка по Тюмени", "СДЭК (наложенный платёж)"]}
                  value={delivery}
                  onChange={(v) => setDelivery(v as Delivery)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">
                  Расчёт стоимости
                </p>

                <BreakdownRow
                  label="Печать"
                  hint={`${quantity} экз. × ${sheets} л. × ${fmt(calc.sheetUnit)} ₽`}
                  value={`${fmt(calc.printTotal)} ₽`}
                />
                {calc.lamTotal > 0 && (
                  <BreakdownRow
                    label="Ламинация"
                    hint={`${quantity} × ${sheets} л. × ${LAMINATION_PRICE} ₽`}
                    value={`${fmt(calc.lamTotal)} ₽`}
                  />
                )}
                {calc.roundTotal > 0 && (
                  <BreakdownRow
                    label="Скругление"
                    hint={`${quantity} × ${sheets} л. × 4 уг. × ${ROUNDING_PRICE} ₽`}
                    value={`${fmt(calc.roundTotal)} ₽`}
                  />
                )}
                {calc.springTotal > 0 && (
                  <BreakdownRow
                    label={`Пружина (${springColor.toLowerCase()})`}
                    hint={`${quantity} × ${SPRING_PRICE} ₽`}
                    value={`${fmt(calc.springTotal)} ₽`}
                  />
                )}
                {calc.stapleTotal > 0 && (
                  <BreakdownRow
                    label="Скоба"
                    hint={`${quantity} × ${STAPLE_PRICE} ₽`}
                    value={`${fmt(calc.stapleTotal)} ₽`}
                  />
                )}
                {calc.designTotal > 0 && (
                  <BreakdownRow
                    label="Дизайн макета"
                    value={`${fmt(calc.designTotal)} ₽`}
                  />
                )}
                <BreakdownRow
                  label="Доставка"
                  hint={delivery === "СДЭК (наложенный платёж)" ? "оплачивает получатель" : undefined}
                  value={calc.deliveryTotal ? `${fmt(calc.deliveryTotal)} ₽` : "—"}
                />

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Итого</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">
                    {fmt(calc.grandTotal)}&nbsp;₽
                  </p>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="mt-4 w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Оформить заказ
                </button>

                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
                  После оформления менеджер проверит макет и свяжется для подтверждения и оплаты.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          summary={orderSummary}
          serviceId={resolvedServiceId}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </section>
  );
}

function PillsField({
  label, values, value, onChange, hint,
}: {
  label: string; values: string[]; value: string;
  onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label className="block text-[12px] font-semibold text-ink-700">{label}:</label>
        {hint && <span className="text-[11px] text-ink-500">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-3 h-9 rounded-md text-[12px] font-medium transition-colors ${
              v === value
                ? "bg-amber-50 text-amber-900 border border-amber-300"
                : "bg-white text-ink-700 border border-ink-200 hover:border-ink-300"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberStepper({
  value, setValue, min = 1,
  inputValue, onInputChange, onInputBlur,
}: {
  value: number; setValue: (n: number) => void; min?: number;
  inputValue?: string; onInputChange?: (raw: string) => void; onInputBlur?: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-ink-200 overflow-hidden w-44">
      <button
        onClick={() => setValue(Math.max(min, value - 1))}
        className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50"
        aria-label="Уменьшить"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={min}
        value={inputValue ?? value}
        onChange={onInputChange
          ? (e) => onInputChange(e.target.value)
          : (e) => setValue(Math.max(min, parseInt(e.target.value) || min))
        }
        onBlur={onInputBlur}
        className="flex-1 h-10 text-center text-sm font-semibold text-ink-900 tabular bg-white outline-none"
      />
      <button
        onClick={() => setValue(value + 1)}
        className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50"
        aria-label="Увеличить"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function BreakdownRow({
  label, value, hint,
}: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-700">{label}</p>
        {hint && <p className="text-[11px] text-ink-500">{hint}</p>}
      </div>
      {value && <p className="text-[13px] font-semibold text-ink-900 tabular whitespace-nowrap">{value}</p>}
    </div>
  );
}

type Summary = {
  material: string; sides: string; sheets: number;
  lamination: string; rounding: string;
  spring: string; springColor: string | null;
  staple: string; quantity: number; delivery: string;
  needDesign: string;
  fileName: string | null; fileId: number | null;
  total: number;
};

function CheckoutModal({
  summary, serviceId, onClose,
}: {
  summary: Summary; serviceId: number | null; onClose: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<"form" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Укажите имя, телефон и email");
      return;
    }
    const resolvedSid = serviceId || 0;

    const deliveryType = summary.delivery === "Самовывоз" ? "pickup" : "delivery";
    if (deliveryType === "delivery" && !address.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }

    setSending(true);
    try {
      const options = {
        material: summary.material,
        sides: summary.sides,
        sheets: summary.sheets,
        lamination: summary.lamination,
        rounding: summary.rounding,
        spring: summary.spring,
        spring_color: summary.springColor || "—",
        staple: summary.staple,
        quantity: summary.quantity,
        delivery: summary.delivery,
        design: summary.needDesign,
        file: summary.fileName || "—",
      };

      const fullComment = [
        `Меню: ${summary.material}, ${summary.sides}, ${summary.sheets} л., ${summary.quantity} экз.`,
        summary.lamination === "Да" ? "ламинация" : null,
        summary.rounding === "Да" ? "скругление" : null,
        summary.spring === "Да" ? `пружина (${summary.springColor})` : null,
        summary.staple === "Да" ? "скоба" : null,
        summary.needDesign === "Да" ? "дизайн" : null,
        `Итого: ${summary.total} ₽`,
        `Адрес: ${address || "—"}`,
        comment || "",
      ].filter(Boolean).join(" | ");

      const order = await api.createOrder({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        comment: fullComment,
        items: [{
          service_id: resolvedSid,
          quantity: summary.quantity,
          price: summary.total,
          options,
        }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? address : "",
        office_id: null,
        file_ids: summary.fileId ? [summary.fileId] : [],
      });
      setOrderNumber(order.order_number);
      setSending(false);
      setStep("done");
    } catch (e: any) {
      setSending(false);
      toast.error(e?.message || "Не удалось оформить заказ");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl border border-ink-200 p-6 sm:p-7 relative my-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
        >
          <X size={16} />
        </button>

        {step === "form" ? (
          <form onSubmit={submit}>
            <h3 className="font-heading text-xl font-bold text-ink-900">Оформление заказа</h3>
            <p className="mt-1 text-sm text-ink-600">Менеджер проверит макет и свяжется для оплаты.</p>

            <div className="mt-4 rounded-lg bg-ink-50 border border-ink-200 p-3 text-[12px] text-ink-700 space-y-0.5">
              <p>{summary.material} · {summary.sides} · {summary.sheets} л. · {summary.quantity} экз.</p>
              {summary.lamination === "Да" && <p>Ламинация</p>}
              {summary.rounding === "Да" && <p>Скругление углов</p>}
              {summary.spring === "Да" && <p>Пружина ({summary.springColor})</p>}
              {summary.staple === "Да" && <p>Скоба</p>}
              {summary.needDesign === "Да" && <p>Разработка макета дизайнером</p>}
              <p>Доставка: {summary.delivery}</p>
              <p className="pt-1 font-semibold text-ink-900">Итого: {summary.total.toLocaleString("ru-RU")} ₽</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя *" className="input h-11" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон *" className="input h-11 tabular" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (для чека)" className="input h-11 sm:col-span-2" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={summary.delivery === "Самовывоз" ? "Офис самовывоза (опц.)" : "Адрес доставки"} className="input h-11 sm:col-span-2" />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий к заказу (опц.)" rows={3} className="input sm:col-span-2 py-2 resize-none" />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full h-11 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
            >
              {sending ? "Отправляем…" : "Передать менеджеру"}
            </button>

            <p className="mt-3 text-[11px] text-ink-500 text-center">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <Link href="/legal/privacy" className="text-brand hover:underline">политикой обработки данных</Link>
            </p>
          </form>
        ) : (
          <div>
            <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-ink-900 text-center">Заказ принят</h3>
            <p className="mt-2 text-sm text-ink-600 text-center">
              Менеджер проверит макет и свяжется для оплаты по телефону {phone}
              {email ? <> и {email}</> : null}.
            </p>
            {!!orderNumber && (
              <p className="mt-1 text-[12px] text-ink-500 text-center">
                Номер заказа: <span className="font-semibold text-ink-900">{orderNumber}</span>
              </p>
            )}

            <div className="mt-5 rounded-lg border border-ink-200 bg-ink-50 p-4 flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-md bg-white border border-ink-200 text-ink-700">
                <QrCode size={22} />
              </span>
              <div className="text-[12px] text-ink-700">
                <p className="font-semibold text-ink-900">Оплата по согласованию</p>
                <p>Менеджер согласует способ оплаты после проверки макета</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <a href="tel:+79324759511" className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 border border-ink-200 text-ink-900 text-[13px] font-medium hover:bg-ink-50">
                <Phone size={14} /> Позвонить
              </a>
              <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800">
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
