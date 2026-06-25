import type { Metadata } from "next";
import RunningBanner from "@/components/RunningBanner";
import CategoryCards from "@/components/CategoryCards";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsWall from "@/components/TestimonialsWall";
import FinalCTA from "@/components/FinalCTA";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Формат7 — типография и копицентр в Тюмени",
  description:
    "Онлайн-типография Формат7 в Тюмени: визитки, листовки, флаеры, буклеты, наклейки, календари, печать документов и фотографий. Расчёт цены онлайн, заказ в один клик, доставка по городу.",
  alternates: { canonical: SITE_URL },
};

export default function HomePage() {
  return (
    <>
      <RunningBanner />
      <CategoryCards />
      <HowItWorks />
      <TestimonialsWall />
      <FinalCTA />
    </>
  );
}
