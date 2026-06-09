"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem } from "./Reveal";

type SubProduct = {
  title: string;
  from: string;
  image: string;
  href: string;
};

const SUB_PRODUCTS: Record<string, SubProduct[]> = {

  "копирование-и-печать-документов": [
    {
      title: "Копирование и печать",
      from: "от 6 ₽",
      image: IMG.printStudio,
      href: "/services/копирование-и-печать-документов",
    },
    {
      title: "Сканирование",
      from: "от 10 ₽",
      image: IMG.printDetail,
      href: "/services/сканирование-документов",
    },
    {
      title: "Ламинирование",
      from: "от 50 ₽",
      image: IMG.printPress,
      href: "/services/ламинирование",
    },
    {
      title: "Брошюровка и переплёт",
      from: "от 120 ₽",
      image: IMG.magazines,
      href: "/services/переплёт-и-брошюровка",
    },
  ],

  "оперативная-полиграфия": [
    { title: "Визитки",            from: "от 500 ₽", image: IMG.businessCardMockup, href: "/services/визитки" },
    { title: "Листовки",           from: "от 300 ₽", image: IMG.flyer,              href: "/services/листовки" },
    { title: "Флаеры",             from: "от 300 ₽", image: IMG.flyerMockup,        href: "/services/флаеры" },
    { title: "Буклеты",            from: "от 800 ₽", image: IMG.magazines,          href: "/services/буклеты" },
    { title: "Открытки",           from: "от 400 ₽", image: IMG.polaroidHand,       href: "/services/открытки" },
    { title: "Календари",          from: "от 250 ₽", image: IMG.printDetail,        href: "/services/календари" },
    { title: "Наклейки и стикеры", from: "от 200 ₽", image: IMG.stickers,           href: "/services/наклейки" },
    { title: "Меню для кафе",      from: "от 600 ₽", image: IMG.flyerPaper,         href: "/services/меню-для-кафе" },
    { title: "Блокноты",           from: "от 400 ₽", image: IMG.stickerPack,        href: "/services/блокноты" },
  ],
};

export function getParentCategory(slug: string): string | null {
  const s = decodeURIComponent(slug).toLowerCase();
  for (const [parent, items] of Object.entries(SUB_PRODUCTS)) {
    if (parent === s) return parent;
    if (items.some((it) => it.href.toLowerCase().endsWith(`/${s}`))) return parent;
  }
  return null;
}

export default function CategorySubProducts({
  slug,
  title = "Продукция категории",
  activeSlug,
}: {
  slug: string;
  title?: string;

  activeSlug?: string;
}) {
  const items = SUB_PRODUCTS[slug.toLowerCase()];
  if (!items || items.length === 0) return null;
  const activeHref = activeSlug ? `/services/${decodeURIComponent(activeSlug).toLowerCase()}` : null;

  return (
    <section className="bg-white">
      <div className="container-page py-12 sm:py-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow mb-2">Подкатегории</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
                {title}
              </h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-ink-500">
              {items.length} продукта
            </span>
          </div>
        </Reveal>

        <Stagger
          as="div"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          stagger={0.04}
        >
          {items.map((p) => {
            const isActive = activeHref && p.href.toLowerCase() === activeHref;
            return (
            <StaggerItem key={p.href} y={12}>
              <Link
                href={p.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex flex-col overflow-hidden rounded-xl border bg-white hover:shadow-card transition-all duration-200 ${
                  isActive
                    ? "border-brand ring-2 ring-brand/30"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 sm:p-4">
                  <h3 className="text-sm sm:text-[15px] font-semibold text-ink-900 group-hover:text-brand transition-colors leading-tight">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-500 tabular">{p.from}</p>
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
