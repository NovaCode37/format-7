"use client";

import Link from "next/link";
import {
  PenTool,
  Calculator,
  Zap,
  TrendingUp,
  Package2,
  Clock,
  ArrowUpRight,
} from "@/lib/icons";
import { IMG } from "@/lib/images";
import Reveal, { Stagger, StaggerItem, ScaleIn, CountUp } from "./Reveal";

export default function BentoGrid() {
  return (
    <section className="bg-white">
      <div className="container-page py-20 sm:py-28">
        <div className="grid grid-cols-12 gap-x-6 mb-12 sm:mb-16 items-end">
          <Reveal className="col-span-12 lg:col-span-7">
            <p className="eyebrow mb-4">
              <span className="tabular text-ink-400">04 · </span>
              Возможности
            </p>
            <h2 className="h-display">
              Всё, что нужно
              <br />
              <span className="text-ink-400">для&nbsp;готового тиража.</span>
            </h2>
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-5" delay={0.1}>
            <p className="lead text-ink-600">
              Конструктор и&nbsp;калькулятор работают с&nbsp;одной базой материалов
              и&nbsp;цен&nbsp;— стоимость не&nbsp;изменится после оформления заказа.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-5">

          <ScaleIn className="col-span-12 lg:col-span-7">
          <Link
            href="/designer"
            className="group relative overflow-hidden rounded-md bg-ink-900 text-white p-8 sm:p-10 min-h-[360px] flex flex-col justify-between transition-colors hover:bg-ink-950"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-md bg-white/10 border border-white/15">
                  <PenTool size={18} strokeWidth={2} />
                </span>
                <span className="text-[12px] uppercase tracking-[0.18em] text-white/70">
                  Хит&nbsp;· Онлайн-конструктор
                </span>
              </div>
              <ArrowUpRight
                size={20}
                strokeWidth={2}
                className="text-white/60 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>

            <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-end">
              <div className="col-span-12 sm:col-span-7">
                <h3 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.05]">
                  Соберите макет
                  <br />
                  без&nbsp;дизайнера
                </h3>
                <p className="mt-3 text-white/70 max-w-md">
                  22&nbsp;продукта, 12&nbsp;готовых шаблонов. Поддержка PNG/PDF
                  на&nbsp;экспорте. Бесплатно, без&nbsp;регистрации.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-5 hidden sm:block">
                <div className="relative aspect-[4/5] rounded-md overflow-hidden border border-white/10">
                  <img
                    src={IMG.businessCardMockup}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                </div>
              </div>
            </div>
          </Link>
          </ScaleIn>

          <ScaleIn className="col-span-12 lg:col-span-5" delay={0.1}>
          <Link
            href="/calculator"
            className="group card-interactive p-8 sm:p-10 min-h-[360px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-md bg-ink-100 border border-ink-200">
                  <Calculator size={18} strokeWidth={2} className="text-ink-700" />
                </span>
                <span className="eyebrow">Калькулятор</span>
              </div>
              <ArrowUpRight
                size={20}
                strokeWidth={2}
                className="text-ink-400 group-hover:text-ink-900 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>

            <div>
              <h3 className="font-heading text-3xl sm:text-4xl font-semibold text-ink-900 tracking-[-0.025em] leading-[1.05]">
                Точная цена
                <br />
                за&nbsp;30&nbsp;секунд
              </h3>
              <p className="mt-3 text-ink-600 max-w-md">
                Загрузите готовый макет (PDF, AI, CDR, PNG до&nbsp;50&nbsp;МБ)
                и&nbsp;оформите заказ в&nbsp;два клика.
              </p>
            </div>
          </Link>
          </ScaleIn>
        </div>

        <Stagger as="dl" className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200 border border-ink-200 rounded-md overflow-hidden" stagger={0.08}>
          {[
            { icon: Zap,        numeric: 1, suffix: " час", label: "Срочная печать" },
            { icon: TrendingUp, numeric: 15000, suffix: "+", label: "Клиентов" },
            { icon: Package2,   numeric: 22, suffix: "", label: "Категории продукции" },
            { icon: Clock,      numeric: 24, suffix: " / 7", label: "Приём онлайн-заказов" },
          ].map(({ icon: Icon, numeric, suffix, label }) => (
            <StaggerItem key={label} className="bg-white p-6 sm:p-8 flex flex-col gap-3">
              <Icon
                size={20}
                strokeWidth={2}
                className="text-ink-500"
                aria-hidden="true"
              />
              <dd className="font-heading text-3xl sm:text-4xl font-semibold text-ink-900 tabular tracking-[-0.025em]">
                <CountUp target={numeric} suffix={suffix} />
              </dd>
              <dt className="text-[12px] uppercase tracking-[0.16em] text-ink-500">
                {label}
              </dt>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
