import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const inter = {
  variable: "font-system",
};
import { AuthProvider } from "@/lib/auth-context";
import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import VerifyBanner from "@/components/VerifyBanner";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollProgress from "@/components/ScrollProgress";
import CookieConsent from "@/components/CookieConsent";
import PWARegister from "@/components/PWARegister";
import { ToastProvider } from "@/components/Toast";
import ApiErrorGuard from "@/components/ApiErrorGuard";

import { SITE_URL } from "@/lib/siteUrl";

const METRIKA_ID = process.env.NEXT_PUBLIC_YM_ID || "110140760";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Формат7 — типография и копицентр в Тюмени",
    template: "%s — Формат7",
  },
  description:
    "Формат7 — онлайн-типография в Тюмени: визитки, листовки, флаеры, буклеты, наклейки, календари, печать документов и фотографий. Доставка по городу.",
  keywords: [
    "типография Тюмень", "печать Тюмень", "визитки Тюмень", "листовки", "флаеры", "буклеты",
    "наклейки", "печать документов", "печать фото", "копицентр", "полиграфия Тюмень",
    "Формат7", "формат7.рф",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Формат7",
    title: "Формат7 — типография и копицентр в Тюмени",
    description: "Визитки, полиграфия, фотопечать. Доставка по Тюмени.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Формат7 — типография в Тюмени" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Формат7 — типография в Тюмени",
    description: "Визитки, полиграфия, фотопечать. Доставка по Тюмени.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Формат7" },
  category: "typography",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Геопривязка для Яндекса/региональной выдачи (регион также задаётся в Вебмастере).
  other: {
    "geo.region": "RU-TYU",
    "geo.placename": "Тюмень",
    "geo.position": "57.109684;65.590356",
    ICBM: "57.109684, 65.590356",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "PrintShop",
  "@id": `${SITE_URL}/#business`,
  name: "Формат7",
  legalName: "ИП Голубев Александр Александрович",
  image: `${SITE_URL}/logo.png`,
  url: SITE_URL,
  telephone: "+79324759511",
  email: "Format7-tmn@yandex.ru",
  priceRange: "₽₽",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Широтная, д. 113, к1 стр1, офис 7",
    addressLocality: "Тюмень",
    postalCode: "625046",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 57.109684,
    longitude: 65.590356,
  },
  areaServed: { "@type": "City", name: "Тюмень" },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "13:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "14:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "10:00",
      closes: "16:00",
    },
  ],
  sameAs: [
    "https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE",
  ],
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Формат7",
  legalName: "ИП Голубев Александр Александрович",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  email: "Format7-tmn@yandex.ru",
  telephone: "+79324759511",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Широтная, д. 113, к1 стр1, офис 7",
    addressLocality: "Тюмень",
    postalCode: "625046",
    addressCountry: "RU",
  },
  areaServed: { "@type": "City", name: "Тюмень" },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+79324759511",
    contactType: "customer service",
    areaServed: "RU",
    availableLanguage: "Russian",
  },
  sameAs: [
    "https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE",
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Формат7",
  description: "Онлайн-типография и копицентр в Тюмени",
  inLanguage: "ru-RU",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable} style={{ ["--font-inter" as any]: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif" }}>
      <head>
        {/* Явный shortcut icon — Яндекс ищет именно его. */}
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-white text-ink-700">
        <div className="noise-overlay" aria-hidden />
        <ToastProvider>
          <AuthProvider>
            <ScrollProgress />
            <ApiErrorGuard />
            <Topbar />
            <Header />
            <VerifyBanner />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <CookieConsent />
            <PWARegister />
          </AuthProvider>
        </ToastProvider>

        {METRIKA_ID && (
          <Script id="ym" strategy="afterInteractive">
            {`
              (function() {
                if (typeof window === "undefined") return;
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}", "ym");
                ym(${METRIKA_ID}, "init", {
                  ssr:true,
                  webvisor:true,
                  clickmap:true,
                  ecommerce:"dataLayer",
                  accurateTrackBounce:true,
                  trackLinks:true,
                  referrer: document.referrer,
                  url: location.href
                });
              })();
            `}
          </Script>
        )}
        {METRIKA_ID && (
          <noscript>
            <div>
              <img
                src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        )}
      </body>
    </html>
  );
}
