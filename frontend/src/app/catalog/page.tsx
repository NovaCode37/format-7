"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowRight, Loader2, ImageOff } from "@/lib/icons";
import { api, resolveImageUrl, type Category } from "@/lib/api";

type CatalogItem = {
  title: string;
  slug: string;
  image: string;
  from: string;
  group: string;
};

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const all: CatalogItem[] = useMemo(() => {
    const out: CatalogItem[] = [];
    for (const c of categories) {
      for (const s of c.services) {
        out.push({
          title: s.name,
          slug: s.slug,
          image: s.image,
          from: s.price_from ? `от ${s.price_from} ₽` : "",
          group: c.name,
        });
      }
    }
    return out;
  }, [categories]);

  const items = useMemo(() => {
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (s) => s.title.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)
    );
  }, [query, all]);

  return (
    <div className="bg-white">
      <section className="border-b border-ink-200 bg-gradient-to-b from-ink-50/60 to-white">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow mb-3">Каталог</p>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight">
            Все услуги типографии
          </h1>
          <p className="mt-3 text-ink-500 max-w-xl">
            Выберите услугу — и&nbsp;откроется калькулятор с&nbsp;точным расчётом стоимости.
          </p>

          <div className="mt-6 max-w-md relative">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по каталогу..."
              className="input pl-9 h-11"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-ink-400" size={26} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-500 py-20">
            {query ? `Ничего не найдено по запросу «${query}»` : "Каталог пуст"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {items.map((p) => (
              <Link
                key={p.slug}
                href={`/services/${encodeURIComponent(p.slug)}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white hover:border-brand hover:shadow-card transition-all duration-200"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                  {p.image ? (
                    <img
                      src={resolveImageUrl(p.image)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-ink-300">
                      <ImageOff size={22} />
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700">
                    {p.group}
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
                  <h3 className="text-sm sm:text-[15px] font-semibold text-ink-900 group-hover:text-brand transition-colors leading-tight">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-500 tabular flex-1">{p.from}</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    Открыть калькулятор
                    <ArrowRight size={11} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
