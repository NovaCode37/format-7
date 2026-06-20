"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";
import { STICKER_SHEET_TIERS } from "@/lib/stickerPrices";
import { Loader2 } from "@/lib/icons";

function mergeNumbers(base: any, override: any): any {
  if (override == null) return base;
  if (typeof base === "number" || typeof base === "string") {
    return typeof override === "number" || typeof override === "string" ? override : base;
  }
  if (typeof base === "object" && base) {
    const out: any = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(base)) if (k in override) out[k] = mergeNumbers(base[k], override[k]);
    return out;
  }
  return base;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function setPath(obj: any, path: (string | number)[], value: any): any {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const copy: any = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[head] = setPath(obj?.[head], rest, value);
  return copy;
}

const FIELD_LABELS: Record<string, string> = {
  price: "Цена за штуку (₽)",
  prices: "Цена за лист (₽)",
  lamination: "Ламинация, ₽/шт",
  rounding: "Скругление углов, ₽/шт",
  design: "Разработка макета, ₽",
  design1: "Разработка макета (1 сгиб), ₽",
  design2: "Разработка макета (2+ сгиба), ₽",
  brief: "Цена брифа на дизайн, ₽ (фикс.)",
  products: "Базовая цена шаблона в конструкторе, ₽/шт",
  carton: "Картон — цена за штуку (₽)",
  plastic: "Пластик — цена за штуку (₽)",
  print: "Печать — цена за штуку (₽)",
  page: "Цена страницы (₽)",
  sheet: "Цена листа (₽)",
  scan: "Сканирование — ₽/страница",
  storage: "Запись на наш носитель, ₽",
  bigovka: "Биговка, ₽/шт",
  foilOne: "Фольга (1 сторона), ₽/шт",
  foilTwo: "Фольга (2 стороны), ₽/шт",
  spring: "Пружина, ₽/экз.",
  staple: "Скоба, ₽/экз.",
  hand: "Ручная обработка файлов, ₽",
  minOrder: "Минимальная сумма заказа, ₽",
  packaging: "Упаковка, ₽",
  binding: "Брошюровка, ₽",
  lamPoster: "Ламинация постера, ₽/шт",
  lamBlock: "Ламинация блоков, ₽/шт",
  plasticA4: "Пластиковая пружина А4 (по числу листов)",
  plasticA3: "Пластиковая пружина А3 (по числу листов)",
  metalA4: "Металлическая пружина А4 (по числу листов)",
  metalA3: "Металлическая пружина А3 (по числу листов)",
};

// Подписи для вложенных технических ключей.
const NESTED_LABELS: Record<string, string> = {
  one: "односторонняя",
  combo: "цвет + ч/б",
  two: "двусторонняя",
  maxSheets: "до листов",
  price: "цена, ₽",
  count: "Штук на листе",
  tiers: "Цена за лист по тиражам",
};

export default function AdminPricing({ token }: { token: string }) {
  const toast = useToast();
  const slugs = useMemo(() => Object.keys(PRICING_DEFAULTS), []);
  const [slug, setSlug] = useState(slugs[0] || "");
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.adminGetAllPricing(token)
      .then((all) => {
        const def = PRICING_DEFAULTS[slug].data;
        setMatrix(mergeNumbers(def, all?.[slug] || {}));
      })
      .catch(() => setMatrix(clone(PRICING_DEFAULTS[slug].data)))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const save = async () => {
    setSaving(true);
    try {
      await api.adminPutPricing(token, slug, matrix);
      toast.success("Цены сохранены");
    } catch (e: any) {
      toast.error(e.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!confirm("Сбросить цены этого калькулятора к значениям по умолчанию?")) return;
    setMatrix(clone(PRICING_DEFAULTS[slug].data));
  };

  const update = (path: (string | number)[], value: number) => {
    setMatrix((m: any) => setPath(m, path, value));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="input h-10 w-auto min-w-[200px]"
        >
          {slugs.map((s) => (
            <option key={s} value={s}>{PRICING_DEFAULTS[s].label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={resetDefaults} className="btn btn-sm cursor-pointer">К умолчанию</button>
        <button onClick={save} disabled={saving || loading} className="btn-primary btn-sm cursor-pointer disabled:opacity-60">
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      {loading || !matrix ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(matrix).map(([key, value]) => (
            <div key={key} className="border border-ink-200 rounded-lg p-4">
              <p className="font-heading text-[14px] font-semibold text-ink-900 mb-3">
                {FIELD_LABELS[key] || key}
              </p>
              <Node value={value} path={[key]} onChange={update} />
            </div>
          ))}
          <p className="text-[12px] text-ink-500">
            Изменения применяются к калькулятору сразу после сохранения (у клиента — при следующем открытии).
          </p>
        </div>
      )}
    </div>
  );
}

function Node({
  value, path, onChange,
}: {
  value: any;
  path: (string | number)[];
  onChange: (path: (string | number)[], value: number) => void;
}) {
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(path, Number(e.target.value))}
        className="input h-9 w-24 tabular text-right"
      />
    );
  }
  if (typeof value === "string") {
    return <span className="text-[12px] font-medium text-ink-700">{value}</span>;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    const leafGroup = entries.every(([, v]) => typeof v === "number");
    if (leafGroup) {
      // Цены за лист по тиражам — подписываем колонки числом листов (2/4/8/12/30).
      const isTiers = path[path.length - 1] === "tiers";
      return (
        <div className="flex flex-wrap gap-3">
          {entries.map(([k, v]) => (
            <label key={k} className="flex items-center gap-1.5 text-[12px] text-ink-600">
              <span className="text-right tabular">
                {isTiers ? `${STICKER_SHEET_TIERS[Number(k)] ?? k} шт` : NESTED_LABELS[k] || k}
              </span>
              <Node value={v} path={[...path, k]} onChange={onChange} />
            </label>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {entries
          .filter(([k]) => k !== "label") // label показываем как заголовок строки, отдельно не дублируем
          .map(([k, v]) => (
            <div key={k} className="pl-3 border-l-2 border-ink-100">
              <p className="text-[12px] font-medium text-ink-700 mb-1.5">{nodeHeading(k, v)}</p>
              <Node value={v} path={[...path, k]} onChange={onChange} />
            </div>
          ))}
      </div>
    );
  }
  return null;
}

// Заголовок вложенного блока: для элементов массива размеров используем их label,
// иначе — человекочитаемую подпись из NESTED_LABELS (или сам ключ).
function nodeHeading(key: string, value: any): string {
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.label === "string") {
    return value.label;
  }
  return NESTED_LABELS[key] || key;
}
