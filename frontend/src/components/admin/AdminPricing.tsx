"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";
import { STICKER_SHEET_TIERS } from "@/lib/stickerPrices";
import { Loader2, Search, ChevronDown } from "@/lib/icons";

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

// Раздел ui хранит подписи и списки значений, а не числа, и администратор может
// добавлять туда ключи, которых нет в дефолтах. Поэтому здесь слияние, которое
// не выбрасывает незнакомое, в отличие от mergeNumbers выше.
function mergeUi(base: any, override: any): any {
  if (override === undefined) return base;
  if (Array.isArray(override)) return [...override];
  if (override === null || typeof override !== "object") return override;
  const out: any = { ...(base && typeof base === "object" ? base : {}) };
  for (const k of Object.keys(override)) out[k] = mergeUi(out[k], override[k]);
  return out;
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

const NESTED_LABELS: Record<string, string> = {
  one: "односторонняя",
  combo: "цвет + ч/б",
  two: "двусторонняя",
  maxSheets: "до листов",
  price: "цена, ₽",
  count: "Штук на листе",
  tiers: "Цена за лист по тиражам",
};

function keyLabel(key: string): string {
  if (/^\d+$/.test(key)) return `${key} шт`;
  return NESTED_LABELS[key] || key;
}

function isPlainObject(v: any): boolean {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isLeafGroup(v: any): boolean {
  if (!isPlainObject(v)) return false;
  const vals = Object.values(v);
  return vals.length > 0 && vals.every((x) => typeof x === "number");
}

function isTableGroup(v: any): boolean {
  if (!isPlainObject(v)) return false;
  const vals = Object.values(v);
  return vals.length > 1 && vals.every(isLeafGroup);
}

function isObjectArray(v: any): boolean {
  return Array.isArray(v) && v.length > 0 && v.every((x) => isPlainObject(x));
}

function isNumberArray(v: any): boolean {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number");
}

const PAGE_TIER_LABELS = ["1–10", "11–50", "51–100", "101–300", "301–500", "от 501"];

function nodeHeading(key: string, value: any): string {
  if (isPlainObject(value)) {
    if (typeof value.label === "string") return value.label;
    if (typeof value.maxSheets === "number") return `до ${value.maxSheets} листов`;
  }
  return keyLabel(key);
}

export default function AdminPricing({ token }: { token: string }) {
  const toast = useToast();
  const slugs = useMemo(() => Object.keys(PRICING_DEFAULTS), []);
  const [slug, setSlug] = useState(slugs[0] || "");
  const [matrix, setMatrix] = useState<any>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const dirty = matrix != null && JSON.stringify(matrix) !== savedSnapshot;

  useEffect(() => {
    setLoading(true);
    api.adminGetAllPricing(token)
      .then((all) => {
        const def = PRICING_DEFAULTS[slug].data;
        const stored = all?.[slug] || {};
        const { ui: uiStored, ...numbers } = stored as any;
        const merged = mergeNumbers(def, numbers);
        if ((def as any).ui || uiStored) merged.ui = mergeUi((def as any).ui, uiStored);
        setMatrix(merged);
        setSavedSnapshot(JSON.stringify(merged));
      })
      .catch(() => {
        const def = clone(PRICING_DEFAULTS[slug].data);
        setMatrix(def);
        setSavedSnapshot(JSON.stringify(def));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const changeSlug = (next: string) => {
    if (next === slug) return;
    if (dirty && !confirm("Есть несохранённые изменения — они будут потеряны. Продолжить?")) return;
    setSlug(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.adminPutPricing(token, slug, matrix);
      setSavedSnapshot(JSON.stringify(matrix));
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

  // ui редактируется отдельным блоком ниже: там подписи и списки, а не числа.
  const topEntries = matrix ? Object.entries(matrix).filter(([k]) => k !== "ui") : [];
  const q = query.trim().toLowerCase();
  const visibleKeys = q
    ? new Set(topEntries.filter(([k]) => (FIELD_LABELS[k] || k).toLowerCase().includes(q)).map(([k]) => k))
    : null;

  const toggle = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white pb-3 mb-3 border-b border-ink-200">
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <select
            value={slug}
            onChange={(e) => changeSlug(e.target.value)}
            className="input h-10 w-auto min-w-[200px]"
          >
            {slugs.map((s) => (
              <option key={s} value={s}>{PRICING_DEFAULTS[s].label}</option>
            ))}
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск раздела…"
              className="input h-10 pl-8 w-56"
            />
          </div>

          {dirty && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 h-7">
              Не сохранено
            </span>
          )}

          <div className="flex-1" />
          <button onClick={resetDefaults} className="btn btn-sm cursor-pointer">К умолчанию</button>
          <button onClick={save} disabled={saving || loading || !dirty} className="btn-primary btn-sm cursor-pointer disabled:opacity-60">
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>

      {loading || !matrix ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>
      ) : (
        <div className="space-y-4">
          {matrix.ui && (
            <UiEditor
              ui={matrix.ui}
              onChange={(next) => setMatrix((m: any) => ({ ...m, ui: next }))}
            />
          )}
          {topEntries.map(([key, value]) => {
            if (visibleKeys && !visibleKeys.has(key)) return null;
            const isCollapsed = !!collapsed[key];
            return (
              <div key={key} className="border border-ink-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-ink-50/60 hover:bg-ink-50 transition-colors cursor-pointer"
                >
                  <span className="font-heading text-[14px] font-semibold text-ink-900">
                    {FIELD_LABELS[key] || key}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-ink-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="p-4 pt-3">
                    <Node value={value} path={[key]} onChange={update} />
                  </div>
                )}
              </div>
            );
          })}
          {visibleKeys && visibleKeys.size === 0 && (
            <p className="text-center text-ink-400 py-10 text-sm">Ничего не найдено по запросу «{query}»</p>
          )}
          <p className="text-[12px] text-ink-500">
            Изменения применяются к калькулятору сразу после сохранения (у клиента — при следующем открытии).
          </p>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  value, onChange, className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-9 px-1.5 bg-white border border-ink-200 rounded-lg text-sm text-ink-900
        outline-none transition-colors duration-150 focus:border-brand
        tabular text-right [appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${className}`}
    />
  );
}

function LeafGroupGrid({
  value, path, onChange,
}: {
  value: Record<string, number>;
  path: (string | number)[];
  onChange: (path: (string | number)[], value: number) => void;
}) {
  const isTiers = path[path.length - 1] === "tiers";
  const entries = Object.entries(value);
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([k, v]) => (
        <label key={k} className="flex flex-col gap-1 text-[11px] text-ink-500 bg-ink-50/60 rounded-md px-2 py-1.5">
          <span className="tabular whitespace-nowrap">
            {isTiers ? `${STICKER_SHEET_TIERS[Number(k)] ?? k} шт` : keyLabel(k)}
          </span>
          <NumberInput value={v} onChange={(n) => onChange([...path, k], n)} className="w-24" />
        </label>
      ))}
    </div>
  );
}

function NumberArrayGrid({
  value, path, onChange,
}: {
  value: number[];
  path: (string | number)[];
  onChange: (path: (string | number)[], value: number) => void;
}) {
  const labels = value.length === PAGE_TIER_LABELS.length ? PAGE_TIER_LABELS : value.map((_, i) => `#${i + 1}`);
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((v, i) => (
        <label key={i} className="flex flex-col gap-1 text-[11px] text-ink-500 bg-ink-50/60 rounded-md px-2 py-1.5">
          <span className="tabular whitespace-nowrap">{labels[i]}</span>
          <NumberInput value={v} onChange={(n) => onChange([...path, i], n)} className="w-20" />
        </label>
      ))}
    </div>
  );
}

function TableGroup({
  value, path, onChange,
}: {
  value: Record<string, Record<string, number>>;
  path: (string | number)[];
  onChange: (path: (string | number)[], value: number) => void;
}) {
  const rowKeys = Object.keys(value);
  const colKeys = Array.from(
    rowKeys.reduce((set, rk) => {
      Object.keys(value[rk]).forEach((ck) => set.add(ck));
      return set;
    }, new Set<string>())
  );
  return (
    <div className="overflow-x-auto">
      <table className="text-[12px] border-collapse">
        <thead>
          <tr>
            <th className="text-left font-medium text-ink-500 pr-4 pb-2"> </th>
            {colKeys.map((ck) => (
              <th key={ck} className="text-right font-medium text-ink-500 px-2 pb-2 tabular whitespace-nowrap">
                {keyLabel(ck)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rk) => (
            <tr key={rk} className="border-t border-ink-100">
              <td className="py-1.5 pr-4 font-medium text-ink-700 whitespace-nowrap">{keyLabel(rk)}</td>
              {colKeys.map((ck) => (
                <td key={ck} className="py-1.5 px-1">
                  {ck in value[rk] ? (
                    <NumberInput
                      value={value[rk][ck]}
                      onChange={(n) => onChange([...path, rk, ck], n)}
                      className="w-20"
                    />
                  ) : (
                    <span className="block text-center text-ink-300">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectArrayTable({
  value, path, onChange,
}: {
  value: any[];
  path: (string | number)[];
  onChange: (path: (string | number)[], value: number) => void;
}) {
  const hasLabel = typeof value[0]?.label === "string";
  const dataKeys = Object.keys(value[0]).filter((k) => k !== "label");

  type Col = { key: string; sub?: number; heading: string };
  const columns: Col[] = [];
  for (const k of dataKeys) {
    const sample = value[0][k];
    if (Array.isArray(sample)) {
      sample.forEach((_, i) => {
        columns.push({
          key: k,
          sub: i,
          heading: k === "tiers" ? `${STICKER_SHEET_TIERS[i] ?? i} шт` : `#${i + 1}`,
        });
      });
    } else {
      columns.push({ key: k, heading: keyLabel(k) });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[12px] border-collapse w-full">
        <thead>
          <tr>
            {hasLabel && <th className="text-left font-medium text-ink-500 pr-4 pb-2">Размер</th>}
            {columns.map((c, i) => (
              <th key={i} className="text-right font-medium text-ink-500 px-2 pb-2 tabular whitespace-nowrap">
                {c.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.map((item, idx) => (
            <tr key={idx} className="border-t border-ink-100">
              {hasLabel && <td className="py-1.5 pr-4 font-medium text-ink-700 whitespace-nowrap">{item.label}</td>}
              {columns.map((c, i) => {
                const itemPath = c.sub !== undefined ? [...path, idx, c.key, c.sub] : [...path, idx, c.key];
                const v = c.sub !== undefined ? item[c.key][c.sub] : item[c.key];
                return (
                  <td key={i} className="py-1.5 px-1">
                    <NumberInput value={v} onChange={(n) => onChange(itemPath, n)} className="w-20" />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
    return <NumberInput value={value} onChange={(n) => onChange(path, n)} className="w-28" />;
  }
  if (typeof value === "string") {
    return <span className="text-[12px] font-medium text-ink-700">{value}</span>;
  }
  if (isObjectArray(value)) {
    return <ObjectArrayTable value={value} path={path} onChange={onChange} />;
  }
  if (isNumberArray(value)) {
    return <NumberArrayGrid value={value} path={path} onChange={onChange} />;
  }
  if (isTableGroup(value)) {
    return <TableGroup value={value} path={path} onChange={onChange} />;
  }
  if (isLeafGroup(value)) {
    return <LeafGroupGrid value={value} path={path} onChange={onChange} />;
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([k]) => k !== "label");
    return (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
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

/**
 * Редактор раздела ui: подписи полей, списки значений, скрытие и пресеты тиража.
 * Всё, что раньше правилось только в коде калькулятора.
 */
function UiEditor({ ui, onChange }: { ui: any; onChange: (next: any) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const fields: Record<string, any> = ui?.fields || {};
  const quantities: Record<string, any> = ui?.quantities || {};

  const patchField = (id: string, patch: any) =>
    onChange({ ...ui, fields: { ...fields, [id]: { ...fields[id], ...patch } } });

  const patchValues = (id: string, values: string[]) => patchField(id, { values });

  return (
    <div className="border border-ink-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-amber-50/70 hover:bg-amber-50 transition-colors cursor-pointer"
      >
        <span className="font-heading text-[14px] font-semibold text-ink-900">
          Поля калькулятора: подписи, варианты, видимость
        </span>
        <ChevronDown size={16} className={`text-ink-400 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>

      {!collapsed && (
        <div className="p-4 pt-3 space-y-5">
          <p className="text-[12px] text-ink-500">
            Здесь меняется то, что видит клиент: как называется поле, какие у него варианты и
            показывать ли его вообще. Цены по-прежнему ниже. Скрытое поле исчезает из калькулятора,
            а из заказа уходит значение по умолчанию.
          </p>

          {Object.keys(fields).length === 0 && (
            <p className="text-[12px] text-ink-500">Для этого калькулятора поля пока не описаны.</p>
          )}

          {Object.entries(fields).map(([id, cfg]: [string, any]) => (
            <div key={id} className="rounded-lg border border-ink-200 p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <code className="text-[11px] text-ink-500 bg-ink-50 rounded px-1.5 py-0.5">{id}</code>
                <input
                  value={cfg?.label ?? ""}
                  onChange={(e) => patchField(id, { label: e.target.value })}
                  placeholder="Подпись поля"
                  className="input h-9 flex-1 min-w-[180px]"
                />
                <label className="inline-flex items-center gap-1.5 text-[12px] text-ink-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!cfg?.hidden}
                    onChange={(e) => patchField(id, { hidden: e.target.checked })}
                  />
                  Скрыть поле
                </label>
              </div>

              {!cfg?.hidden && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Варианты</p>
                  {(cfg?.values || []).map((v: string, i: number) => (
                    <div key={`${id}-${i}`} className="flex items-center gap-2">
                      <input
                        value={v}
                        onChange={(e) => {
                          const next = [...(cfg.values || [])];
                          next[i] = e.target.value;
                          patchValues(id, next);
                        }}
                        className="input h-9 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => patchValues(id, (cfg.values || []).filter((_: string, j: number) => j !== i))}
                        className="btn btn-sm cursor-pointer"
                        title="Убрать вариант"
                      >
                        Убрать
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => patchValues(id, [...(cfg?.values || []), "Новый вариант"])}
                    className="btn btn-sm cursor-pointer"
                  >
                    Добавить вариант
                  </button>
                  <p className="text-[11px] text-ink-500">
                    Если у варианта есть своя цена, она задаётся ниже, в разделе с таким же названием.
                    Вариант без цены считается бесплатным.
                  </p>
                </div>
              )}
            </div>
          ))}

          {Object.keys(quantities).length > 0 && (
            <div className="rounded-lg border border-ink-200 p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-ink-500">Быстрый выбор тиража</p>
              {Object.entries(quantities).map(([id, list]: [string, any]) => (
                <div key={id} className="flex flex-wrap items-center gap-2">
                  <code className="text-[11px] text-ink-500 bg-ink-50 rounded px-1.5 py-0.5">{id}</code>
                  <input
                    defaultValue={(Array.isArray(list) ? list : []).join(", ")}
                    onBlur={(e) => {
                      const nums = e.target.value
                        .split(",")
                        .map((s) => Number(s.trim()))
                        .filter((n) => Number.isFinite(n) && n > 0);
                      onChange({ ...ui, quantities: { ...quantities, [id]: nums } });
                    }}
                    placeholder="1, 5, 10"
                    className="input h-9 flex-1 min-w-[200px]"
                  />
                </div>
              ))}
              <p className="text-[11px] text-ink-500">
                Числа через запятую. Это только кнопки быстрого выбора, вручную клиент всё равно
                может ввести любой тираж.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
