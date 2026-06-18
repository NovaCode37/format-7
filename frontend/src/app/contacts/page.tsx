import { api } from "@/lib/api";
import MainNav from "@/components/MainNav";
import Link from "next/link";
import { Phone, Mail, MessageCircle, MapPin, Clock, Truck, Package, CreditCard, FileCheck2, QrCode } from "@/lib/icons";

export const metadata = {
  title: "Контакты — Format7 Тюмень",
};

const ADDRESS = "г. Тюмень, ул. Широтная, д. 113, к1 стр1, офис 7";
const LAT = 57.109684;
const LON = 65.590356;
const MAP_SRC =
  `https://maps.google.com/maps?q=${LAT},${LON}&z=18&hl=ru&output=embed`;
const YANDEX_URL =
  `https://yandex.ru/maps/?ll=${LON}%2C${LAT}&z=18&pt=${LON}%2C${LAT}%2Cpm2rdm`;

export default async function ContactsPage() {
  const nav = await api.getNav();

  const channels = [
    { Icon: Phone,         img: null,            title: "Телефон", value: "+7 932 475-95-11",      sub: "Пн–Пт 9:00–13:00, 14:00–17:00, Сб 10:00–16:00", href: "tel:+79324759511" },
    { Icon: Mail,          img: null,            title: "Email",   value: "Format7-tmn@yandex.ru", sub: "Ответим оперативно",               href: "mailto:Format7-tmn@yandex.ru" },
    { Icon: MessageCircle, img: "/max-icon.png", title: "MAX",     value: "Написать в MAX",        sub: "Быстрые заказы",                   href: "https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE" },
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
                Напишите в&nbsp;мессенджер или&nbsp;позвоните&nbsp;— менеджер ответит
                в&nbsp;течение часа. Заказы принимаем онлайн с&nbsp;доставкой по&nbsp;Тюмени.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-ink-200 border border-ink-200 rounded-md overflow-hidden">
            {channels.map(({ Icon, img, title, value, sub, href }) => (
              <a
                key={title}
                href={href}
                className="group flex flex-col gap-3 bg-white p-6 hover:bg-ink-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {img ? (
                    <img src={img} alt="" className="w-6 h-6 rounded-[6px]" />
                  ) : (
                    <Icon size={20} strokeWidth={2} className="text-ink-500" aria-hidden="true" />
                  )}
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
        <div className="container-page py-14 sm:py-20">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-start">
            <div className="col-span-12 lg:col-span-4">
              <p className="eyebrow mb-4">Наш офис</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight mb-6">
                Как нас найти
              </h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <MapPin size={18} strokeWidth={2} className="text-ink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-1">Адрес</p>
                    <p className="text-ink-900 font-medium">{ADDRESS}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} strokeWidth={2} className="text-ink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-1">Время работы</p>
                    <p className="text-ink-900 font-medium">Пн–Пт&nbsp;9:00–13:00, 14:00–17:00</p>
                    <p className="text-ink-900 font-medium">Сб&nbsp;10:00–16:00, Вс&nbsp;— выходной</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={18} strokeWidth={2} className="text-ink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-1">Телефон</p>
                    <a href="tel:+79324759511" className="text-ink-900 font-medium hover:text-brand transition-colors tabular">
                      +7 932 475-95-11
                    </a>
                  </div>
                </li>
              </ul>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl border border-ink-200 overflow-hidden bg-white">
                <iframe
                  src={MAP_SRC}
                  title="Карта — офис Format7 в Тюмени"
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <a
                href={YANDEX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-600 hover:text-brand transition-colors"
              >
                <MapPin size={14} strokeWidth={2} /> Открыть в Яндекс.Картах
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="delivery" className="bg-white border-b border-ink-200 scroll-mt-24">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow mb-3">Доставка</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight mb-8">
            Как получить заказ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-ink-200 p-6">
              <MapPin size={22} strokeWidth={2} className="text-ink-400 mb-3" />
              <h3 className="font-heading text-base font-bold text-ink-900 mb-1.5">Самовывоз</h3>
              <p className="text-[13px] text-ink-600 leading-relaxed">
                Бесплатно из офиса на ул.&nbsp;Широтная, 113&nbsp;к1&nbsp;стр1, офис&nbsp;7.
                Сообщим, когда заказ будет готов.
              </p>
            </div>
            <div className="rounded-xl border border-ink-200 p-6">
              <Truck size={22} strokeWidth={2} className="text-ink-400 mb-3" />
              <h3 className="font-heading text-base font-bold text-ink-900 mb-1.5">Курьер по Тюмени</h3>
              <p className="text-[13px] text-ink-600 leading-relaxed">
                Доставка по&nbsp;городу&nbsp;— <strong>700&nbsp;₽</strong>. Привезём в&nbsp;удобное
                время в&nbsp;день готовности или на&nbsp;следующий.
              </p>
            </div>
            <div className="rounded-xl border border-ink-200 p-6">
              <Package size={22} strokeWidth={2} className="text-ink-400 mb-3" />
              <h3 className="font-heading text-base font-bold text-ink-900 mb-1.5">СДЭК по России</h3>
              <p className="text-[13px] text-ink-600 leading-relaxed">
                Отправляем в&nbsp;другие города транспортной компанией СДЭК, в&nbsp;том числе
                наложенным платежом. Стоимость&nbsp;— по&nbsp;тарифу СДЭК.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="payment" className="bg-ink-50 scroll-mt-24">
        <div className="container-page py-14 sm:py-20">
          <p className="eyebrow mb-3">Оплата</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight mb-8">
            Как происходит оплата
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { Icon: FileCheck2, n: "1", t: "Оформляете заказ", d: "Рассчитываете стоимость в калькуляторе и оставляете заявку онлайн." },
              { Icon: Phone, n: "2", t: "Менеджер связывается", d: "Проверяем макет, уточняем детали и подтверждаем итоговую сумму." },
              { Icon: QrCode, n: "3", t: "Оплачиваете по QR", d: "По заказу автоматически формируется QR-код (СБП) на нужную сумму — отсканируйте в приложении банка. Также можно картой или наличными в офисе." },
              { Icon: CreditCard, n: "4", t: "Берём в работу", d: "После оплаты запускаем печать. Чек пришлём на email." },
            ].map(({ Icon, n, t, d }) => (
              <li key={n} className="rounded-xl border border-ink-200 bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={22} strokeWidth={2} className="text-ink-400" />
                  <span className="font-heading text-2xl font-bold text-ink-200 tabular">{n}</span>
                </div>
                <h3 className="font-heading text-base font-bold text-ink-900 mb-1.5">{t}</h3>
                <p className="text-[13px] text-ink-600 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] text-ink-500">
            Работаем с физическими и юридическими лицами. Для оплаты по счёту (безнал)
            напишите менеджеру&nbsp;— выставим счёт и закрывающие документы.
          </p>

          <div className="mt-10 border-t border-ink-200 pt-8">
            <p className="eyebrow mb-3">Реквизиты</p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 max-w-2xl text-sm">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-0.5">Продавец</dt>
                <dd className="text-ink-900 font-medium">ИП Голубев А. А.</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-0.5">ИНН</dt>
                <dd className="text-ink-900 font-medium tabular">720319019022</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.14em] text-ink-400 mb-0.5">ОГРНИП</dt>
                <dd className="text-ink-900 font-medium tabular">322723200035243</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
