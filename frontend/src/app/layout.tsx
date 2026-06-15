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
import CookieConsent from "@/components/CookieConsent";
import PWARegister from "@/components/PWARegister";
import { ToastProvider } from "@/components/Toast";
import ApiErrorGuard from "@/components/ApiErrorGuard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const METRIKA_ID = process.env.NEXT_PUBLIC_YM_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Формат7 — типография и копицентр в Тюмени",
    template: "%s — Формат7",
  },
  description:
    "Формат7 — онлайн-типография в Тюмени: визитки, листовки, флаеры, буклеты, наклейки, календари, печать документов и фотографий. Срочная печать за 1 час, доставка по городу.",
  keywords: [
    "типография Тюмень", "печать Тюмень", "визитки Тюмень", "листовки", "флаеры", "буклеты",
    "наклейки", "печать документов", "печать фото", "копицентр", "полиграфия Тюмень",
    "Формат7", "формат7.рф", "срочная печать",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Формат7",
    title: "Формат7 — типография и копицентр в Тюмени",
    description: "Срочная печать за 1 час, визитки, полиграфия, фотопечать. Доставка по Тюмени.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Формат7 — типография в Тюмени" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Формат7 — типография в Тюмени",
    description: "Срочная печать, визитки, полиграфия, фотопечать.",
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
      closes: "19:00",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable} style={{ ["--font-inter" as any]: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif" }}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-white text-ink-700">
        <ToastProvider>
          <AuthProvider>
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
                if (localStorage.getItem("f7_consent") !== "all") return;
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(${METRIKA_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
              })();
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
