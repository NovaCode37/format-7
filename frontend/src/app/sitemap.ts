import type { MetadataRoute } from "next";
import { CATALOG_INDEX } from "@/lib/catalogIndex";
import { SITE_URL } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,           lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${SITE_URL}/catalog`,    lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${SITE_URL}/prices`,     lastModified: now, priority: 0.8, changeFrequency: "weekly" },
    { url: `${SITE_URL}/designer`,   lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contacts`,   lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE_URL}/reviews`,    lastModified: now, priority: 0.5, changeFrequency: "weekly" },
    { url: `${SITE_URL}/legal/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/legal/cookies`, lastModified: now, priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = CATALOG_INDEX.map((item) => ({
    url: `${SITE_URL}/services/${encodeURIComponent(item.slug)}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  // Категории-лендинги каталога (не отдельные услуги, но индексируемые страницы).
  const categorySlugs = ["оперативная-полиграфия"];
  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/services/${encodeURIComponent(slug)}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
