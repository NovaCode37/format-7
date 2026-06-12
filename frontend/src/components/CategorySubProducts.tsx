"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ImageOff } from "@/lib/icons";
import { api, resolveImageUrl, type Category } from "@/lib/api";
import Reveal, { Stagger, StaggerItem } from "./Reveal";

const CATEGORY_ALIAS: Record<string, string> = {
  "оперативная-полиграфия": "полиграфия",
  "копирование-и-печать-документов": "печать-документов",
};

export default function CategorySubProducts({
  activeSlug,
  title,
  variant = "grid",
}: {
  activeSlug: string;
  title?: string;
  variant?: "grid" | "carousel";
}) {
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    let ok = true;
    api.getCategories()
      .then((cats) => {
        if (!ok) return;
        const target = decodeURIComponent(activeSlug).toLowerCase();
        const aliasCat = CATEGORY_ALIAS[target];
        const found =
          cats.find((c) =>
            (aliasCat && c.slug.toLowerCase() === aliasCat) ||
            c.slug.toLowerCase() === target ||
            c.services.some((s) => s.slug.toLowerCase() === target)
          ) || null;
        setCategory(found);
      })
      .catch(() => {});
    return () => { ok = false; };
  }, [activeSlug]);

  if (!category || category.services.length === 0) return null;

  const items = category.services;
  const heading = title || category.name;
  const activeHref = `/services/${decodeURIComponent(activeSlug).toLowerCase()}`;
  const priceLabel = (n: number) => (n ? `от ${n} ₽` : "");

  if (variant === "carousel") {
    return (
      <section className="bg-white border-t border-ink-100">
        <div className="container-page py-8 sm:py-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-ink-900 tracking-tight">{heading}</h2>
            <span className="text-[12px] text-ink-400">листайте&nbsp;→</span>
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin]">
              {items.map((p) => {
                const href = `/services/${p.slug}`;
                const isActive = href.toLowerCase() === activeHref;
                return (
                  <Link
                    key={p.slug}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group shrink-0 w-[150px] sm:w-[170px] snap-start flex flex-col overflow-hidden rounded-xl border bg-white hover:shadow-card transition-all duration-200 ${
                      isActive ? "border-brand ring-2 ring-brand/30" : "border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                      {p.image ? (
                        <img src={resolveImageUrl(p.image)} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-ink-300"><ImageOff size={18} /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-[13px] font-semibold text-ink-900 group-hover:text-brand transition-colors leading-tight">{p.name}</h3>
                      <p className="mt-0.5 text-[12px] text-ink-500 tabular">{priceLabel(p.price_from)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="container-page py-12 sm:py-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow mb-2">Подкатегории</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">{heading}</h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-ink-500">{items.length} продукта</span>
          </div>
        </Reveal>

        <Stagger as="div" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5" stagger={0.04}>
          {items.map((p) => {
            const href = `/services/${p.slug}`;
            const isActive = href.toLowerCase() === activeHref;
            return (
              <StaggerItem key={p.slug} y={12}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex flex-col overflow-hidden rounded-xl border bg-white hover:shadow-card transition-all duration-200 ${
                    isActive ? "border-brand ring-2 ring-brand/30" : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                    {p.image ? (
                      <img src={resolveImageUrl(p.image)} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-ink-300"><ImageOff size={22} /></div>
                    )}
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <h3 className="text-sm sm:text-[15px] font-semibold text-ink-900 group-hover:text-brand transition-colors leading-tight">{p.name}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-ink-500 tabular">{priceLabel(p.price_from)}</p>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                      Перейти к&nbsp;калькулятору
                      <ArrowRight size={11} strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
