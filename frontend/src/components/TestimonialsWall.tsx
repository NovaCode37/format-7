"use client";

import { Star } from "@/lib/icons";
import Reveal from "./Reveal";

const REVIEWS = [
  { name: "Анна К.", role: "Маркетолог", text: "Заказала визитки с тиснением — качество выше ожиданий. Макет приняли в работу за десять минут." },
  { name: "Дмитрий В.", role: "ИП", text: "Онлайн-конструктор удобный. Собрал макет сам, получил пачку визиток за два часа." },
  { name: "Мария Л.", role: "Event-агентство", text: "Печатаем флаеры и баннеры только здесь. Цены адекватные, сроки выполняются точно." },
  { name: "Олег П.", role: "Кафе «Утро»", text: "Сделали меню, ценники и листовки в единой стилистике. Рекомендую коллегам." },
  { name: "Екатерина С.", role: "Фрилансер", text: "Нужна была пачка визиток к встрече. Сделали быстро, ещё и привезли в офис." },
  { name: "Игорь Р.", role: "Магазин у дома", text: "Заказываем ценники, листовки и наклейки каждый месяц. Цвета точные, печать ровная." },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-amber-400 fill-amber-400" aria-hidden />
      ))}
    </div>
  );
}

export default function TestimonialsWall() {
  return (
    <section className="bg-ink-900 text-white overflow-hidden">
      <div className="container-page py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

          <Reveal className="lg:col-span-4">
            <p className="eyebrow !text-white/40 mb-3">Отзывы</p>
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-[5rem] sm:text-[7rem] font-bold leading-none tracking-tighter">
                4.9
              </span>
              <div className="pb-3">
                <Stars count={5} />
                <span className="block mt-1 text-[13px] text-white/40 tabular">
                  1 820 отзывов
                </span>
              </div>
            </div>
            <p className="mt-4 text-white/50 max-w-xs leading-relaxed text-sm">
              Яндекс&nbsp;Карты, 2ГИС и&nbsp;собственные опросы за&nbsp;последние три&nbsp;года.
            </p>
          </Reveal>

          <div className="lg:col-span-8 columns-1 sm:columns-2 gap-4 space-y-4">
            {REVIEWS.map((r, i) => (
              <Reveal key={r.name} delay={i * 0.05}>
                <blockquote className="break-inside-avoid bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/[0.06]">
                  <Stars count={5} />
                  <p className="mt-3 text-sm text-white/80 leading-relaxed">
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <footer className="mt-4 flex items-center gap-2 text-[13px]">
                    <span className="w-7 h-7 rounded-full bg-white/10 grid place-items-center text-xs font-bold text-white/60">
                      {r.name.charAt(0)}
                    </span>
                    <span className="text-white/60">
                      {r.name}<span className="text-white/30"> · {r.role}</span>
                    </span>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
