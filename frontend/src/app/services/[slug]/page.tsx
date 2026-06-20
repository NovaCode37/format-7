"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Service } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ShoppingCart, Calculator, Loader2 } from "@/lib/icons";
import WishlistButton from "@/components/WishlistButton";
import ProductCalculator from "@/components/ProductCalculator";
import CategorySubProducts from "@/components/CategorySubProducts";
import { CATALOG_INDEX } from "@/lib/catalogIndex";
import { getProductCalculator } from "@/lib/productCalculators";
import CopyPrintCalculator from "@/components/CopyPrintCalculator";
import FlyerCalculator from "@/components/FlyerCalculator";
import CalendarCalculator from "@/components/CalendarCalculator";
import BindingCalculator from "@/components/BindingCalculator";
import ScanCalculator from "@/components/ScanCalculator";
import LaminationCalculator from "@/components/LaminationCalculator";
import MenuCalculator from "@/components/MenuCalculator";
import StickerCalculator from "@/components/StickerCalculator";
import BusinessCardCalculator from "@/components/BusinessCardCalculator";
import BookletCalculator from "@/components/BookletCalculator";
import DeskCalendarCalculator from "@/components/DeskCalendarCalculator";
import PocketCalendarCalculator from "@/components/PocketCalendarCalculator";
import FlipCalendarCalculator from "@/components/FlipCalendarCalculator";
import PostcardCalculator from "@/components/PostcardCalculator";
import QuarterlyCalendarCalculator from "@/components/QuarterlyCalendarCalculator";
import NotebookCalculator from "@/components/NotebookCalculator";
import LeafletCalculator from "@/components/LeafletCalculator";
import EnvelopeCalculator from "@/components/EnvelopeCalculator";
import DiplomaCalculator from "@/components/DiplomaCalculator";
import PhotoCalculator from "@/components/PhotoCalculator";

const COPY_PRINT_SLUG = "копирование-и-печать-документов";
const FLYER_SLUG = "флаеры";
const CALENDAR_SLUG = "плакатный-календарь";
const CALENDAR_SLUG_ALT = "плакатный-календарь";
const BINDING_SLUG = "брошюровка";
const BINDING_SLUG_ALT = "переплёт-и-брошюровка";
const SCAN_SLUG = "сканирование-документов";
const SCAN_SLUG_ALT = "сканирование";
const LAMINATION_SLUG = "ламинирование";
const MENU_SLUGS = ["меню", "меню-для-кафе", "меню-для-кафе-и-ресторанов"];
const STICKER_SLUGS = ["наклейки", "наклейки-и-стикеры", "стикеры"];
const CARD_SLUGS = ["визитки"];
const BOOKLET_SLUGS = ["буклеты"];
const DESK_CALENDAR_SLUGS = ["настольный-календарь-домик", "настольный-календарь", "календарь-домик", "календарь-настольный-домик"];
const POCKET_CALENDAR_SLUGS = ["карманные-календари", "карманный-календарь"];
const FLIP_CALENDAR_SLUGS = ["перекидной-календарь", "настенный-перекидной-календарь", "перекидные-календари", "перекидной-настенный-календарь"];
const POSTCARD_SLUGS = ["открытки", "открытка"];
const QUARTERLY_CALENDAR_SLUGS = ["квартальный-календарь", "квартальные-календари"];
const NOTEBOOK_SLUGS = ["блокноты", "блокнот"];
const LEAFLET_SLUGS = ["листовки", "листовка"];
const ENVELOPE_SLUGS = ["конверты", "конверт"];
const DIPLOMA_SLUGS = ["грамоты-и-дипломы", "грамоты", "дипломы", "грамоты-дипломы"];
const PHOTO_SLUGS = ["печать-фотографий", "печать-фото", "фотопечать"];

const CATEGORY_TITLES: Record<string, string> = {
  "оперативная-полиграфия": "Полиграфия на заказ",
};

type MiniCatalogItem = { label: string; href: string };

function getMiniCatalog(service: Service): MiniCatalogItem[] {
  const s = service.slug.toLowerCase();

  if (s === "копирование-и-печать-документов") {
    return [
      { label: "Копирование и печать", href: "/services/копирование-и-печать-документов" },
      { label: "Сканирование", href: "/services/сканирование-документов" },
      { label: "Ламинирование", href: "/services/ламинирование" },
      { label: "Брошюровка", href: "/services/переплёт-и-брошюровка" },
    ];
  }

  if (s === "оперативная-полиграфия") {
    return [
      { label: "Визитки", href: "/services/визитки" },
      { label: "Листовки", href: "/services/листовки" },
      { label: "Флаеры", href: "/services/флаеры" },
      { label: "Буклеты", href: "/services/буклеты" },
      { label: "Календари", href: "/services/календари" },
      { label: "Наклейки", href: "/services/наклейки" },
      { label: "Блокноты", href: "/services/блокноты" },
    ];
  }

  return [];
}

function findBestMatch(list: Service[], slug: string): Service | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase();

  const exact = list.find((s) => s.slug.toLowerCase() === decoded);
  if (exact) return exact;

  const endsWith = list.find((s) => decoded.endsWith(s.slug.toLowerCase()));
  if (endsWith) return endsWith;

  const partial = list.find(
    (s) => decoded.includes(s.slug.toLowerCase()) || s.slug.toLowerCase().includes(decoded)
  );
  if (partial) return partial;

  const slugWords = decoded.replace(/-/g, " ").split(" ");
  const byWord = list.find((s) => {
    const sWords = s.slug.toLowerCase().replace(/-/g, " ").split(" ");
    return slugWords.some((w) => w.length > 2 && sWords.some((sw) => sw.length > 2 && (sw.includes(w) || w.includes(sw))));
  });
  if (byWord) return byWord;

  const byName = list.find((s) => {
    const nameWords = s.name.toLowerCase().split(" ");
    return slugWords.some((w) => w.length > 2 && nameWords.some((nw) => nw.length > 2 && (nw.includes(w) || w.includes(nw))));
  });
  return byName;
}

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, addToCart } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [, setAllServices] = useState<Service[]>([]);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getServices().then((list) => {
      setAllServices(list);
      const found = findBestMatch(list, slug);
      setService(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    if (!user) { router.push("/login"); return; }
    if (!service) return;
    try {
      await addToCart(service.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={28} strokeWidth={2} />
      </div>
    );
  }

  if (!service) {
    const decodedSlug = decodeURIComponent(slug).toLowerCase();

    // Slug-категория (например «оперативная-полиграфия») — это каталог товаров,
    // а не отдельный товар. Показываем сетку продуктов категории, без калькулятора.
    if (CATEGORY_TITLES[decodedSlug]) {
      const categoryTitle = CATEGORY_TITLES[decodedSlug];
      return (
        <div className="bg-white">
          <section className="border-b border-ink-200">
            <div className="container-page py-10 sm:py-14">
              <p className="eyebrow mb-3">Категория</p>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
                {categoryTitle}
              </h1>
              <p className="text-ink-500 max-w-2xl">
                Выберите товар — рассчитайте стоимость онлайн и закажите в один клик. Доставка по Тюмени.
              </p>
            </div>
          </section>
          <CategorySubProducts activeSlug={decodedSlug} title={categoryTitle} />
          <OtherServices excludeSlug={decodeURIComponent(slug)} />
        </div>
      );
    }

    const displayName = decodeURIComponent(slug).replace(/-/g, " ");
    const fallbackCalc = getProductCalculator(slug);
    const hasDedicatedCalc = [
      COPY_PRINT_SLUG, FLYER_SLUG, CALENDAR_SLUG, CALENDAR_SLUG_ALT, BINDING_SLUG, BINDING_SLUG_ALT,
      SCAN_SLUG, SCAN_SLUG_ALT, LAMINATION_SLUG,
      ...MENU_SLUGS, ...STICKER_SLUGS, ...CARD_SLUGS, ...BOOKLET_SLUGS, ...DESK_CALENDAR_SLUGS,
      ...POCKET_CALENDAR_SLUGS, ...FLIP_CALENDAR_SLUGS, ...POSTCARD_SLUGS,
      ...QUARTERLY_CALENDAR_SLUGS, ...NOTEBOOK_SLUGS, ...LEAFLET_SLUGS,
      ...ENVELOPE_SLUGS, ...DIPLOMA_SLUGS, ...PHOTO_SLUGS,
    ].includes(decodedSlug);
    return (
      <div className="bg-white">
        <section className="border-b border-ink-200">
          <div className="container-page py-10 sm:py-14">
            <p className="eyebrow mb-3">Услуга</p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">
              {fallbackCalc?.title || (displayName.charAt(0).toUpperCase() + displayName.slice(1))}
            </h1>
            <p className="text-ink-500 max-w-2xl">
              Рассчитайте стоимость онлайн или закажите в один клик. Доставка по Тюмени.
            </p>
          </div>
        </section>

        {decodeURIComponent(slug).toLowerCase() === COPY_PRINT_SLUG ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <CopyPrintCalculator />
          </section>
        ) : decodeURIComponent(slug).toLowerCase() === FLYER_SLUG ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <FlyerCalculator />
          </section>
        ) : [CALENDAR_SLUG, CALENDAR_SLUG_ALT].includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <CalendarCalculator />
          </section>
        ) : [BINDING_SLUG, BINDING_SLUG_ALT].includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <BindingCalculator />
          </section>
        ) : [SCAN_SLUG, SCAN_SLUG_ALT].includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <ScanCalculator />
          </section>
        ) : decodeURIComponent(slug).toLowerCase() === LAMINATION_SLUG ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <LaminationCalculator />
          </section>
        ) : MENU_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <MenuCalculator />
          </section>
        ) : STICKER_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <StickerCalculator />
          </section>
        ) : CARD_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <BusinessCardCalculator />
          </section>
        ) : BOOKLET_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <BookletCalculator />
          </section>
        ) : DESK_CALENDAR_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <DeskCalendarCalculator />
          </section>
        ) : POCKET_CALENDAR_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <PocketCalendarCalculator />
          </section>
        ) : FLIP_CALENDAR_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <FlipCalendarCalculator />
          </section>
        ) : POSTCARD_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <PostcardCalculator />
          </section>
        ) : QUARTERLY_CALENDAR_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <QuarterlyCalendarCalculator />
          </section>
        ) : NOTEBOOK_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <NotebookCalculator />
          </section>
        ) : LEAFLET_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <LeafletCalculator />
          </section>
        ) : ENVELOPE_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <EnvelopeCalculator />
          </section>
        ) : DIPLOMA_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <DiplomaCalculator />
          </section>
        ) : PHOTO_SLUGS.includes(decodeURIComponent(slug).toLowerCase()) ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <PhotoCalculator />
          </section>
        ) : fallbackCalc ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <ProductCalculator config={fallbackCalc} serviceId={0} />
          </section>
        ) : null}

        {(() => {
          const decoded = decodeURIComponent(slug).toLowerCase();
          const title = CATEGORY_TITLES[decoded];
          if (title) {
            return <CategorySubProducts activeSlug={decoded} title={title} />;
          }
          return <CategorySubProducts activeSlug={decoded} title="Другие товары категории" variant="carousel" />;
        })()}

        {!fallbackCalc && !hasDedicatedCalc && (
          <section className="container-page py-14 sm:py-20 text-center">
            <p className="text-ink-500 mb-6">Для расчёта стоимости перейдите в калькулятор.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/calculator" className="btn-primary">
                <Calculator size={16} strokeWidth={2} />
                Рассчитать стоимость
              </Link>
              <Link href="/" className="btn">На главную</Link>
            </div>
          </section>
        )}

        <OtherServices excludeSlug={decodeURIComponent(slug)} />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {(() => {
        const miniCatalog = getMiniCatalog(service);
        return miniCatalog.length > 0 ? (
          <section className="border-b border-ink-200 bg-ink-50">
            <div className="container-page py-8 sm:py-10">
              <p className="eyebrow mb-3">Мини-каталог</p>
              <div className="flex flex-wrap gap-2">
                {miniCatalog.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center rounded-md border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:text-brand hover:border-brand/30 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      })()}

      <div className="border-b border-ink-200">
        <div className="container-page py-3 text-[12px] text-ink-400">
          <Link href="/" className="hover:text-ink-900 transition-colors">Главная</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-700">{service.name}</span>
        </div>
      </div>

      <section className="border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-start">
            <div className="col-span-12 md:col-span-8">
              <p className="eyebrow mb-3">Услуга</p>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 tracking-tight mb-3">{service.name}</h1>
              <p className="text-ink-500 max-w-2xl">{service.description || "Рассчитайте стоимость онлайн или закажите в один клик. Доставка по Тюмени."}</p>
            </div>
            <div className="col-span-12 md:col-span-4 flex flex-wrap gap-2 md:justify-end">
              <WishlistButton serviceId={service.id} className="border border-ink-200 rounded-md p-3" />
              <Link href="/cart" className="btn-secondary btn-sm">
                <ShoppingCart size={14} strokeWidth={2} />
                Корзина
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(() => {
        const decoded = service.slug.toLowerCase();
        const title = CATEGORY_TITLES[decoded];
        if (title) {
          return <CategorySubProducts activeSlug={decoded} title={title} />;
        }
        return null;
      })()}

      {(() => {
        if (CATEGORY_TITLES[service.slug.toLowerCase()]) return null;
        if (service.slug.toLowerCase() === COPY_PRINT_SLUG) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <CopyPrintCalculator serviceId={service.id} />
            </section>
          );
        }
        if (service.slug.toLowerCase() === FLYER_SLUG) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <FlyerCalculator serviceId={service.id} />
            </section>
          );
        }
        if ([CALENDAR_SLUG, CALENDAR_SLUG_ALT].includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <CalendarCalculator serviceId={service.id} />
            </section>
          );
        }
        if ([BINDING_SLUG, BINDING_SLUG_ALT].includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <BindingCalculator serviceId={service.id} />
            </section>
          );
        }
        if ([SCAN_SLUG, SCAN_SLUG_ALT].includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <ScanCalculator serviceId={service.id} />
            </section>
          );
        }
        if (service.slug.toLowerCase() === LAMINATION_SLUG) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <LaminationCalculator serviceId={service.id} />
            </section>
          );
        }
        if (MENU_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <MenuCalculator serviceId={service.id} />
            </section>
          );
        }
        if (STICKER_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <StickerCalculator serviceId={service.id} />
            </section>
          );
        }
        if (CARD_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <BusinessCardCalculator serviceId={service.id} />
            </section>
          );
        }
        if (BOOKLET_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <BookletCalculator serviceId={service.id} />
            </section>
          );
        }
        if (DESK_CALENDAR_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <DeskCalendarCalculator serviceId={service.id} />
            </section>
          );
        }
        if (POCKET_CALENDAR_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <PocketCalendarCalculator serviceId={service.id} />
            </section>
          );
        }
        if (FLIP_CALENDAR_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <FlipCalendarCalculator serviceId={service.id} />
            </section>
          );
        }
        if (POSTCARD_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <PostcardCalculator serviceId={service.id} />
            </section>
          );
        }
        if (QUARTERLY_CALENDAR_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <QuarterlyCalendarCalculator serviceId={service.id} />
            </section>
          );
        }
        if (NOTEBOOK_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <NotebookCalculator serviceId={service.id} />
            </section>
          );
        }
        if (LEAFLET_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <LeafletCalculator serviceId={service.id} />
            </section>
          );
        }
        if (ENVELOPE_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <EnvelopeCalculator serviceId={service.id} />
            </section>
          );
        }
        if (DIPLOMA_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <DiplomaCalculator serviceId={service.id} />
            </section>
          );
        }
        if (PHOTO_SLUGS.includes(service.slug.toLowerCase())) {
          return (
            <section className="border-b border-ink-200 bg-ink-50/40">
              <PhotoCalculator serviceId={service.id} />
            </section>
          );
        }
        const calc = getProductCalculator(service.slug);
        return calc ? (
          <section className="border-b border-ink-200 bg-ink-50/40">
            <ProductCalculator config={calc} serviceId={service.id} />
          </section>
        ) : (
          <section className="border-b border-ink-200">
            <div className="container-page py-10 sm:py-14">
              <div className="flex flex-wrap gap-3">
                <button onClick={handleAdd} className="btn-primary">
                  <ShoppingCart size={16} strokeWidth={2} />
                  {added ? "Добавлено ✓" : "Добавить в корзину"}
                </button>
                <Link href="/calculator" className="btn-secondary">
                  <Calculator size={14} strokeWidth={2} />
                  Полный калькулятор
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {(() => {
        const decoded = service.slug.toLowerCase();
        if (CATEGORY_TITLES[decoded]) return null;
        return <CategorySubProducts activeSlug={decoded} title="Другие товары категории" variant="carousel" />;
      })()}

      <OtherServices excludeSlug={service.slug} />
    </div>
  );
}

function OtherServices({ excludeSlug }: { excludeSlug?: string }) {
  const exclude = decodeURIComponent(excludeSlug || "").toLowerCase();
  const items = CATALOG_INDEX.filter((i) => i.slug.toLowerCase() !== exclude).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section className="container-page py-14 sm:py-20">
      <h2 className="h-section mb-6">Другие услуги</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white hover:border-ink-300 hover:shadow-card transition-all duration-200"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
              <img
                src={s.image}
                alt={s.title}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-3.5">
              <h3 className="text-sm font-semibold text-ink-900 group-hover:text-brand transition-colors leading-tight">
                {s.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-500 tabular">{s.from}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
