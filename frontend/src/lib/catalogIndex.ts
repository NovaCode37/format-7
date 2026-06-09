import { IMG } from "./images";

export type CatalogIndexItem = {
  title: string;
  slug: string;
  image: string;
  from: string;
  group: string;

  keywords?: string[];
};

export const CATALOG_INDEX: CatalogIndexItem[] = [

  {
    title: "Копирование и печать",
    slug: "копирование-и-печать-документов",
    image: IMG.printStudio,
    from: "от 6 ₽",
    group: "Печать документов",
    keywords: ["копия", "ксерокс", "распечатать", "ч/б", "цветная"],
  },
  {
    title: "Сканирование",
    slug: "сканирование-документов",
    image: IMG.printDetail,
    from: "от 10 ₽",
    group: "Печать документов",
    keywords: ["скан", "оцифровка", "pdf", "scan"],
  },
  {
    title: "Ламинирование",
    slug: "ламинирование",
    image: IMG.printPress,
    from: "от 50 ₽",
    group: "Печать документов",
    keywords: ["плёнка", "ламинат", "глянец"],
  },
  {
    title: "Брошюровка и переплёт",
    slug: "переплёт-и-брошюровка",
    image: IMG.magazines,
    from: "от 120 ₽",
    group: "Печать документов",
    keywords: ["пружина", "скоба", "клеевой", "твёрдый"],
  },

  {
    title: "Визитки",
    slug: "визитки",
    image: IMG.businessCardMockup,
    from: "от 500 ₽",
    group: "Полиграфия",
    keywords: ["визитка", "карточки", "business card"],
  },
  {
    title: "Листовки",
    slug: "листовки",
    image: IMG.flyer,
    from: "от 300 ₽",
    group: "Полиграфия",
    keywords: ["a5", "a6", "реклама"],
  },
  {
    title: "Флаеры",
    slug: "флаеры",
    image: IMG.flyerMockup,
    from: "от 300 ₽",
    group: "Полиграфия",
    keywords: ["flyer", "евро", "реклама"],
  },
  {
    title: "Буклеты",
    slug: "буклеты",
    image: IMG.magazines,
    from: "от 800 ₽",
    group: "Полиграфия",
    keywords: ["евробуклет", "сгиб", "фальцовка"],
  },
  {
    title: "Открытки",
    slug: "открытки",
    image: IMG.polaroidHand,
    from: "от 400 ₽",
    group: "Полиграфия",
    keywords: ["postcard", "поздравление"],
  },
  {
    title: "Настольный календарь-домик",
    slug: "настольный-календарь-домик",
    image: IMG.printDetail,
    from: "от 100 ₽",
    group: "Полиграфия",
    keywords: ["домик", "настольный", "а5", "безблочный", "12 блоков"],
  },
  {
    title: "Плакатный календарь",
    slug: "плакатный-календарь",
    image: IMG.printPress,
    from: "от 230 ₽",
    group: "Полиграфия",
    keywords: ["плакат", "а3", "настенный", "односторонний"],
  },
  {
    title: "Карманные календари",
    slug: "карманные-календари",
    image: IMG.printDetail,
    from: "от 8 ₽",
    group: "Полиграфия",
    keywords: ["карманный", "7x10", "70x100"],
  },
  {
    title: "Перекидной настенный календарь",
    slug: "перекидной-календарь",
    image: IMG.printPress,
    from: "от 730 ₽",
    group: "Полиграфия",
    keywords: ["перекидной", "настенный", "пружина", "а3", "а4"],
  },
  {
    title: "Квартальный календарь",
    slug: "квартальный-календарь",
    image: IMG.printDetail,
    from: "от 300 ₽",
    group: "Полиграфия",
    keywords: ["квартальный", "3 пружины", "постер", "блоки"],
  },
  {
    title: "Наклейки и стикеры",
    slug: "наклейки",
    image: IMG.stickers,
    from: "от 200 ₽",
    group: "Полиграфия",
    keywords: ["стикеры", "магниты", "винил", "sticker"],
  },
  {
    title: "Меню для кафе",
    slug: "меню-для-кафе",
    image: IMG.flyerPaper,
    from: "от 600 ₽",
    group: "Полиграфия",
    keywords: ["ресторан", "бар", "карта блюд"],
  },
  {
    title: "Блокноты",
    slug: "блокноты",
    image: IMG.stickerPack,
    from: "от 400 ₽",
    group: "Полиграфия",
    keywords: ["записная книжка", "ежедневник", "notebook"],
  },
];

export function searchCatalog(
  query: string,
  limit = 8
): CatalogIndexItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { item: CatalogIndexItem; score: number }[] = [];

  for (const item of CATALOG_INDEX) {
    const haystacks = [
      item.title.toLowerCase(),
      item.slug.toLowerCase(),
      item.group.toLowerCase(),
      ...(item.keywords ?? []).map((k) => k.toLowerCase()),
    ];
    let best = -1;
    for (const h of haystacks) {
      const idx = h.indexOf(q);
      if (idx >= 0 && (best < 0 || idx < best)) best = idx;
    }
    if (best >= 0) results.push({ item, score: best });
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, limit).map((r) => r.item);
}
