"use client";

import Link from "next/link";
import { ArrowRight, Phone, MapPin, Clock } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section className="bg-white">
      <div className="container-page py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          <Reveal>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight leading-[1.08]">
              Готовы
              <br />
              <span className="text-ink-300">начать печать?</span>
            </h2>
            <p className="mt-4 text-ink-500 max-w-md leading-relaxed">
              Рассчитайте стоимость онлайн или&nbsp;позвоните нам. Срочные заказы
              принимаем круглосуточно.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/catalog"
                className="btn btn-lg bg-ink-900 text-white border-ink-900 hover:bg-ink-800 hover:border-ink-800"
              >
                Открыть каталог
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <a
                href="tel:+79324759511"
                className="btn btn-lg bg-transparent text-ink-600 border border-ink-200 hover:bg-ink-50 hover:border-ink-300"
              >
                <Phone size={15} strokeWidth={1.75} />
                Позвонить
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-ink-50 rounded-2xl p-6">
                <Phone size={20} strokeWidth={1.5} className="text-ink-400 mb-3" />
                <p className="text-[13px] text-ink-400 mb-1">Телефон</p>
                <a href="tel:+79324759511" className="font-heading text-lg font-bold text-ink-900 hover:text-brand transition-colors tabular">
                  +7 932 475-95-11
                </a>
              </div>
              <div className="bg-ink-50 rounded-2xl p-6">
                <MapPin size={20} strokeWidth={1.5} className="text-ink-400 mb-3" />
                <p className="text-[13px] text-ink-400 mb-1">Адрес</p>
                <p className="font-heading text-base font-bold text-ink-900 leading-snug">
                  г. Тюмень, ул. Широтная, д. 113, к1 стр1, офис 7
                </p>
              </div>
              <div className="bg-ink-50 rounded-2xl p-6">
                <Clock size={20} strokeWidth={1.5} className="text-ink-400 mb-3" />
                <p className="text-[13px] text-ink-400 mb-1">Время работы</p>
                <p className="font-heading text-lg font-bold text-ink-900 tabular">
                  Пн–Пт · 9–13, 14–17
                </p>
              </div>
              <div className="bg-accent rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-sm text-white/70">Электронная почта</p>
                <a
                  href="mailto:Format7-tmn@yandex.ru"
                  className="font-heading text-lg font-bold text-white hover:text-white/80 transition-colors mt-2"
                >
                  Format7-tmn@yandex.ru
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
