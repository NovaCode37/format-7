"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { IMG } from "@/lib/images";

type CatalogItem = {
  title: string;
  slug: string;
  image: string;
  from: string;
  group: string;
};

const ALL_SERVICES: CatalogItem[] = [

  { title: "Копирование и печать",     slug: "копирование-и-печать-документов", image: IMG.printStudio,        from: "от 6 ₽",   group: "Печать документов" },
  { title: "Сканирование",             slug: "сканирование-документов",          image: IMG.printDetail,        from: "от 10 ₽",  group: "Печать документов" },
  { title: "Ламинирование",            slug: "ламинирование",                    image: IMG.printPress,         from: "от 50 ₽",  group: "Печать документов" },
  { title: "Брошюровка и переплёт",    slug: "переплёт-и-брошюровка",            image: IMG.magazines,          from: "от 120 ₽", group: "Печать документов" },

  { title: "Визитки",                  slug: "визитки",                          image: IMG.businessCardMockup, from: "от 500 ₽", group: "Полиграфия" },
  { title: "Листовки",                 slug: "листовки",                         image: IMG.flyer,              from: "от 300 ₽", group: "Полиграфия" },
  { title: "Флаеры",                   slug: "флаеры",                           image: IMG.flyerMockup,        from: "от 300 ₽", group: "Полиграфия" },
  { title: "Буклеты",                  slug: "буклеты",                          image: IMG.magazines,          from: "от 800 ₽", group: "Полиграфия" },
  { title: "Открытки",                 slug: "открытки",                         image: IMG.polaroidHand,       from: "от 400 ₽", group: "Полиграфия" },
  { title: "Карманные календари",      slug: "карманные-календари",              image: IMG.printDetail,        from: "от 18 ₽",  group: "Календари" },
  { title: "Настольный календарь-домик", slug: "настольный-календарь-домик",     image: IMG.printDetail,        from: "от 100 ₽", group: "Календари" },
  { title: "Плакатный календарь",      slug: "плакатный-календарь",              image: IMG.printPress,         from: "от 230 ₽", group: "Календари" },
  { title: "Перекидной настенный календарь", slug: "перекидной-календарь",       image: IMG.printPress,         from: "от 730 ₽", group: "Календари" },
  { title: "Квартальный календарь",    slug: "квартальный-календарь",            image: IMG.printDetail,        from: "от 300 ₽", group: "Календари" },
  { title: "Наклейки и стикеры",       slug: "наклейки",                         image: IMG.stickers,           from: "от 200 ₽", group: "Полиграфия" },
  { title: "Меню для кафе",            slug: "меню-для-кафе",                    image: IMG.flyerPaper,         from: "от 600 ₽", group: "Полиграфия" },
  { title: "Блокноты",                 slug: "блокноты",                         image: IMG.stickerPack,        from: "от 400 ₽", group: "Полиграфия" },
  { title: "Конверты",                 slug: "конверты",                         image: IMG.businessCardBrand,  from: "от 16 ₽",  group: "Полиграфия" },
  { title: "Грамоты и дипломы",        slug: "грамоты-и-дипломы",                image: IMG.printPress,         from: "от 55 ₽",  group: "Полиграфия" },
  { title: "Печать фотографий",        slug: "печать-фотографий",                image: IMG.polaroid,           from: "от 22 ₽",  group: "Печать фото" },
];

export default function CatalogPage() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    if (!query.trim()) return ALL_SERVICES;
    const q = query.toLowerCase();
    return ALL_SERVICES.filter(
      (s) => s.title.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)
    );
  }, [query]);

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
              strokeWidth={1.75}
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
        {items.length === 0 ? (
          <p className="text-center text-ink-500 py-20">
            Ничего не найдено по запросу «{query}»
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
                  <img
                    src={p.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
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
