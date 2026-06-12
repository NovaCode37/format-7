"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal from "./Reveal";

export default function RunningBanner() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 min-h-[85vh] lg:min-h-[90vh] items-center">

          <div className="pt-16 sm:pt-20 lg:pt-0 lg:pr-16 max-w-xl">
            <Reveal>
              <p className="text-[13px] font-medium text-accent tracking-wide uppercase">
                Тюмень · Срочная печать за 1 час
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-5 font-heading text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-ink-900 tracking-tight leading-[1.02]">
                Печатаем
                <br />
                <span className="text-ink-300">всё,&nbsp;что</span>
                <br />
                <span className="text-ink-300">нужно.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 text-base sm:text-lg text-ink-500 leading-relaxed max-w-md">
                Визитки, листовки, календари, наклейки, фотопечать&nbsp;— от&nbsp;1&nbsp;штуки.
                Загрузите макет или&nbsp;закажите дизайн.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/catalog"
                  className="btn btn-lg bg-ink-900 text-white border-ink-900 hover:bg-ink-800 hover:border-ink-800"
                >
                  Каталог услуг
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={0} x={30} className="relative hidden lg:block h-full">
            <div className="absolute inset-0 flex items-center">
              <div className="relative w-full h-[80%] grid grid-cols-2 grid-rows-3 gap-3">
                <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden">
                  <img
                    src={IMG.businessCardsStack}
                    alt="Визитки"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden">
                  <img
                    src={IMG.prodPhoto}
                    alt="Фотопечать"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden bg-accent flex items-center justify-center p-6">
                  <div className="text-center text-white">
                    <span className="block font-heading text-3xl font-bold">от 1 шт</span>
                    <span className="text-white/70 text-sm mt-1 block">любой тираж</span>
                  </div>
                </div>
                <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden">
                  <img
                    src={IMG.prodFlyers}
                    alt="Полиграфия"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:hidden pb-10">
            <div className="rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src={IMG.prodFlyers}
                alt="Полиграфия"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </Reveal>
        </div>
      </div>

      <div className="h-px bg-ink-100" />
    </section>
  );
}
