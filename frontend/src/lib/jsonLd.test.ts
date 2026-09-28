import { describe, it, expect } from "vitest";
import { jsonLdScript } from "./jsonLd";

describe("jsonLdScript", () => {
  it("не даёт закрыть тег script из данных", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("экранирует амперсанд и разделители строк", () => {
    const ls = String.fromCodePoint(0x2028);
    const ps = String.fromCodePoint(0x2029);
    const out = jsonLdScript({ a: "x&y" + ls + ps });
    expect(out).not.toContain("&");
    expect(out).not.toContain(ls);
    expect(out).not.toContain(ps);
  });

  it("остаётся валидным JSON с теми же данными", () => {
    const data = { name: "</script>&<b>", n: 5, list: ["a<b", "c>d"] };
    expect(JSON.parse(jsonLdScript(data))).toEqual(data);
  });

  it("кириллица и обычный текст не меняются", () => {
    const data = { name: "Визитки в Тюмени" };
    expect(jsonLdScript(data)).toBe(JSON.stringify(data));
  });
});
