import type { MetadataRoute } from "next";
import { PRICE_CATEGORIES } from "@/lib/prices";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,          lastModified: now, priority: 1.0,  changeFrequency: "weekly" },
    { url: `${SITE_URL}/catalog`,   lastModified: now, priority: 0.9,  changeFrequency: "weekly" },
    { url: `${SITE_URL}/prices`,    lastModified: now, priority: 0.9,  changeFrequency: "weekly" },
    { url: `${SITE_URL}/calculator`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/designer`,  lastModified: now, priority: 0.6,  changeFrequency: "monthly" },
    { url: `${SITE_URL}/contacts`,  lastModified: now, priority: 0.6,  changeFrequency: "monthly" },
    { url: `${SITE_URL}/reviews`,   lastModified: now, priority: 0.5,  changeFrequency: "weekly" },
    { url: `${SITE_URL}/legal/offer`,   lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/legal/cookies`, lastModified: now, priority: 0.3 },
  ];

  const priceRoutes: MetadataRoute.Sitemap = PRICE_CATEGORIES.map(cat => ({
    url: `${SITE_URL}/prices#${cat.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...priceRoutes];
}
