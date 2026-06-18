"use client";

import Link from "next/link";
import { ArrowUpRight } from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem } from "./Reveal";

type Category = {
  key: string;
  title: string;
  sub: string;
  image: string;
  href: string;
  span: string;
  tags?: string[];
};

const CATS: Category[] = [
  {
    key: "docs",
    title: "Печать документов",
    sub: "ЧБ и цвет · A4, A3 · от 5 ₽",
    image: IMG.prodDocs,
    href: "/services/копирование-и-печать-документов",
    span: "md:col-span-2 md:row-span-2",
    tags: ["Копирование", "Сканирование", "Ламинирование", "Брошюровка"],
  },
  {
    key: "poly",
    title: "Полиграфия",
    sub: "Визитки, флаеры, буклеты",
    image: IMG.prodPolygraphy,
    href: "/services/оперативная-полиграфия",
    span: "md:col-span-1 md:row-span-2",
    tags: ["Визитки", "Листовки", "Буклеты", "Календари"],
  },
];

export default function CategoryCards() {
  return (
    <section className="bg-ink-50/50">
      <div className="container-page py-16 sm:py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="eyebrow mb-2">Услуги</p>
              <h2 className="h-section">Что мы делаем</h2>
            </div>
            <Link
              href="/catalog"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
            >
              Все услуги
              <ArrowUpRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </Reveal>

        <Stagger
          as="div"
          className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-3 md:auto-rows-[220px]"
          stagger={0.07}
        >
          {CATS.map((cat) => (
            <StaggerItem key={cat.key} y={20} className={cat.span}>
              <Link
                href={cat.href}
                className="group relative flex flex-col justify-end h-full rounded-2xl overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="relative p-5 sm:p-7">
                  {cat.tags && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {cat.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-medium text-white/80 backdrop-blur-sm"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    {cat.title}
                    <ArrowUpRight
                      size={18}
                      strokeWidth={2}
                      className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300"
                    />
                  </h3>
                  <p className="mt-1 text-sm text-white/60">{cat.sub}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
