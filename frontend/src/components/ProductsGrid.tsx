"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem } from "./Reveal";

const PRODUCTS = [
  { key: "vizitki",    title: "Визитки",             from: "от 500 ₽", image: IMG.businessCardMockup, href: "/services/vizitki" },
  { key: "listovki",   title: "Листовки",            from: "от 300 ₽", image: IMG.flyer,              href: "/services/flyers" },
  { key: "flyers",     title: "Флаеры",              from: "от 300 ₽", image: IMG.flyerMockup,        href: "/services/flyers" },
  { key: "buklety",    title: "Буклеты",             from: "от 800 ₽", image: IMG.magazines,          href: "/services/buklety" },
  { key: "otkrytki",   title: "Открытки",            from: "от 400 ₽", image: IMG.polaroidHand,       href: "/services/otkrytki" },
  { key: "kalendari",  title: "Календари",           from: "от 250 ₽", image: IMG.printDetail,        href: "/services/calendars" },
  { key: "stickers",   title: "Наклейки и стикеры",  from: "от 200 ₽", image: IMG.stickers,           href: "/services/stickers" },
  { key: "menu",       title: "Меню для кафе",       from: "от 600 ₽", image: IMG.flyerPaper,         href: "/services/menu" },
  { key: "bloknoty",   title: "Блокноты",            from: "от 400 ₽", image: IMG.stickerPack,        href: "/services/bloknoty" },
];

export default function ProductsGrid() {
  return (
    <section className="bg-white">
      <div className="container-page py-14 sm:py-20">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow mb-3">Полиграфия</p>
              <h2 className="h-section">
                Продукция на заказ
              </h2>
            </div>
            <Link
              href="/catalog"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors shrink-0"
            >
              Весь каталог
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </Reveal>

        <Stagger
          as="div"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          stagger={0.04}
        >
          {PRODUCTS.map((p) => (
            <StaggerItem key={p.key} y={12}>
              <Link
                href={p.href}
                className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white hover:border-ink-300 hover:shadow-card transition-all duration-200"
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
                  <p className="mt-1 text-xs sm:text-sm text-ink-500">{p.from}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-8 sm:hidden text-center">
          <Link
            href="/catalog"
            className="btn-secondary btn-sm"
          >
            Весь каталог
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
