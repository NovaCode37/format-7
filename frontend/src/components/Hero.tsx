"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem, CountUp, DrawLine } from "./Reveal";

const FACTS: { value: string; numeric: number; suffix: string; label: string }[] = [
  { value: "24/7", numeric: 24, suffix: "/7", label: "приём заказов онлайн" },
  { value: "1820", numeric: 1820, suffix: "", label: "отзывов · 4.9 из 5" },
  { value: "20+", numeric: 20, suffix: "+", label: "калькуляторов услуг" },
  { value: "22", numeric: 22, suffix: "", label: "категории продукции" },
];

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="container-page pt-14 sm:pt-20 lg:pt-24 pb-16 sm:pb-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-end">

          <div className="col-span-12 lg:col-span-7">
            <Reveal delay={0}>
              <p className="eyebrow mb-5">
                <span className="tabular text-ink-400">01 · </span>
                Типография в&nbsp;Тюмени
              </p>
            </Reveal>

            <Reveal delay={0.08} y={24}>
              <h1 className="font-heading text-[clamp(2.5rem,6vw,5rem)] font-semibold text-ink-900 leading-[1.02] tracking-[-0.03em]">
                Печать, которой
                <br />
                можно доверять
                <br />
                <span className="text-ink-400">с&nbsp;первого тиража.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.18} y={16}>
              <p className="lead mt-6 text-ink-600">
                Визитки, флаеры, буклеты, календари, наклейки, печать документов
                и&nbsp;фотопечать. Рассчитайте стоимость за&nbsp;минуту в&nbsp;онлайн-калькуляторе&nbsp;— без&nbsp;регистрации.
              </p>
            </Reveal>

            <Reveal delay={0.28} y={12}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/designer"
                  className="btn-primary btn-lg shadow-elev px-7 hover:shadow-[0_12px_28px_-10px_rgba(3,105,161,0.5)]"
                >
                  Открыть конструктор
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>
                <Link
                  href="/calculator"
                  className="text-[15px] text-ink-700 hover:text-ink-900 underline decoration-ink-300 decoration-1 underline-offset-[6px] hover:decoration-ink-700 transition-colors"
                >
                  Рассчитать стоимость
                </Link>
              </div>

              <p className="mt-5 text-[13px] text-ink-500">
                Доставка по Тюмени · Самовывоз · Безналичная оплата
              </p>
            </Reveal>
          </div>

          <Reveal className="col-span-12 lg:col-span-5" delay={0.15} y={30} duration={0.8}>
            <figure className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink-100 border border-ink-200">
                <div className="absolute inset-0 bg-grid opacity-[0.6] pointer-events-none" aria-hidden="true" />
                <img
                  src={IMG.businessCardMockup}
                  alt="Визитки, отпечатанные в типографии Format7"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between text-[12px] text-ink-500">
                <span className="uppercase tracking-[0.18em]">Визитки · soft-touch</span>
                <span className="tabular text-ink-400">№ 001 / 022</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="mt-16 sm:mt-20">
          <DrawLine />
          <Stagger as="dl" className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-ink-200 -mx-px" stagger={0.1}>
            {FACTS.map((f) => (
              <StaggerItem key={f.label} className="px-4 py-6 first:pl-0">
                <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
                  {f.label}
                </dt>
                <dd className="mt-2 font-heading text-3xl sm:text-4xl font-semibold text-ink-900 tabular tracking-tight">
                  <CountUp target={f.numeric} suffix={f.suffix} />
                </dd>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
