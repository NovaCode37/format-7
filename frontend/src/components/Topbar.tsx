import { MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";

export default function Topbar() {
  return (
    <div className="bg-ink-900 text-white/70 text-[12px]">
      <div className="container-page py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-white/90 font-medium">
            <MapPin size={11} strokeWidth={1.75} className="text-white/50" />
            Тюмень
          </span>
          <span className="hidden sm:inline text-white/20">·</span>
          <Link
            href="/contacts"
            className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Phone size={11} strokeWidth={1.75} className="text-white/40" />
            +7 932 475-95-11
          </Link>
          <span className="hidden md:inline text-white/20">·</span>
          <a
            href="mailto:Format7-tmn@yandex.ru"
            className="hidden md:inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Mail size={11} strokeWidth={1.75} className="text-white/40" />
            Format7-tmn@yandex.ru
          </a>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link href="/contacts" className="hover:text-white transition-colors">
            Контакты
          </Link>
          <Link href="/prices" className="hover:text-white transition-colors">
            Оплата
          </Link>
          <Link href="/contacts#delivery" className="hover:text-white transition-colors">
            Доставка
          </Link>
        </div>
      </div>
    </div>
  );
}
