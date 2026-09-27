import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

/**
 * Подписи и списки вариантов живут в конфигурации товара, а не в вёрстке.
 * Если поле есть в калькуляторе, но не описано в конфигурации, оно молча
 * отрисуется с идентификатором вместо подписи и без единого варианта.
 * Эти проверки ловят именно такое расхождение.
 */

const COMPONENTS = path.resolve(__dirname, "../components");

interface Found {
  file: string;
  slug: string;
  ids: string[];
}

function collect(): Found[] {
  const out: Found[] = [];
  for (const file of fs.readdirSync(COMPONENTS)) {
    if (!file.endsWith("Calculator.tsx")) continue;
    const raw = fs.readFileSync(path.join(COMPONENTS, file), "utf8");
    const ids = [...raw.matchAll(/<ConfigurableField\s+id="([^"]+)"/g)].map((m) => m[1]);
    if (!ids.length) continue;
    const slug = raw.match(/usePricing\(\s*"([^"]+)"/)?.[1];
    expect(slug, `${file}: не найден usePricing со слагом`).toBeTruthy();
    out.push({ file, slug: slug as string, ids });
  }
  return out;
}

const found = collect();

describe("поля калькуляторов описаны в конфигурации", () => {
  it("калькуляторы вообще найдены", () => {
    expect(found.length).toBeGreaterThan(10);
  });

  it.each(found)("$file: слаг $slug есть в PRICING_DEFAULTS", ({ slug }) => {
    expect(PRICING_DEFAULTS[slug], `нет записи для слага ${slug}`).toBeDefined();
  });

  it.each(found)("$file: у каждого поля есть запись в ui.fields", ({ slug, ids }) => {
    const fields = (PRICING_DEFAULTS[slug].data as any).ui?.fields ?? {};
    const missing = ids.filter((id) => !fields[id]);
    expect(missing, `нет в ui.fields: ${missing.join(", ")}`).toEqual([]);
  });

  it.each(found)("$file: у каждого поля непустая подпись", ({ slug, ids }) => {
    const fields = (PRICING_DEFAULTS[slug].data as any).ui?.fields ?? {};
    const blank = ids.filter((id) => !String(fields[id]?.label ?? "").trim());
    expect(blank, `пустая подпись у: ${blank.join(", ")}`).toEqual([]);
  });
});

describe("сами описания полей корректны", () => {
  const slugs = Object.keys(PRICING_DEFAULTS).filter(
    (s) => (PRICING_DEFAULTS[s].data as any).ui?.fields
  );

  it.each(slugs)("%s: списки вариантов непустые и без дубликатов", (slug) => {
    const fields = (PRICING_DEFAULTS[slug].data as any).ui.fields as Record<string, any>;
    for (const [id, cfg] of Object.entries(fields)) {
      if (!cfg.values) continue; // список вычисляется в коде — это допустимо
      expect(cfg.values.length, `${slug}.${id}: пустой список`).toBeGreaterThan(0);
      expect(
        new Set(cfg.values).size,
        `${slug}.${id}: повторяющиеся варианты`
      ).toBe(cfg.values.length);
      for (const v of cfg.values) {
        expect(typeof v, `${slug}.${id}: вариант не строка`).toBe("string");
        expect(String(v).trim(), `${slug}.${id}: пустой вариант`).not.toBe("");
      }
    }
  });

  it.each(slugs)("%s: пресеты тиража — положительные числа по возрастанию", (slug) => {
    const q = (PRICING_DEFAULTS[slug].data as any).ui.quantities as Record<string, number[]> | undefined;
    if (!q) return;
    for (const [id, list] of Object.entries(q)) {
      expect(Array.isArray(list), `${slug}.${id}: не массив`).toBe(true);
      expect(list.length, `${slug}.${id}: пустой список`).toBeGreaterThan(0);
      for (const n of list) {
        expect(Number.isFinite(n) && n > 0, `${slug}.${id}: ${n} не положительное число`).toBe(true);
      }
      expect([...list].sort((a, b) => a - b), `${slug}.${id}: порядок`).toEqual(list);
    }
  });
});
