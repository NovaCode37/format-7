import { IMG } from "./images";

export type CalcOptionValue = {
  label: string;
  multiplier: number;
  hint?: string;
};

export type CalcOption = {
  key: string;
  label: string;

  variant?: "pills" | "select";
  values: CalcOptionValue[];
};

export type QuantityTier = {

  min: number;

  multiplier: number;
};

export type ProductCalc = {

  slugs: string[];
  title: string;
  unit: string;
  basePricePerUnit: number;

  quantityPresets: number[];
  defaultQuantity: number;
  minQuantity: number;

  gallery: string[];

  options: CalcOption[];

  quantityTiers?: QuantityTier[];

  templateUrl?: string;
};

const DEFAULT_TIERS: QuantityTier[] = [
  { min: 1,    multiplier: 1.0  },
  { min: 50,   multiplier: 0.85 },
  { min: 100,  multiplier: 0.70 },
  { min: 250,  multiplier: 0.55 },
  { min: 500,  multiplier: 0.45 },
  { min: 1000, multiplier: 0.38 },
  { min: 2000, multiplier: 0.32 },
];

export const PRODUCT_CALCULATORS: ProductCalc[] = [

  {
    slugs: ["визитки"],
    title: "Визитки",
    unit: "шт.",
    basePricePerUnit: 9,
    quantityPresets: [50, 100, 200, 500, 1000, 2000],
    defaultQuantity: 100,
    minQuantity: 50,
    gallery: [IMG.businessCardMockup, IMG.businessCardsStack, IMG.businessCardBrand, IMG.businessCards],
    options: [
      {
        key: "size",
        label: "Размер визитки",
        variant: "select",
        values: [
          { label: "90×50 мм (стандарт)", multiplier: 1 },
          { label: "85×55 мм (евро)",     multiplier: 1.05 },
          { label: "50×50 мм (квадратная)", multiplier: 0.95 },
        ],
      },
      {
        key: "paper",
        label: "Материал",
        values: [
          { label: "Мелованная 300 г/м²", multiplier: 1 },
          { label: "Картон 350 г/м²", multiplier: 1.2 },
          { label: "Дизайнерская", multiplier: 2.2 },
          { label: "Пластик 0,3 мм", multiplier: 4.0 },
        ],
      },
      {
        key: "color",
        label: "Цветность печати",
        values: [
          { label: "4+0 односторонние", multiplier: 1 },
          { label: "4+4 двусторонние",  multiplier: 1.55 },
          { label: "1+0 ч/б",           multiplier: 0.55 },
          { label: "1+1 ч/б",           multiplier: 0.85 },
        ],
      },
      {
        key: "lamination",
        label: "Ламинация",
        values: [
          { label: "Без ламинации", multiplier: 1 },
          { label: "Глянцевая 30 мкм", multiplier: 1.25 },
          { label: "Матовая 30 мкм",   multiplier: 1.35 },
          { label: "Soft-touch",       multiplier: 1.85 },
        ],
      },
      {
        key: "corners",
        label: "Углы",
        values: [
          { label: "Прямые", multiplier: 1 },
          { label: "Скруглённые", multiplier: 1.15 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["листовки", "оперативная-полиграфия"],
    title: "Листовки",
    unit: "шт.",
    basePricePerUnit: 14,
    quantityPresets: [100, 200, 500, 1000, 2000, 5000],
    defaultQuantity: 500,
    minQuantity: 100,
    gallery: [IMG.flyer, IMG.flyerMockup, IMG.flyerPaper],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А7 (74×105 мм)",  multiplier: 0.45 },
          { label: "А6 (105×148 мм)", multiplier: 0.7 },
          { label: "А5 (148×210 мм)", multiplier: 1 },
          { label: "А4 (210×297 мм)", multiplier: 1.8 },
          { label: "А3 (297×420 мм)", multiplier: 3.6 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Мелованная 130 г/м²", multiplier: 1 },
          { label: "Мелованная 170 г/м²", multiplier: 1.25 },
          { label: "Мелованная 250 г/м²", multiplier: 1.6 },
          { label: "Дизайнерская",         multiplier: 2.2 },
        ],
      },
      {
        key: "color",
        label: "Цветность",
        values: [
          { label: "4+0 односторонние", multiplier: 1 },
          { label: "4+4 двусторонние",  multiplier: 1.55 },
          { label: "1+0 ч/б",           multiplier: 0.5 },
          { label: "1+1 ч/б",           multiplier: 0.78 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["флаеры"],
    title: "Флаеры",
    unit: "шт.",
    basePricePerUnit: 12,
    quantityPresets: [100, 200, 500, 1000, 2000, 5000],
    defaultQuantity: 500,
    minQuantity: 100,
    gallery: [IMG.flyerMockup, IMG.flyer, IMG.flyerPaper],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "Евро (98×210 мм)", multiplier: 1 },
          { label: "А6 (105×148 мм)",  multiplier: 0.85 },
          { label: "А5 (148×210 мм)",  multiplier: 1.2 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Мелованная 130 г/м²", multiplier: 1 },
          { label: "Мелованная 170 г/м²", multiplier: 1.25 },
          { label: "Мелованная 250 г/м²", multiplier: 1.55 },
        ],
      },
      {
        key: "color",
        label: "Цветность",
        values: [
          { label: "4+0", multiplier: 1 },
          { label: "4+4", multiplier: 1.55 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["буклеты"],
    title: "Буклеты",
    unit: "шт.",
    basePricePerUnit: 60,
    quantityPresets: [50, 100, 200, 500, 1000],
    defaultQuantity: 100,
    minQuantity: 50,
    gallery: [IMG.magazines, IMG.flyerPaper, IMG.flyer],
    options: [
      {
        key: "size",
        label: "Формат и фальцовка",
        variant: "select",
        values: [
          { label: "А4 → евробуклет (3 сгиба)", multiplier: 1 },
          { label: "А3 → 2 сгиба",               multiplier: 1.9 },
          { label: "А5 → 1 сгиб",                multiplier: 0.7 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Мелованная 130 г/м²", multiplier: 1 },
          { label: "Мелованная 170 г/м²", multiplier: 1.2 },
          { label: "Мелованная 250 г/м²", multiplier: 1.5 },
        ],
      },
      {
        key: "color",
        label: "Цветность",
        values: [
          { label: "4+4 двусторонние", multiplier: 1 },
          { label: "4+0 односторонние", multiplier: 0.7 },
          { label: "Ч/б двусторонние",  multiplier: 0.45 },
        ],
      },
      {
        key: "lamination",
        label: "Ламинация",
        values: [
          { label: "Без ламинации", multiplier: 1 },
          { label: "Глянцевая",     multiplier: 1.25 },
          { label: "Матовая",       multiplier: 1.35 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["открытки"],
    title: "Открытки",
    unit: "шт.",
    basePricePerUnit: 35,
    quantityPresets: [50, 100, 200, 500, 1000],
    defaultQuantity: 100,
    minQuantity: 50,
    gallery: [IMG.polaroid, IMG.polaroidHand, IMG.photoPrints],
    options: [
      {
        key: "size",
        label: "Размер",
        variant: "select",
        values: [
          { label: "Евро (98×210 мм)", multiplier: 1 },
          { label: "А6 (105×148 мм)",  multiplier: 0.85 },
          { label: "А5 (148×210 мм)",  multiplier: 1.4 },
        ],
      },
      {
        key: "color",
        label: "Цветность",
        values: [
          { label: "Односторонние 4+0", multiplier: 1 },
          { label: "Двусторонние 4+4",  multiplier: 1.4 },
          { label: "С тиснением фольгой", multiplier: 2.2 },
        ],
      },
      {
        key: "lamination",
        label: "Покрытие",
        values: [
          { label: "Без покрытия", multiplier: 1 },
          { label: "Глянцевая ламинация", multiplier: 1.2 },
          { label: "Матовая ламинация",   multiplier: 1.3 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["конверты"],
    title: "Конверты",
    unit: "шт.",
    basePricePerUnit: 30,
    quantityPresets: [20, 50, 100, 200, 500],
    defaultQuantity: 100,
    minQuantity: 20,
    gallery: [IMG.businessCardBrand, IMG.flyerPaper],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "Е65 (110×220 мм)", multiplier: 1 },
          { label: "С5 (162×229 мм)",  multiplier: 1.1 },
          { label: "С4 (229×324 мм)",  multiplier: 1.5 },
        ],
      },
      {
        key: "color",
        label: "Цветность печати",
        values: [
          { label: "4+0 цветная", multiplier: 1 },
          { label: "1+0 ч/б",     multiplier: 0.55 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["календари"],
    title: "Календари",
    unit: "шт.",
    basePricePerUnit: 90,
    quantityPresets: [10, 25, 50, 100, 250, 500],
    defaultQuantity: 50,
    minQuantity: 10,
    gallery: [IMG.printDetail, IMG.printPress, IMG.printStudio],
    options: [
      {
        key: "type",
        label: "Тип календаря",
        variant: "select",
        values: [
          { label: "Карманный 70×100 мм",   multiplier: 0.25 },
          { label: "Настенный А4 (1 лист)", multiplier: 1 },
          { label: "Настенный А3 (1 лист)", multiplier: 1.6 },
          { label: "Перекидной А3 (12 л.)", multiplier: 4.5 },
          { label: "Домик настольный",       multiplier: 1.8 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Мелованная 170 г/м²",  multiplier: 1 },
          { label: "Мелованная 250 г/м²",  multiplier: 1.2 },
          { label: "Дизайнерская",          multiplier: 1.7 },
        ],
      },
      {
        key: "lamination",
        label: "Ламинация",
        values: [
          { label: "Без ламинации", multiplier: 1 },
          { label: "Глянцевая",     multiplier: 1.2 },
          { label: "Матовая",       multiplier: 1.3 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["копирование-и-печать-документов"],
    title: "Копирование и печать документов",
    unit: "стр.",
    basePricePerUnit: 6,
    quantityPresets: [10, 50, 100, 500, 1000],
    defaultQuantity: 50,
    minQuantity: 1,
    gallery: [IMG.printStudio, IMG.printDetail, IMG.printPress],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А4", multiplier: 1 },
          { label: "А3", multiplier: 2.0 },
          { label: "А2", multiplier: 4.5 },
          { label: "А1", multiplier: 9 },
        ],
      },
      {
        key: "color",
        label: "Цветность",
        values: [
          { label: "Ч/б",     multiplier: 1 },
          { label: "Цветная", multiplier: 4 },
        ],
      },
      {
        key: "sides",
        label: "Сторонность",
        values: [
          { label: "Односторонняя", multiplier: 1 },
          { label: "Двусторонняя",  multiplier: 1.7 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Офисная 80 г/м²", multiplier: 1 },
          { label: "Плотная 160 г/м²", multiplier: 1.4 },
          { label: "Мелованная 200 г/м²", multiplier: 2 },
        ],
      },
    ],
    quantityTiers: [
      { min: 1,    multiplier: 1.0  },
      { min: 50,   multiplier: 0.9  },
      { min: 100,  multiplier: 0.78 },
      { min: 500,  multiplier: 0.65 },
      { min: 1000, multiplier: 0.55 },
    ],
  },

  {
    slugs: ["сканирование-документов"],
    title: "Сканирование документов",
    unit: "стр.",
    basePricePerUnit: 10,
    quantityPresets: [10, 50, 100, 500],
    defaultQuantity: 20,
    minQuantity: 1,
    gallery: [IMG.printDetail, IMG.printStudio],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А4", multiplier: 1 },
          { label: "А3", multiplier: 1.8 },
          { label: "А2", multiplier: 3.5 },
          { label: "А1", multiplier: 6 },
        ],
      },
      {
        key: "dpi",
        label: "Разрешение",
        values: [
          { label: "300 dpi (документы)", multiplier: 1 },
          { label: "600 dpi (фото)",       multiplier: 1.4 },
          { label: "1200 dpi (премиум)",  multiplier: 2.2 },
        ],
      },
      {
        key: "format",
        label: "Формат файла",
        values: [
          { label: "PDF",   multiplier: 1 },
          { label: "JPEG",  multiplier: 1 },
          { label: "TIFF",  multiplier: 1.15 },
        ],
      },
    ],
  },

  {
    slugs: ["ламинирование"],
    title: "Ламинирование",
    unit: "шт.",
    basePricePerUnit: 50,
    quantityPresets: [1, 5, 10, 25, 50, 100],
    defaultQuantity: 5,
    minQuantity: 1,
    gallery: [IMG.printDetail, IMG.printStudio],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "Визитка (90×50)",  multiplier: 0.4 },
          { label: "А6",               multiplier: 0.6 },
          { label: "А5",               multiplier: 0.8 },
          { label: "А4",               multiplier: 1 },
          { label: "А3",               multiplier: 1.9 },
          { label: "А2",               multiplier: 3.5 },
        ],
      },
      {
        key: "thickness",
        label: "Толщина плёнки",
        values: [
          { label: "75 мкм",  multiplier: 1 },
          { label: "100 мкм", multiplier: 1.15 },
          { label: "125 мкм", multiplier: 1.3 },
          { label: "175 мкм", multiplier: 1.55 },
          { label: "250 мкм", multiplier: 1.95 },
        ],
      },
      {
        key: "finish",
        label: "Покрытие",
        values: [
          { label: "Глянцевое", multiplier: 1 },
          { label: "Матовое",   multiplier: 1.1 },
        ],
      },
    ],
  },

  {
    slugs: ["переплёт-и-брошюровка"],
    title: "Брошюровка и переплёт",
    unit: "шт.",
    basePricePerUnit: 120,
    quantityPresets: [1, 5, 10, 25, 50],
    defaultQuantity: 5,
    minQuantity: 1,
    gallery: [IMG.magazines, IMG.printPress],
    options: [
      {
        key: "type",
        label: "Тип переплёта",
        variant: "select",
        values: [
          { label: "Пластиковая пружина",   multiplier: 1 },
          { label: "Металлическая пружина", multiplier: 1.5 },
          { label: "Клеевой (КБС)",          multiplier: 2.0 },
          { label: "На скобу (брошюровка)",  multiplier: 0.5 },
          { label: "Твёрдый переплёт",       multiplier: 4.5 },
        ],
      },
      {
        key: "format",
        label: "Формат",
        values: [
          { label: "А5", multiplier: 0.8 },
          { label: "А4", multiplier: 1 },
          { label: "А3", multiplier: 1.7 },
        ],
      },
      {
        key: "cover",
        label: "Обложка",
        values: [
          { label: "Прозрачная плёнка + картон", multiplier: 1 },
          { label: "Полноцветная печатная",       multiplier: 1.3 },
          { label: "Кожзам (для твёрдого)",        multiplier: 1.8 },
        ],
      },
    ],
  },

  {
    slugs: ["печать-фотографий"],
    title: "Печать фотографий",
    unit: "шт.",
    basePricePerUnit: 25,
    quantityPresets: [10, 25, 50, 100, 250],
    defaultQuantity: 25,
    minQuantity: 1,
    gallery: [IMG.polaroid, IMG.polaroidHand, IMG.photoPrints],
    options: [
      {
        key: "size",
        label: "Размер",
        variant: "select",
        values: [
          { label: "10×15",  multiplier: 1 },
          { label: "13×18",  multiplier: 1.2 },
          { label: "15×20",  multiplier: 1.6 },
          { label: "20×30",  multiplier: 3.2 },
          { label: "30×40",  multiplier: 5.5 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Глянцевая", multiplier: 1 },
          { label: "Матовая",   multiplier: 1.05 },
          { label: "Премиум-перламутр", multiplier: 1.6 },
        ],
      },
      {
        key: "correction",
        label: "Цветокоррекция",
        values: [
          { label: "Авто",        multiplier: 1 },
          { label: "Ручная",      multiplier: 1.25 },
          { label: "Без коррекции", multiplier: 0.95 },
        ],
      },
    ],
  },

  {
    slugs: ["грамоты", "грамоты-и-дипломы", "дипломы"],
    title: "Грамоты и дипломы",
    unit: "шт.",
    basePricePerUnit: 70,
    quantityPresets: [10, 25, 50, 100, 200],
    defaultQuantity: 25,
    minQuantity: 5,
    gallery: [IMG.printPress, IMG.printDetail, IMG.magazines],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А4 (210×297 мм)", multiplier: 1 },
          { label: "А3 (297×420 мм)", multiplier: 1.8 },
          { label: "А5 (148×210 мм)", multiplier: 0.7 },
        ],
      },
      {
        key: "paper",
        label: "Бумага",
        values: [
          { label: "Дизайнерская 250 г/м²",  multiplier: 1 },
          { label: "Мелованная 300 г/м²",    multiplier: 0.8 },
          { label: "Перламутровая",            multiplier: 1.5 },
          { label: "Льняная фактурная",        multiplier: 1.7 },
        ],
      },
      {
        key: "decor",
        label: "Декор",
        values: [
          { label: "Без декора",          multiplier: 1 },
          { label: "Тиснение фольгой",   multiplier: 2.0 },
          { label: "УФ-лак выборочный",  multiplier: 1.5 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["меню", "меню-для-кафе"],
    title: "Меню для кафе и ресторанов",
    unit: "шт.",
    basePricePerUnit: 180,
    quantityPresets: [10, 25, 50, 100, 200],
    defaultQuantity: 25,
    minQuantity: 5,
    gallery: [IMG.flyerPaper, IMG.magazines, IMG.flyerMockup],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А4 (210×297 мм)", multiplier: 1 },
          { label: "А5 (148×210 мм)", multiplier: 0.7 },
          { label: "А3 (297×420 мм)", multiplier: 1.8 },
          { label: "Евро (210×100 мм)", multiplier: 0.6 },
        ],
      },
      {
        key: "pages",
        label: "Количество страниц",
        values: [
          { label: "1 разворот (2 стороны)", multiplier: 1 },
          { label: "4 страницы",  multiplier: 1.6 },
          { label: "8 страниц",   multiplier: 2.4 },
          { label: "12 страниц",  multiplier: 3.2 },
        ],
      },
      {
        key: "lamination",
        label: "Ламинация",
        values: [
          { label: "Без ламинации",       multiplier: 1 },
          { label: "Глянцевая",           multiplier: 1.25 },
          { label: "Матовая",             multiplier: 1.35 },
          { label: "Soft-touch",          multiplier: 1.7 },
        ],
      },
      {
        key: "binding",
        label: "Скрепление",
        values: [
          { label: "Без скрепления",   multiplier: 1 },
          { label: "На скобу",         multiplier: 1.15 },
          { label: "На пружину",       multiplier: 1.4 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["блокноты"],
    title: "Блокноты",
    unit: "шт.",
    basePricePerUnit: 220,
    quantityPresets: [10, 25, 50, 100, 250, 500],
    defaultQuantity: 50,
    minQuantity: 10,
    gallery: [IMG.stickerPack, IMG.printDetail, IMG.magazines],
    options: [
      {
        key: "size",
        label: "Формат",
        variant: "select",
        values: [
          { label: "А6 (105×148 мм)", multiplier: 0.7 },
          { label: "А5 (148×210 мм)", multiplier: 1 },
          { label: "А4 (210×297 мм)", multiplier: 1.6 },
        ],
      },
      {
        key: "pages",
        label: "Количество листов",
        values: [
          { label: "32 листа",  multiplier: 0.85 },
          { label: "48 листов", multiplier: 1 },
          { label: "64 листа",  multiplier: 1.25 },
          { label: "96 листов", multiplier: 1.7 },
        ],
      },
      {
        key: "binding",
        label: "Тип переплёта",
        values: [
          { label: "На скобу",            multiplier: 1 },
          { label: "На пружину",          multiplier: 1.3 },
          { label: "Клеевой (КБС)",       multiplier: 1.5 },
          { label: "Твёрдый переплёт",    multiplier: 2.2 },
        ],
      },
      {
        key: "cover",
        label: "Обложка",
        values: [
          { label: "Мелованная 300 г/м²", multiplier: 1 },
          { label: "Soft-touch",           multiplier: 1.4 },
          { label: "Дизайнерская",         multiplier: 1.6 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },

  {
    slugs: ["оперативная-полиграфия", "наклейки", "магниты"],
    title: "Наклейки и магниты",
    unit: "шт.",
    basePricePerUnit: 22,
    quantityPresets: [50, 100, 200, 500, 1000],
    defaultQuantity: 100,
    minQuantity: 50,
    gallery: [IMG.stickers, IMG.stickerPack, IMG.stickerRound],
    options: [
      {
        key: "size",
        label: "Размер",
        variant: "select",
        values: [
          { label: "60×60 мм",   multiplier: 1 },
          { label: "80×80 мм",   multiplier: 1.3 },
          { label: "100×100 мм", multiplier: 1.6 },
          { label: "А6 (105×148)", multiplier: 1.9 },
        ],
      },
      {
        key: "color",
        label: "Цветность печати",
        values: [
          { label: "4+0 цветная", multiplier: 1 },
          { label: "1+0 ч/б",     multiplier: 0.55 },
        ],
      },
      {
        key: "material",
        label: "Материал",
        values: [
          { label: "Самоклеящаяся бумага 170 г/м²", multiplier: 1 },
          { label: "Виниловая плёнка матовая",      multiplier: 1.55 },
          { label: "Магнитный винил 0,4 мм",        multiplier: 2.4 },
          { label: "Магнитный винил 0,7 мм",        multiplier: 2.9 },
        ],
      },
      {
        key: "lamination",
        label: "Ламинация",
        values: [
          { label: "Без ламинации",    multiplier: 1 },
          { label: "Глянцевая 30 мкм", multiplier: 1.2 },
          { label: "Матовая 30 мкм",   multiplier: 1.3 },
        ],
      },
      {
        key: "varieties",
        label: "Количество видов макетов",
        variant: "select",
        values: [
          { label: "1 вид",     multiplier: 1 },
          { label: "2 вида",    multiplier: 1.08 },
          { label: "3 вида",    multiplier: 1.15 },
          { label: "5 видов",   multiplier: 1.25 },
          { label: "10 видов",  multiplier: 1.4 },
        ],
      },
    ],
    quantityTiers: DEFAULT_TIERS,
  },
];

export function getProductCalculator(slug: string): ProductCalc | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return PRODUCT_CALCULATORS.find((p) => p.slugs.includes(decoded));
}

export function getQuantityMultiplier(
  qty: number,
  tiers: QuantityTier[] = []
): number {
  if (!tiers.length) return 1;
  let m = tiers[0].multiplier;
  for (const t of tiers) {
    if (qty >= t.min) m = t.multiplier;
  }
  return m;
}
