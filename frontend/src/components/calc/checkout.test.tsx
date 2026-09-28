import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const addToCart = vi.fn();
const toastError = vi.fn();

vi.mock("@/lib/api", () => ({ api: { addToCart: (...a: unknown[]) => addToCart(...a), getPricing: vi.fn() } }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ token: "t", refreshCart: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../Toast", () => ({ useToast: () => ({ error: toastError, success: vi.fn() }) }));

import { CheckoutModal, fmt } from "./kit";

function summary(total: number) {
  return {
    productLabel: "Блокнот А5",
    lines: ["А5 · 10 шт."],
    options: {},
    delivery: "Самовывоз",
    quantity: 10,
    total,
    fileId: null,
  };
}

beforeEach(() => {
  addToCart.mockReset();
  toastError.mockReset();
});

describe("fmt", () => {
  it("не показывает NaN покупателю", () => {
    expect(fmt(Number.NaN)).not.toContain("NaN");
    expect(fmt(Number.POSITIVE_INFINITY)).not.toContain("∞");
  });

  it("обычные числа форматирует как раньше", () => {
    expect(fmt(1500)).toBe((1500).toLocaleString("ru-RU"));
  });
});

describe("CheckoutModal без цены", () => {
  it("не кладёт в корзину позицию с NaN", () => {
    render(<CheckoutModal summary={summary(Number.NaN)} serviceId={1} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /в корзину/i }));
    expect(addToCart).not.toHaveBeenCalled();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it("не кладёт в корзину позицию с нулевой суммой", () => {
    render(<CheckoutModal summary={summary(0)} serviceId={1} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /в корзину/i }));
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("нормальную сумму пропускает", () => {
    addToCart.mockResolvedValue({});
    render(<CheckoutModal summary={summary(1200)} serviceId={1} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /в корзину/i }));
    expect(addToCart).toHaveBeenCalledTimes(1);
  });
});
