"use client";

import {
  Clock,
  Truck,
  ShieldCheck,
  Award,
  CheckCircle2,
  Layers,
} from "@/lib/icons";

const ITEMS = [
  { icon: Clock,        text: "Онлайн-расчёт цены" },
  { icon: Truck,        text: "Доставка по Тюмени" },
  { icon: ShieldCheck,  text: "Гарантия качества" },
  { icon: Award,        text: "Своя типография" },
  { icon: CheckCircle2, text: "Бесплатная правка макета" },
  { icon: Layers,       text: "Любые тиражи" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-ink-100 bg-ink-50/60">
      <div className="container-page py-5 sm:py-6">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {ITEMS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-2 text-[13px] text-ink-600"
            >
              <Icon
                size={15}
                strokeWidth={2}
                className="text-ink-400 shrink-0"
                aria-hidden="true"
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
