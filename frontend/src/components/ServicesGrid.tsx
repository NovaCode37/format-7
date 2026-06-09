"use client";

import Link from "next/link";
import { Copy, ScanLine, Layers, BookOpen, ArrowUpRight } from "lucide-react";
import Reveal, { Stagger, StaggerItem } from "./Reveal";

const SERVICES = [
  {
    key: "copy",
    title: "Копирование и печать",
    desc: "Ч/б и цветное копирование, печать с флешки. Форматы A4, A3, A2, A1.",
    icon: Copy,
    href: "/services/copy",
    span: "md:col-span-2",
  },
  {
    key: "scan",
    title: "Сканирование",
    desc: "Сканирование документов, фото, чертежей. PDF, JPEG.",
    icon: ScanLine,
    href: "/services/scan",
    span: "",
  },
  {
    key: "lamination",
    title: "Ламинирование",
    desc: "Горячее и холодное ламинирование. Матовое и глянцевое покрытие.",
    icon: Layers,
    href: "/services/lamination",
    span: "",
  },
  {
    key: "binding",
    title: "Брошюровка",
    desc: "Переплёт на пружину, термопереплёт, сшивка на скобу.",
    icon: BookOpen,
    href: "/services/binding",
    span: "",
  },
];

export default function ServicesGrid() {
  return (
    <section className="bg-ink-50 border-y border-ink-200">
      <div className="container-page py-14 sm:py-20">
        <Reveal>
          <p className="eyebrow mb-3">Услуги копицентра</p>
          <h2 className="h-section">
            Копирование, сканирование
            <br className="hidden sm:block" />
            <span className="text-ink-400">и&nbsp;постобработка</span>
          </h2>
        </Reveal>

        <Stagger
          as="div"
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
          stagger={0.08}
        >
          {SERVICES.map((s) => (
            <StaggerItem key={s.key} y={16} className={s.span}>
              <Link
                href={s.href}
                className="group flex items-start gap-4 p-6 rounded-xl bg-white border border-ink-200 hover:border-brand/30 hover:shadow-card transition-all duration-200 h-full"
              >
                <span className="shrink-0 w-11 h-11 rounded-lg bg-brand-light grid place-items-center">
                  <s.icon size={20} strokeWidth={1.75} className="text-brand" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold text-ink-900 group-hover:text-brand transition-colors">
                      {s.title}
                    </h3>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.75}
                      className="text-ink-400 group-hover:text-brand shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                  <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">{s.desc}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
