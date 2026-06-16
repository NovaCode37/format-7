"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Minus, Plus, X, QrCode, Info,
  CheckCircle2, Phone, ScanLine,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "./Toast";
import { CheckoutModal, usePricing } from "./calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

type Format = "А4" | "А3";
type ScanMethod = "Автоподатчик" | "Со стекла";
type StorageOption = "Нет" | "Да";

const SCAN_PRICING = PRICING_DEFAULTS["сканирование-документов"].data;

const QTY_PRESETS = [1, 5, 10, 25, 50, 100, 250, 500];

export default function ScanCalculator({ serviceId }: { serviceId?: number }) {
  const toast = useToast();

  const [format, setFormat] = useState<Format>("А4");
  const [method, setMethod] = useState<ScanMethod>("Автоподатчик");
  const [storage, setStorage] = useState<StorageOption>("Нет");
  const [quantity, setQuantity] = useState(10);
  const [qtyInput, setQtyInput] = useState("10");

  const [resolvedServiceId, setResolvedServiceId] = useState<number | null>(serviceId ?? null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (serviceId) { setResolvedServiceId(serviceId); return; }
    let mounted = true;
    api.getServices().then((services) => {
      if (!mounted) return;
      const target = services.find((s) =>
        s.slug.toLowerCase() === "сканирование-документов" ||
        s.slug.toLowerCase() === "сканирование"
      );
      setResolvedServiceId(target?.id ?? null);
    }).catch(() => { if (!mounted) return; setResolvedServiceId(null); });
    return () => { mounted = false; };
  }, [serviceId]);

  const pricing = usePricing("сканирование-документов", SCAN_PRICING);

  const calc = useMemo(() => {
    const pagePrice = (pricing.scan as any)[method][format];
    const scanTotal = pagePrice * quantity;
    const storageTotal = storage === "Да" ? pricing.storage : 0;
    const grandTotal = scanTotal + storageTotal;

    return { pagePrice, scanTotal, storageTotal, grandTotal };
  }, [format, method, storage, quantity, pricing]);

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  const orderSummary = {
    productLabel: "Сканирование документов",
    lines: [
      `${format} · ${method} · ${quantity} стр.`,
      `Носитель: ${storage === "Да" ? `наш (+${pricing.storage} ₽)` : "email / носитель клиента"}`,
    ],
    options: {
      Формат: format,
      Метод: method,
      Носитель: storage === "Да" ? `На наш носитель (+${pricing.storage} ₽)` : "Email / носитель клиента",
      Страниц: quantity,
    },
    delivery: "Самовывоз",
    quantity,
    total: calc.grandTotal,
    fileId: null,
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Калькулятор</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Сканирование документов
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Выберите параметры и сразу получите стоимость
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">

              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid place-items-center w-11 h-11 rounded-lg bg-amber-500 text-white">
                    <ScanLine size={20} />
                  </span>
                  <div>
                    <p className="font-heading text-base font-bold text-ink-900">Сканирование</p>
                    <p className="text-[12px] text-ink-500">Цветное, до формата А3</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-ink-700 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-ink-900">Автоподатчик</strong> — для несшитых документов.
                    Быстрая подача страниц.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    <strong className="text-ink-900">Со стекла</strong> — для сшитых документов,
                    книг, нестандартных оригиналов.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-[12px] text-ink-600 space-y-2">
                <p>
                  Отправка документов по <strong className="text-ink-900">email</strong> на один электронный адрес
                  или запись на <strong className="text-ink-900">один носитель клиента</strong> — <span className="text-emerald-700 font-semibold">бесплатно</span>.
                </p>
                <p>
                  Сохранение на <strong className="text-ink-900">наши носители</strong> (флешка/диск) — <span className="font-semibold text-ink-900">{pricing.storage} ₽</span>.
                </p>
                <p className="pt-1 border-t border-ink-200 text-ink-500">
                  Сканирование документов, фото и т.д. форматом менее А4 рассчитывается по стоимости формата А4.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <PillsField
                label="Формат"
                values={["А4", "А3"]}
                value={format}
                onChange={(v) => setFormat(v as Format)}
                hint="менее А4 = по цене А4"
              />

              <PillsField
                label="Способ сканирования"
                values={["Автоподатчик", "Со стекла"]}
                value={method}
                onChange={(v) => setMethod(v as ScanMethod)}
                hint={method === "Автоподатчик" ? "документы не сшиты" : "документы сшиты"}
              />

              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
                  Количество страниц
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
                  label="Сохранение на наши носители"
                  values={["Нет", "Да"]}
                  value={storage}
                  onChange={(v) => setStorage(v as StorageOption)}
                  hint={storage === "Да" ? `+${pricing.storage} ₽` : "email / носитель клиента — бесплатно"}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-3">
                  Расчёт стоимости
                </p>

                <BreakdownRow
                  label="Сканирование"
                  hint={`${quantity} × ${fmt(calc.pagePrice)} ₽`}
                  value={`${fmt(calc.scanTotal)} ₽`}
                />
                <BreakdownRow
                  label="Формат"
                  hint={`${format}, ${method.toLowerCase()}`}
                  value=""
                />
                {storage === "Да" && (
                  <BreakdownRow
                    label="Носитель"
                    hint="сохранение на наш носитель"
                    value={`${fmt(calc.storageTotal)} ₽`}
                  />
                )}

                <div className="mt-3 pt-3 border-t border-ink-200">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    Итого
                  </p>
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
                  После оформления менеджер свяжется с вами и подтвердит заказ.
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
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
  hint?: string;
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
