import type { Metadata } from "next";
import { CATALOG_INDEX } from "@/lib/catalogIndex";
import { SERVICE_FAQ } from "@/lib/serviceFaq";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://формат7.рф";

// Категории-слаги, у которых нет отдельной услуги (показывают каталог).
const CATEGORY_TITLES: Record<string, string> = {
  "оперативная-полиграфия": "Полиграфия на заказ",
};

function findItem(decoded: string) {
  return CATALOG_INDEX.find((i) => i.slug.toLowerCase() === decoded);
}

function priceNumber(from?: string): number | null {
  if (!from) return null;
  const m = from.replace(/ /g, " ").match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const decoded = decodeURIComponent(params.slug).toLowerCase();
  const item = findItem(decoded);
  const categoryTitle = CATEGORY_TITLES[decoded];
  const name =
    item?.title ||
    categoryTitle ||
    decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, " ");

  const priceNote = item?.from ? ` ${item.from}.` : ".";
  const title = `${name} в Тюмени`;
  const description =
    `${name} в типографии Формат7, Тюмень —${priceNote} ` +
    `Расчёт стоимости онлайн, заказ в один клик, доставка по городу.`;
  const canonical = `${SITE_URL}/services/${encodeURIComponent(decoded)}`;

  return {
    title,
    description,
    keywords: item?.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: canonical,
      siteName: "Формат7",
      title: `${title} — Формат7`,
      description,
      images: item?.image ? [{ url: item.image, alt: name }] : undefined,
    },
  };
}

export default function ServiceLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: React.ReactNode;
}) {
  const decoded = decodeURIComponent(params.slug).toLowerCase();
  const item = findItem(decoded);
  const name = item?.title || CATEGORY_TITLES[decoded] ||
    decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, " ");
  const url = `${SITE_URL}/services/${encodeURIComponent(decoded)}`;
  const low = priceNumber(item?.from);

  // Микроразметка товара + хлебные крошки для поисковиков.
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: item?.image ? `${SITE_URL}${item.image}` : `${SITE_URL}/logo.png`,
    description: `${name} — типография Формат7, Тюмень.`,
    brand: { "@type": "Brand", name: "Формат7" },
    category: item?.group,
    url,
    ...(low != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "RUB",
            price: low,
            availability: "https://schema.org/InStock",
            areaServed: { "@type": "City", name: "Тюмень" },
            seller: { "@type": "Organization", name: "Формат7" },
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/catalog` },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SERVICE_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {children}
    </>
  );
}
