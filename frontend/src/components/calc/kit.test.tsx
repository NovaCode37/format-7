import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigurableField, quantityPresets, fieldConfig } from "./kit";

/**
 * ConfigurableField — это то место, через которое админка управляет видом
 * калькулятора. Важны три вещи: что настройка перебивает код, что скрытое
 * поле исчезает, и что выбор не остаётся на варианте, которого больше нет.
 */

const pricing = {
  ui: {
    fields: {
      spring: { label: "Цвет пружины", values: ["Белый", "Чёрный"] },
      hidden: { label: "Скрытое", values: ["Да", "Нет"], hidden: true },
      renamed: { label: "Бумага постера и подложки", values: ["Матовая"] },
      withHint: { label: "С подсказкой", values: ["А"], hint: "из настроек" },
    },
    quantities: { quantity: [1, 5, 10] },
  },
};

describe("ConfigurableField", () => {
  it("берёт подпись и варианты из настроек, а не из кода", () => {
    render(
      <ConfigurableField
        id="spring"
        pricing={pricing}
        label="Подпись из кода"
        values={["Из кода"]}
        value="Белый"
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Цвет пружины:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Белый" })).toBeInTheDocument();
    expect(screen.queryByText("Подпись из кода:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Из кода" })).not.toBeInTheDocument();
  });

  it("скрытое поле не отрисовывается совсем", () => {
    const { container } = render(
      <ConfigurableField id="hidden" pricing={pricing} value="Да" onChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("переименование поля доезжает до экрана", () => {
    render(
      <ConfigurableField id="renamed" pricing={pricing} value="Матовая" onChange={() => {}} />
    );
    expect(screen.getByText("Бумага постера и подложки:")).toBeInTheDocument();
  });

  it("подсказка из настроек перебивает подсказку из кода", () => {
    render(
      <ConfigurableField
        id="withHint"
        pricing={pricing}
        value="А"
        hint="из кода"
        onChange={() => {}}
      />
    );
    expect(screen.getByText("из настроек")).toBeInTheDocument();
    expect(screen.queryByText("из кода")).not.toBeInTheDocument();
  });

  it("если поле не описано в настройках, работает то, что передали в коде", () => {
    render(
      <ConfigurableField
        id="unknown"
        pricing={pricing}
        label="Запасная подпись"
        values={["Раз", "Два"]}
        value="Раз"
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Запасная подпись:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Два" })).toBeInTheDocument();
  });

  it("не отрисовывается, если вариантов нет ни в настройках, ни в коде", () => {
    const { container } = render(
      <ConfigurableField id="unknown" pricing={pricing} label="Пусто" value="" onChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("переключает выбор, если текущий вариант убрали из списка", () => {
    const onChange = vi.fn();
    render(
      <ConfigurableField
        id="spring"
        pricing={pricing}
        value="Золотистый"
        onChange={onChange}
      />
    );
    // «Золотистый» в настройках больше нет: иначе расчёт молча ушёл бы не туда
    expect(onChange).toHaveBeenCalledWith("Белый");
  });

  it("не дёргает onChange, когда текущий вариант на месте", () => {
    const onChange = vi.fn();
    render(
      <ConfigurableField id="spring" pricing={pricing} value="Чёрный" onChange={onChange} />
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("не переключает выбор у скрытого поля", () => {
    const onChange = vi.fn();
    render(
      <ConfigurableField id="hidden" pricing={pricing} value="Чего-то нет" onChange={onChange} />
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("fieldConfig", () => {
  it("возвращает пустой объект, когда настроек нет", () => {
    expect(fieldConfig(undefined, "spring")).toEqual({});
    expect(fieldConfig({}, "spring")).toEqual({});
    expect(fieldConfig({ ui: {} }, "spring")).toEqual({});
  });

  it("достаёт настройку поля", () => {
    expect(fieldConfig(pricing, "spring").label).toBe("Цвет пружины");
  });
});

describe("quantityPresets", () => {
  it("берёт список из настроек", () => {
    expect(quantityPresets(pricing, "quantity", [100])).toEqual([1, 5, 10]);
  });

  it("возвращает запасной список, когда в настройках ничего нет", () => {
    expect(quantityPresets({}, "quantity", [100, 200])).toEqual([100, 200]);
    expect(quantityPresets(undefined, "quantity", [100])).toEqual([100]);
  });

  it("выкидывает мусор и неположительные значения", () => {
    const cfg = { ui: { quantities: { quantity: [10, "20", "мусор", 0, -5, null] } } };
    expect(quantityPresets(cfg, "quantity", [1])).toEqual([10, 20]);
  });

  it("возвращает запасной список, если после чистки ничего не осталось", () => {
    const cfg = { ui: { quantities: { quantity: ["мусор", 0] } } };
    expect(quantityPresets(cfg, "quantity", [7])).toEqual([7]);
  });
});
