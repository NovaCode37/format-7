import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Цены на услуги типографии в Тюмени — прайс-лист",
  description:
    "Актуальный прайс-лист типографии Формат7 в Тюмени: визитки, листовки, флаеры, буклеты, наклейки, календари, печать и сканирование документов. Стоимость за единицу, зависит от тиража.",
  alternates: { canonical: `${SITE_URL}/prices` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${SITE_URL}/prices`,
    siteName: "Формат7",
    title: "Прайс-лист — Формат7, Тюмень",
    description: "Цены на печать и полиграфию в Тюмени. Стоимость за единицу, зависит от тиража.",
  },
};

export default function PricesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
