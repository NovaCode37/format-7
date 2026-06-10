"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import Reveal, { Stagger, StaggerItem, DrawLine } from "./Reveal";

const COLUMNS = [
  {
    title: "Компания",
    links: [
      { label: "О компании", href: "#" },
      { label: "Контакты", href: "/contacts" },
    ],
  },
  {
    title: "Услуги",
    links: [
      { label: "Печать документов", href: "/services/копирование-и-печать-документов" },
      { label: "Полиграфия", href: "/services/оперативная-полиграфия" },
      { label: "Копирование", href: "/services/копирование-и-печать-документов" },
      { label: "Сканирование", href: "/services/сканирование-документов" },
      { label: "Ламинирование", href: "/services/ламинирование" },
      { label: "Брошюровка", href: "/services/переплёт-и-брошюровка" },
    ],
  },
  {
    title: "Покупателям",
    links: [
      { label: "Калькулятор заказа", href: "/calculator" },
      { label: "Заказать онлайн", href: "/designer" },
      { label: "Цены", href: "/prices" },
      { label: "Статус заказа", href: "/order-status" },
      { label: "Корзина", href: "/cart" },
      { label: "Отзывы", href: "/reviews" },
    ],
  },
  {
    title: "Документы",
    links: [
      { label: "Публичная оферта", href: "/legal/offer" },
      { label: "Политика ПДн", href: "/legal/privacy" },
      { label: "Политика cookies", href: "/legal/cookies" },
    ],
  },
];

export default function Footer() {
  const [subEmail, setSubEmail] = useState("");
  const [subMsg, setSubMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    try {
      await api.subscribe(subEmail);
      setSubMsg({ kind: "ok", text: "Вы подписаны." });
      setSubEmail("");
    } catch (err: any) {
      setSubMsg({ kind: "err", text: err?.message || "Ошибка отправки" });
    }
    setTimeout(() => setSubMsg(null), 3000);
  };

  return (
    <footer className="bg-ink-50 border-t border-ink-200 text-ink-600 text-sm">
      <div className="container-page py-16">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">

          <Reveal className="col-span-12 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <img src="/logo.png" alt="Формат7" className="h-10 w-auto" />
            </Link>
            <p className="text-ink-600 leading-relaxed max-w-sm">
              Типография полного цикла в&nbsp;Тюмени. Печать, копицентр, сувенирная
              продукция, текстиль. Работаем с&nbsp;2010&nbsp;года.
            </p>
            <p className="mt-3 text-ink-500">
              <a
                href="mailto:Format7-tmn@yandex.ru"
                className="text-ink-700 hover:text-brand transition-colors"
              >
                Format7-tmn@yandex.ru
              </a>
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 max-w-sm">
              <label
                htmlFor="footer-subscribe"
                className="block text-[12px] uppercase tracking-[0.18em] font-semibold text-ink-700 mb-2"
              >
                Рассылка о&nbsp;скидках
              </label>
              <div className="flex gap-2">
                <input
                  id="footer-subscribe"
                  type="email"
                  placeholder="you@example.com"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="input h-10"
                  required
                />
                <button
                  type="submit"
                  aria-label="Подписаться"
                  className="btn-dark btn-sm shrink-0"
                >
                  <ArrowRight size={15} strokeWidth={1.75} />
                </button>
              </div>
              {subMsg && (
                <p
                  role="status"
                  className={`mt-2 text-xs ${
                    subMsg.kind === "ok" ? "text-ink-700" : "text-red-600"
                  }`}
                >
                  {subMsg.text}
                </p>
              )}
            </form>
          </Reveal>

          {COLUMNS.map((col, colIdx) => (
            <Reveal
              key={col.title}
              as="div"
              delay={0.05 * (colIdx + 1)}
              className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-auto"
            >
            <nav
              aria-label={col.title}
            >
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-900 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-ink-600 hover:text-ink-900 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            </Reveal>
          ))}

          <Reveal className="col-span-12 sm:col-span-6 lg:col-span-2" delay={0.2}>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-900 mb-4">
              Контакты
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="tel:+79324759511"
                  className="text-ink-700 hover:text-brand transition-colors tabular"
                >
                  +7 932 475-95-11
                </a>
              </li>
              <li>
                <a
                  href="https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-ink-700 hover:text-brand transition-colors"
                >
                  <MessageCircle size={14} strokeWidth={1.75} /> Написать в MAX
                </a>
              </li>
              <li className="text-ink-600">г.&nbsp;Тюмень, ул.&nbsp;Широтная, д.&nbsp;113, к1 стр1, офис&nbsp;7</li>
              <li className="text-ink-500 text-[13px]">
                Пн–Пт 9:00–19:00
                <br />
                Сб 10:00–16:00
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="mt-14 pt-6 border-t border-ink-200 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-500">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="#" className="hover:text-ink-900 transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="#" className="hover:text-ink-900 transition-colors">
              Пользовательское соглашение
            </Link>
            <Link href="#" className="hover:text-ink-900 transition-colors">
              Политика cookies
            </Link>
          </div>
          <span>© {new Date().getFullYear()} ООО «Формат7», Тюмень</span>
        </div>
      </div>
    </footer>
  );
}
