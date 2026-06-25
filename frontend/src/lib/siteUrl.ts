// Единый базовый URL сайта в ASCII/punycode-форме.
// IDN-домен (формат7.рф) нормализуется в xn--7-7sb9ahkoj.xn--p1ai — так
// robots.txt, sitemap.xml и canonical стабильно читаются поисковиками
// (кириллица в host даёт кракозябры/неоднозначность). Поисковик сам сопоставит
// punycode с кириллическим доменом.
const RAW = process.env.NEXT_PUBLIC_SITE_URL || "https://формат7.рф";

export const SITE_URL = (() => {
  try {
    return new URL(RAW).origin;
  } catch {
    return RAW.replace(/\/+$/, "");
  }
})();
