import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { usePricing } from "./kit";

vi.mock("@/lib/api", () => ({ api: { getPricing: vi.fn() } }));
import { api } from "@/lib/api";

const getPricing = api.getPricing as unknown as ReturnType<typeof vi.fn>;

const DEFAULTS = {
  price: { "А4": { "1": 100, "10": 80 } },
  lamination: 25,
  ui: {
    fields: {
      spring: { label: "Цвет пружины", values: ["Белый", "Золотистый", "Чёрный"] },
      paper: { label: "Бумага", values: ["Матовая", "Глянцевая"] },
    },
    quantities: { quantity: [1, 5, 10] },
  },
};

function Probe({ stored }: { stored: any }) {
  getPricing.mockResolvedValue(stored);
  const cfg: any = usePricing("тест", DEFAULTS);
  return <pre data-testid="out">{JSON.stringify(cfg)}</pre>;
}

beforeEach(() => {
  getPricing.mockReset();
});

describe("usePricing: числовая часть", () => {
  it("сохранённая цена перебивает цену из кода", async () => {
    const cfg = await waitForMerge({ price: { "А4": { "1": 150 } } });
    expect(cfg.price["А4"]["1"]).toBe(150);
    expect(cfg.price["А4"]["10"]).toBe(80); // не тронутое остаётся из кода
  });

  it("при ошибке запроса остаются значения из кода", async () => {
    getPricing.mockRejectedValue(new Error("нет сети"));
    render(<Probe stored={undefined} />);
    await waitFor(() => expect(getPricing).toHaveBeenCalled());
    const cfg = JSON.parse(screen.getByTestId("out").textContent || "{}");
    expect(cfg.lamination).toBe(25);
  });
});

describe("usePricing: раздел ui", () => {
  it("список вариантов заменяется целиком, а не дополняется", async () => {
    const cfg = await waitForMerge({
      ui: { fields: { spring: { values: ["Белый"] } } },
    });
    // если бы массивы сливались поэлементно, здесь осталось бы три варианта
    expect(cfg.ui.fields.spring.values).toEqual(["Белый"]);
    // подпись не трогали — она остаётся из кода
    expect(cfg.ui.fields.spring.label).toBe("Цвет пружины");
  });

  it("можно добавить вариант, которого нет в коде", async () => {
    const cfg = await waitForMerge({
      ui: { fields: { spring: { values: ["Белый", "Розовый"] } } },
    });
    expect(cfg.ui.fields.spring.values).toContain("Розовый");
  });

  it("можно добавить целое поле, которого нет в коде", async () => {
    const cfg = await waitForMerge({
      ui: { fields: { newField: { label: "Новое поле", values: ["Раз"] } } },
    });
    expect(cfg.ui.fields.newField.label).toBe("Новое поле");
    // и при этом не потерять описанные в коде
    expect(cfg.ui.fields.paper.label).toBe("Бумага");
  });

  it("поле можно скрыть", async () => {
    const cfg = await waitForMerge({ ui: { fields: { paper: { hidden: true } } } });
    expect(cfg.ui.fields.paper.hidden).toBe(true);
    expect(cfg.ui.fields.paper.values).toEqual(["Матовая", "Глянцевая"]);
  });

  it("пресеты тиража заменяются целиком", async () => {
    const cfg = await waitForMerge({ ui: { quantities: { quantity: [1] } } });
    expect(cfg.ui.quantities.quantity).toEqual([1]);
  });

  it("пустой ответ ничего не ломает", async () => {
    const cfg = await waitForMerge({});
    expect(cfg.ui.fields.spring.values).toHaveLength(3);
    expect(cfg.lamination).toBe(25);
  });
});

async function waitForMerge(stored: any) {
  getPricing.mockResolvedValue(stored);
  render(<Probe stored={stored} />);
  await waitFor(() => {
    const cfg = JSON.parse(screen.getByTestId("out").textContent || "{}");
    // ждём, пока слияние применится; для пустого ответа состояние не меняется
    if (stored && Object.keys(stored).length) {
      expect(JSON.stringify(cfg)).not.toBe(JSON.stringify(DEFAULTS));
    }
  });
  return JSON.parse(screen.getByTestId("out").textContent || "{}");
}
