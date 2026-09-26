"use client";

import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "@/lib/icons";
import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import CallbackButton from "./CallbackButton";

export default function Topbar() {
  const s = useSiteSettings();
  return (
    <div className="bg-ink-900 text-white/85 text-[13px] border-b border-white/10">
      <div className="container-page py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 font-medium text-white">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} strokeWidth={2} className="text-accent" />
            Тюмень
          </span>
          <span className="hidden sm:inline text-white/25">·</span>
          <a
            href={`tel:${s.phoneHref}`}
            className="hidden sm:inline-flex items-center gap-1.5 hover:text-accent transition-colors tabular"
          >
            <Phone size={13} strokeWidth={2} className="text-accent" />
            {s.phone}
          </a>
          <span className="hidden md:inline text-white/25">·</span>
          <a
            href={`mailto:${s.email}`}
            className="hidden md:inline-flex items-center gap-1.5 hover:text-accent transition-colors"
          >
            <Mail size={13} strokeWidth={2} className="text-accent" />
            {s.email}
          </a>
          <span className="hidden lg:inline text-white/25">·</span>
          <span className="hidden lg:inline-flex items-center gap-1.5">
            <Clock size={13} strokeWidth={2} className="text-accent" />
            {s.hoursWeekday}
          </span>
        </div>

        <div className="flex items-center gap-4 font-medium text-white">
          <a
            href="https://xn--7-7sbon6au7a.xn--p1ai"
            target="_blank"
            rel="noopener"
            title="Перейти на сайт «Печати 7»"
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 px-2.5 py-1 text-accent hover:bg-accent hover:text-ink-900 transition-colors"
          >
            Печати и штампы
            <ArrowUpRight size={13} strokeWidth={2} />
          </a>
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/contacts" className="hover:text-accent transition-colors">
              Контакты
            </Link>
            <Link href="/contacts#payment" className="hover:text-accent transition-colors">
              Оплата
            </Link>
            <Link href="/contacts#delivery" className="hover:text-accent transition-colors">
              Доставка
            </Link>
          </div>
          <CallbackButton />
        </div>
      </div>
    </div>
  );
}
