import { api } from "@/lib/api";
import MainNav from "@/components/MainNav";
import Link from "next/link";
import { Phone, Mail, MessageCircle, Send } from "lucide-react";

export const metadata = {
  title: "Контакты — Format7 Тюмень",
};

export default async function ContactsPage() {
  const [nav, offices] = await Promise.all([
    api.getNav(),
    api.getOffices(),
  ]);

  const channels = [
    { Icon: Phone,         title: "Телефон",   value: "+7 932 475-95-11", sub: "Ежедневно 9:00–21:00",  href: "tel:+79324759511"   },
    { Icon: Mail,          title: "Email",     value: "Format7-tmn@yandex.ru",    sub: "Ответим в течение часа", href: "mailto:Format7-tmn@yandex.ru" },
    { Icon: MessageCircle, title: "MAX",       value: "Написать в MAX",     sub: "Быстрые заказы",         href: "https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE" },
    { Icon: Send,          title: "Telegram",  value: "@format7tmn",        sub: "Чат для заказов",        href: "#" },
  ];

  return (
    <>
      <MainNav items={nav} />

      <div className="border-b border-ink-200">
        <div className="container-page py-3 text-[12px] text-ink-500">
          <Link href="/" className="hover:text-ink-900 transition-colors">Главная</Link>
          <span className="mx-2 text-ink-300">/</span>
          <span className="text-ink-900">Контакты</span>
        </div>
      </div>

      <section className="bg-white border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow mb-4">Контакты</p>
              <h1 className="h-display">
                Контакты Format7
                <br />
                <span className="text-ink-400">в&nbsp;Тюмени.</span>
              </h1>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <p className="lead text-ink-600">
                Найдите ближайший копицентр, напишите в&nbsp;мессенджер или&nbsp;позвоните&nbsp;—
                менеджер ответит в&nbsp;течение часа.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200 border border-ink-200 rounded-md overflow-hidden">
            {channels.map(({ Icon, title, value, sub, href }) => (
              <a
                key={title}
                href={href}
                className="group flex flex-col gap-3 bg-white p-6 hover:bg-ink-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Icon size={20} strokeWidth={1.5} className="text-ink-500" aria-hidden="true" />
                  <span className="eyebrow">{title}</span>
                </div>
                <dt className="sr-only">{title}</dt>
                <dd className="font-heading text-lg sm:text-xl font-semibold text-ink-900 tracking-tight tabular group-hover:text-brand transition-colors">
                  {value}
                </dd>
                <p className="text-[12px] text-ink-500">{sub}</p>
              </a>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink-50 border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="eyebrow">Карта</h2>
            <span className="text-[12px] text-ink-500 tabular">Тюмень · {offices.length} точек</span>
          </div>
          <div
            className="relative aspect-[16/7] w-full rounded-md border border-ink-200 bg-white bg-grid overflow-hidden grid place-items-center"
            role="img"
            aria-label="Карта расположения офисов Format7 в Тюмени"
          >
            <span className="text-ink-500 text-sm">Карта расположения офисов будет здесь</span>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-page py-14 sm:py-20">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="h-section">Офисы</h2>
            <span className="text-[12px] uppercase tracking-[0.18em] text-ink-500 tabular">
              {offices.length} точек
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-200 border border-ink-200 rounded-md overflow-hidden">
            {offices.map((o, i) => (
              <li key={o.id} className="bg-white p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm text-ink-400 tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] ${
                      o.is_open ? "text-ink-900" : "text-ink-400"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full ${
                        o.is_open ? "bg-emerald-600" : "bg-ink-400"
                      }`}
                    />
                    {o.is_open ? "Открыто" : "Закрыто"}
                  </span>
                </div>
                <h3 className="h-card">{o.name}</h3>
                <p className="text-[13px] text-ink-600">{o.address}</p>
                <p className="text-[12px] text-ink-500 tabular">{o.hours}</p>
                {o.phone && (
                  <a
                    href={`tel:${o.phone.replace(/[^+\d]/g, "")}`}
                    className="mt-auto pt-3 text-sm font-medium text-ink-900 hover:text-brand transition-colors tabular"
                  >
                    {o.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
