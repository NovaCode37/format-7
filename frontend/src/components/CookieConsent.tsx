"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Cookie } from "@/lib/icons";

const KEY = "f7_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const save = (value: "all" | "required") => {
    localStorage.setItem(KEY, value);
    setVisible(false);

    if (value === "all") window.location.reload();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Согласие на использование cookies"
      className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50"
    >
      <div className="bg-white border border-ink-200 rounded-lg shadow-xl p-5">
        <div className="flex items-start gap-3">
          <Cookie size={20} strokeWidth={2} className="text-brand shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-heading text-[15px] font-semibold text-ink-900 mb-1.5">
              Используем cookies
            </h3>
            <p className="text-[13px] text-ink-600 leading-relaxed">
              Чтобы сайт работал и для аналитики посещений. Подробнее —{" "}
              <Link href="/legal/cookies" className="underline hover:text-ink-900">
                в&nbsp;политике cookies
              </Link>
              .
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => save("all")}
                className="btn-primary btn-sm cursor-pointer"
              >
                Принять все
              </button>
              <button
                type="button"
                onClick={() => save("required")}
                className="btn-secondary btn-sm cursor-pointer"
              >
                Только необходимые
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => save("required")}
            aria-label="Закрыть"
            className="text-ink-400 hover:text-ink-900 cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
