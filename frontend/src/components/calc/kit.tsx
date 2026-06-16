"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Minus, Plus, X, ShoppingCart, LayoutTemplate, ArrowRight, Palette,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "../Toast";

export const fmt = (n: number) => n.toLocaleString("ru-RU");

export const POLY_SIZE_NOTE =
  "Размер готового изделия может отличаться от стандарта на ±2 мм.";

export function DesignBriefCard({ product, children }: { product?: string; children: React.ReactNode }) {
  const href = product ? `/designer?product=${encodeURIComponent(product)}` : "/designer";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="grid place-items-center w-11 h-11 rounded-lg bg-amber-500 text-white"><Palette size={20} /></span>
        <p className="font-heading text-base font-bold text-ink-900">Разработка макета дизайнером</p>
      </div>
      <div className="text-[12px] text-ink-700 space-y-1.5">{children}</div>
      <Link
        href={href}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 transition-colors"
      >
        Заполнить бриф на дизайн <ArrowRight size={14} />
      </Link>
      <p className="mt-2 text-[11px] text-ink-500">Откроется анкета: 11 полей + загрузка изображений и эскиза.</p>
    </div>
  );
}

export function TemplateCatalogCard() {
  return null;

  return (
    <Link
      href="/catalog"
      className="block rounded-xl border border-ink-200 bg-ink-50 p-5 hover:border-ink-300 transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="grid place-items-center w-11 h-11 rounded-lg bg-ink-900 text-white">
          <LayoutTemplate size={20} />
        </span>
        <div>
          <p className="font-heading text-base font-bold text-ink-900">Каталог шаблонов</p>
          <p className="text-[12px] text-ink-500">Готовые макеты — вся полиграфия</p>
        </div>
      </div>
      <p className="text-[12px] text-ink-600">
        Выберите готовый шаблон — мы подставим ваши данные и пришлём превью на утверждение.
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand">
        Открыть шаблоны <ArrowRight size={13} />
      </span>
    </Link>
  );
}

export function tierValue<T extends number>(
  tiers: readonly T[],
  table: Record<T, number>,
  qty: number
): number {

  let chosen = tiers[0];
  for (const t of tiers) {
    if (qty >= t) chosen = t;
  }
  return table[chosen];
}

export function useResolvedServiceId(slugs: string[], serviceId?: number) {
  const [resolved, setResolved] = useState<number | null>(serviceId ?? null);
  useEffect(() => {
    if (serviceId) { setResolved(serviceId); return; }
    let mounted = true;
    const wanted = slugs.map((s) => s.toLowerCase());
    api.getServices()
      .then((services) => {
        if (!mounted) return;
        const target = services.find((s) => {
          const sl = s.slug.toLowerCase();
          return wanted.includes(sl) || wanted.some((w) => sl.includes(w) || s.name.toLowerCase().includes(w));
        });
        setResolved(target?.id ?? null);
      })
      .catch(() => mounted && setResolved(null));
    return () => { mounted = false; };
  }, [serviceId, slugs.join("|")]);
  return resolved;
}

function deepMergeNumbers<T>(base: T, override: any): T {
  if (override == null) return base;
  if (typeof base === "number" || typeof base === "string") {
    return (typeof override === "number" || typeof override === "string") ? (override as T) : base;
  }
  if (typeof base === "object" && base !== null && typeof override === "object") {
    const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
    for (const k of Object.keys(base as any)) {
      if (k in override) out[k] = deepMergeNumbers((base as any)[k], override[k]);
    }
    return out;
  }
  return base;
}

export function usePricing<T>(slug: string, defaults: T): T {
  const [cfg, setCfg] = useState<T>(defaults);
  useEffect(() => {
    let alive = true;
    api.getPricing(slug)
      .then((data) => {
        if (alive && data && Object.keys(data).length) setCfg(deepMergeNumbers(defaults, data));
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return cfg;
}

export type Delivery = "Самовывоз" | "Доставка по Тюмени" | "СДЭК (наложенный платёж)";
export const DELIVERY_VALUES: Delivery[] = ["Самовывоз", "Доставка по Тюмени", "СДЭК (наложенный платёж)"];
export const DELIVERY_PRICE: Record<Delivery, number> = {
  "Самовывоз": 0,
  "Доставка по Тюмени": 700,
  "СДЭК (наложенный платёж)": 0,
};

export function PillsField({
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

export function NumberStepper({
  value, setValue, min = 1, step = 1,
  inputValue, onInputChange, onInputBlur,
}: {
  value: number; setValue: (n: number) => void; min?: number; step?: number;
  inputValue?: string; onInputChange?: (raw: string) => void; onInputBlur?: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-ink-200 overflow-hidden w-44">
      <button
        onClick={() => setValue(Math.max(min, value - step))}
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
        onClick={() => setValue(value + step)}
        className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50"
        aria-label="Увеличить"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function QuantityField({
  label = "Тираж, шт.",
  presets, value, onChange, min, max, step = 1, hint,
}: {
  label?: string;
  presets: number[];
  value: number;
  onChange: (n: number) => void;
  min: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);

  const commit = (n: number) => {
    let c = Math.max(min, n);
    if (max != null) c = Math.min(max, c);
    onChange(c);
    setRaw(String(c));
  };

  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {presets.map((q) => (
          <button
            key={q}
            onClick={() => commit(q)}
            className={`px-3 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
              value === q
                ? "bg-brand text-white"
                : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
            }`}
          >
            {q}
          </button>
        ))}
      </div>
      <NumberStepper
        value={value}
        setValue={commit}
        min={min}
        step={step}
        inputValue={raw}
        onInputChange={(r) => { setRaw(r); const p = parseInt(r); if (!isNaN(p) && p > 0) onChange(p); }}
        onInputBlur={() => { const p = parseInt(raw); commit(isNaN(p) || p < min ? min : p); }}
      />
      {hint && <p className="mt-1.5 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}

export function TrackCard({
  active, onClick, icon, title, hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-colors ${
        active
          ? "border-amber-400 bg-amber-50"
          : "border-ink-200 bg-white hover:border-ink-300"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`grid place-items-center w-9 h-9 rounded-md ${
          active ? "bg-amber-500 text-white" : "bg-ink-100 text-ink-700"
        }`}>
          {icon}
        </span>
        <div>
          <p className="font-heading text-[14px] font-bold text-ink-900">{title}</p>
          <p className="text-[11px] text-ink-500">{hint}</p>
        </div>
      </div>
    </button>
  );
}

export function BreakdownRow({
  label, value, hint,
}: { label: string; value?: string; hint?: string }) {
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

export type UploadedFile = { name: string; id: number | null } | null;

export function useUpload() {
  const toast = useToast();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>(null);
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
  return { uploadedFile, handleUpload };
}

export type CheckoutSummary = {

  productLabel: string;

  lines: string[];

  options: Record<string, any>;

  delivery: string;

  quantity: number;

  total: number;
  fileId: number | null;
};

export function CheckoutModal({
  summary, serviceId, onClose,
}: {
  summary: CheckoutSummary;
  serviceId: number | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const { token, refreshCart } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [address, setAddress] = useState("");
  const [adding, setAdding] = useState(false);

  const needsAddress = summary.delivery !== "Самовывоз";

  const addToCartAndGo = async () => {
    if (!token) {
      toast.error("Войдите, чтобы оформить заказ");
      onClose();
      router.push("/login");
      return;
    }
    if (needsAddress && !address.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }
    setAdding(true);
    try {
      const options: Record<string, any> = {
        Товар: summary.productLabel,
        ...summary.options,
        Тираж: summary.quantity,
        Доставка: summary.delivery,
      };
      if (needsAddress) options["Адрес доставки"] = address.trim();
      if (comment.trim()) options.Комментарий = comment.trim();
      if (summary.fileId) options._fileId = summary.fileId;
      const note = [summary.productLabel, ...summary.lines].filter(Boolean).join(" · ");
      await api.addToCart(serviceId || 0, 1, { price: summary.total, options, note }, token);
      await refreshCart();
      toast.success("Добавлено в корзину");
      onClose();
      router.push("/cart");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось добавить в корзину");
    } finally {
      setAdding(false);
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

        <h3 className="font-heading text-xl font-bold text-ink-900">Добавить в корзину</h3>
        <p className="mt-1 text-sm text-ink-600">
          Товар попадёт в корзину — там вы оформите заказ. Менеджер свяжется для подтверждения и оплаты.
        </p>

        <div className="mt-4 rounded-lg bg-ink-50 border border-ink-200 p-3 text-[12px] text-ink-700 space-y-0.5">
          <p className="font-medium text-ink-900">{summary.productLabel}</p>
          {summary.lines.map((l, i) => <p key={i}>{l}</p>)}
          <p className="pt-1 font-semibold text-ink-900">Итого: {summary.total.toLocaleString("ru-RU")} ₽</p>
        </div>

        {needsAddress && (
          <div className="mt-4">
            <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
              Адрес доставки <span className="text-red-500">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Город, улица, дом, квартира/офис"
              className="input w-full"
            />
            <p className="mt-1 text-[11px] text-ink-500">
              {summary.delivery} — укажите, куда доставить заказ.
            </p>
          </div>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий / пожелания к макету (опц.)"
          rows={2}
          className="input mt-4 w-full py-2 resize-none"
        />

        <button
          type="button"
          onClick={addToCartAndGo}
          disabled={adding}
          className="mt-4 w-full h-11 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          <ShoppingCart size={16} />
          {adding ? "Добавляем…" : "Добавить в корзину"}
        </button>

        <p className="mt-3 text-[11px] text-ink-500 text-center">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <Link href="/legal/privacy" className="text-brand hover:underline">политикой обработки данных</Link>
        </p>
      </div>
    </div>
  );
}
