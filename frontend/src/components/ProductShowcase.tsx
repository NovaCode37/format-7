"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem, DrawLine } from "./Reveal";

interface Category {
  key: string;
  title: string;
  tagline: string;
  desc: string;
  image: string;
  from: string;
  specs: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "vizitki",
    title: "Визитки",
    tagline: "Первое впечатление — в&nbsp;деталях.",
    desc: "Матовое, глянцевое или soft-touch покрытие. Скруглённые углы, тиснение фольгой, ламинация.",
    image: IMG.businessCardMockup,
    from: "от 500 ₽ / 100 шт.",
    specs: ["350 г/м²", "4+4 CMYK", "soft-touch / mat / glo"],
  },
  {
    key: "flyers",
    title: "Флаеры и листовки",
    tagline: "Реклама, которую не выкинут.",
    desc: "Форматы A4, A5, A6, DL. Плотная мелованная бумага 130–300 г/м². Полноцветная печать с двух сторон.",
    image: IMG.flyer,
    from: "от 300 ₽ / 100 шт.",
    specs: ["A6 / A5 / A4 / DL", "130–300 г/м²", "от 100 шт."],
  },
  {
    key: "souvenirs",
    title: "Сувениры и мерч",
    tagline: "Подарок, который помнят.",
    desc: "Кружки, магниты, значки, коврики для мыши, брелоки. Полноцветная УФ-печать. Индивидуальный дизайн для любого бренда.",
    image: IMG.mug,
    from: "от 250 ₽ / шт.",
    specs: ["УФ-печать", "от 1 шт.", "брендирование"],
  },
  {
    key: "textile",
    title: "Текстиль",
    tagline: "Одежда с&nbsp;вашим дизайном.",
    desc: "Футболки, толстовки, бейсболки, шопперы. Шелкография и прямая цифровая печать. Любой цвет ткани.",
    image: IMG.tshirtFolded,
    from: "от 800 ₽ / шт.",
    specs: ["DTF / DTG", "шелкография", "от 1 шт."],
  },
  {
    key: "photo",
    title: "Фотопечать",
    tagline: "Воспоминания в&nbsp;высоком разрешении.",
    desc: "Классические фото 10×15, 15×20, печать на холсте, фотокубики, фотокниги. Профессиональная цветокоррекция.",
    image: IMG.polaroid,
    from: "от 15 ₽ / шт.",
    specs: ["10×15 / 15×20", "холст / акрил", "цветокоррекция"],
  },
];

export default function ProductShowcase() {
  return (
    <section className="bg-white">
      <div className="container-page py-20 sm:py-28">

        <div className="grid grid-cols-12 gap-x-6 mb-12 sm:mb-16 items-end">
          <Reveal className="col-span-12 lg:col-span-7">
            <p className="eyebrow mb-4">
              <span className="tabular text-ink-400">02 · </span>
              Продукция
            </p>
            <h2 className="h-display">
              Пять категорий, <br className="hidden sm:block" />
              <span className="text-ink-400">один производственный цикл.</span>
            </h2>
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-5" delay={0.1}>
            <p className="lead text-ink-600">
              Делаем визитки, флаеры, сувенирку, текстиль и&nbsp;фотопечать
              в&nbsp;собственной типографии. Без посредников и&nbsp;скрытых наценок.
            </p>
          </Reveal>
        </div>

        <ol>
          <DrawLine />
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.key} as="li" className="border-b border-ink-200" delay={0.05} y={20}>
              <Link
                href={`/services/${cat.key}`}
                className={`group grid grid-cols-12 gap-x-6 gap-y-6 py-10 sm:py-14 items-center ${
                  i % 2 === 1 ? "lg:[&>figure]:order-first" : ""
                }`}
              >

                <div className="col-span-12 lg:col-span-7 order-2">
                  <div className="flex items-baseline gap-5 mb-4">
                    <span className="font-heading text-2xl text-ink-400 tabular tracking-tight">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="eyebrow">{cat.from}</span>
                  </div>
                  <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 tracking-[-0.025em] leading-[1.05] group-hover:text-brand transition-colors">
                    {cat.title}
                  </h3>
                  <p
                    className="mt-3 text-lg text-ink-700 max-w-xl"
                    dangerouslySetInnerHTML={{ __html: cat.tagline }}
                  />
                  <p className="mt-3 text-ink-600 max-w-xl leading-relaxed">
                    {cat.desc}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.16em] text-ink-500">
                    {cat.specs.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-900 group-hover:text-brand transition-colors">
                    Подробнее и&nbsp;заказать
                    <ArrowRight
                      size={15}
                      strokeWidth={2}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>

                <figure className="col-span-12 lg:col-span-5 order-1 lg:order-2">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-md bg-ink-100 border border-ink-200">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                </figure>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
