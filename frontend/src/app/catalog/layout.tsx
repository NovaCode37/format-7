import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://формат7.рф";

export const metadata: Metadata = {
  title: "Каталог услуг типографии в Тюмени",
  description:
    "Полный каталог типографии Формат7 в Тюмени: визитки, листовки, флаеры, буклеты, наклейки, календари, печать документов и фотографий. Расчёт цены онлайн и доставка по городу.",
  alternates: { canonical: `${SITE_URL}/catalog` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${SITE_URL}/catalog`,
    siteName: "Формат7",
    title: "Каталог услуг — Формат7, Тюмень",
    description:
      "Визитки, полиграфия, наклейки, календари, печать документов и фото. Онлайн-расчёт и доставка по Тюмени.",
  },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
