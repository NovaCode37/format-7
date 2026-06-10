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
    default: "Format7 — типография и копицентр в Тюмени",
    template: "%s — Format7",
  },
  description:
    "Format7 — типография полного цикла в Тюмени. Визитки, флаеры, сувениры, текстиль. Срочная печать за 1 час, доставка по городу.",
  keywords: ["типография", "копицентр", "печать", "визитки", "Тюмень", "Format7", "срочная печать"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Format7",
    title: "Format7 — типография и копицентр в Тюмени",
    description: "Срочная печать, визитки, полиграфия, сувениры.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Format7 — типография и копицентр в Тюмени",
    description: "Срочная печать, визитки, полиграфия, сувениры.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Format7" },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": SITE_URL,
  name: "Format7",
  image: `${SITE_URL}/og.jpg`,
  url: SITE_URL,
  telephone: "+7 932 475-95-11",
  priceRange: "₽₽",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Тюмень",
    addressCountry: "RU",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "10:00",
      closes: "21:00",
    },
  ],
  sameAs: [] as string[],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable} style={{ ["--font-inter" as any]: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif" }}>
      <head>
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
