"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PRICE_CATEGORIES, PRICE_GROUPS, type PriceCategory, type PriceTable } from "@/lib/prices";
import Reveal, { Stagger, StaggerItem, DrawLine } from "@/components/Reveal";

function PriceTableView({ table }: { table: PriceTable }) {
  return (
    <div className="overflow-x-auto">
      <h4 className="text-[13px] font-semibold text-ink-900 mb-3">{table.title}</h4>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {table.columns.map((col, i) => (
              <th
                key={i}
                className={`py-2.5 px-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-500 border-b border-ink-200 text-left whitespace-nowrap ${
                  i === 0 ? "pl-0" : ""
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-ink-100 last:border-b-0">
              <td className="py-2.5 pl-0 pr-3 text-ink-900 font-medium whitespace-nowrap">
                {row.label}
              </td>
              {row.prices.map((p, pi) => (
                <td
                  key={pi}
                  className="py-2.5 px-3 tabular text-ink-700 whitespace-nowrap"
                >
                  {p !== null ? `${p} ₽` : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryCard({ cat }: { cat: PriceCategory }) {
  const [expanded, setExpanded] = useState(false);
  const visibleTables = expanded ? cat.tables : cat.tables.slice(0, 1);

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-10 h-10 grid place-items-center rounded-md bg-ink-100 text-ink-700 font-heading text-lg font-semibold"
          >
            {cat.icon}
          </span>
          <div>
            <h3 className="h-card">{cat.name}</h3>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
              {cat.group}
            </span>
          </div>
        </div>
        <Link
          href="/calculator"
          className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 hover:text-brand transition-colors shrink-0"
        >
          Рассчитать
          <ArrowRight size={12} strokeWidth={1.75} />
        </Link>
      </div>

      <div className="space-y-6">
        {visibleTables.map((table, ti) => (
          <PriceTableView key={ti} table={table} />
        ))}
      </div>

      {cat.tables.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-[13px] font-medium text-brand hover:text-brand-dark transition-colors cursor-pointer"
        >
          {expanded
            ? "Свернуть"
            : `Ещё ${cat.tables.length - 1} ${cat.tables.length - 1 === 1 ? "таблица" : "таблиц"}`}
        </button>
      )}

      {cat.notes.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ink-100">
          <ul className="space-y-1">
            {cat.notes.map((n, i) => (
              <li key={i} className="text-[12px] text-ink-500">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function PricesPage() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = PRICE_CATEGORIES;
    if (activeGroup) {
      list = list.filter((c) => c.group === activeGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.tables.some((t) =>
            t.title.toLowerCase().includes(q) ||
            t.rows.some((r) => r.label.toLowerCase().includes(q))
          )
      );
    }
    return list;
  }, [activeGroup, search]);

  return (
    <div className="bg-white min-h-screen">

      <div className="border-b border-ink-200">
        <div className="container-page py-3 text-[12px] text-ink-400">
          <Link href="/" className="hover:text-ink-900 transition-colors">
            Главная
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-700">Цены</span>
        </div>
      </div>

      <section className="border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <Reveal>
            <p className="eyebrow mb-4">Прайс-лист</p>
            <h1 className="h-display mb-4">
              Цены на все услуги
              <br />
              <span className="text-ink-400">типографии Format7</span>
            </h1>
            <p className="lead text-ink-600 max-w-xl">
              Актуальные цены на {PRICE_CATEGORIES.length}&nbsp;категорий продукции.
              Стоимость за&nbsp;единицу в&nbsp;рублях, зависит от&nbsp;тиража.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">

        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">

            <div className="relative w-full sm:w-auto sm:min-w-[280px]">
              <Search
                size={15}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Поиск по категориям..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 h-10"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className={`px-3 h-8 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                  activeGroup === null
                    ? "bg-ink-900 text-white"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                }`}
              >
                Все
              </button>
              {PRICE_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                  className={`px-3 h-8 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                    activeGroup === g
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mb-6 text-[13px] text-ink-500">
          {filtered.length === PRICE_CATEGORIES.length
            ? `${PRICE_CATEGORIES.length} категорий`
            : `Найдено: ${filtered.length}`}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-500 mb-4">Ничего не найдено</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveGroup(null);
              }}
              className="btn-secondary btn-sm cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5" stagger={0.04}>
            {filtered.map((cat) => (
              <StaggerItem key={cat.slug}>
                <CategoryCard cat={cat} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        <Reveal className="mt-16 sm:mt-20">
          <DrawLine className="mb-8" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-ink-900 font-semibold">Нужен точный расчёт?</p>
              <p className="text-[13px] text-ink-500 mt-1">
                Используйте калькулятор или оформите заказ через конструктор
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/calculator" className="btn-primary btn-sm">
                Калькулятор
                <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
              <Link href="/designer" className="btn-secondary btn-sm">
                Конструктор
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
