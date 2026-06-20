"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import {
  Palette, Type, Download, ShoppingCart,
  RotateCcw, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight,
  CheckCircle, Layers, PenTool, ClipboardList,
} from "@/lib/icons";
import DesignBriefForm from "@/components/DesignBriefForm";
import { usePricing } from "@/components/calc/kit";
import { PRICING_DEFAULTS } from "@/lib/pricingDefaults";

interface Template {
  id: number; name: string; category: string;
  bg: string; accent: string; textColor: string;
}

interface ProductType {
  id: string; name: string; icon: string; group: string;
  w: number; h: number; basePrice: number; unit: string;
  fields: string[];
}

const STYLE_CATS = ["Все", "Бизнес", "Креативные", "Минимализм", "Яркие", "Тёмные"];

const TEMPLATES: Template[] = [
  { id: 1, name: "Классика", category: "Бизнес", bg: "#ffffff", accent: "#1a56db", textColor: "#1f2937" },
  { id: 2, name: "Корпоратив", category: "Бизнес", bg: "#f0f4ff", accent: "#2563eb", textColor: "#1e3a5f" },
  { id: 3, name: "Элегант", category: "Минимализм", bg: "#fafafa", accent: "#6b7280", textColor: "#111827" },
  { id: 4, name: "Минимал", category: "Минимализм", bg: "#ffffff", accent: "#000000", textColor: "#000000" },
  { id: 5, name: "Закат", category: "Яркие", bg: "linear-gradient(135deg,#ff6b35,#f7c948)", accent: "#ffffff", textColor: "#ffffff" },
  { id: 6, name: "Океан", category: "Яркие", bg: "linear-gradient(135deg,#667eea,#764ba2)", accent: "#ffffff", textColor: "#ffffff" },
  { id: 7, name: "Ночь", category: "Тёмные", bg: "#1a1a2e", accent: "#e94560", textColor: "#eaeaea" },
  { id: 8, name: "Уголь", category: "Тёмные", bg: "#2d2d2d", accent: "#f5a623", textColor: "#f0f0f0" },
  { id: 9, name: "Природа", category: "Креативные", bg: "linear-gradient(135deg,#a8e6cf,#dcedc1)", accent: "#2d5016", textColor: "#2d5016" },
  { id: 10, name: "Лаванда", category: "Креативные", bg: "linear-gradient(135deg,#e8d5f5,#f3e7fa)", accent: "#6b21a8", textColor: "#4c1d95" },
  { id: 11, name: "Огонь", category: "Яркие", bg: "linear-gradient(135deg,#f12711,#f5af19)", accent: "#ffffff", textColor: "#ffffff" },
  { id: 12, name: "Сталь", category: "Бизнес", bg: "linear-gradient(135deg,#bdc3c7,#2c3e50)", accent: "#ecf0f1", textColor: "#ecf0f1" },
  { id: 13, name: "Изумруд", category: "Яркие", bg: "linear-gradient(135deg,#11998e,#38ef7d)", accent: "#ffffff", textColor: "#ffffff" },
  { id: 14, name: "Графит", category: "Минимализм", bg: "#f4f4f5", accent: "#18181b", textColor: "#27272a" },
  { id: 15, name: "Мрамор", category: "Минимализм", bg: "#f8f7f4", accent: "#a07e5d", textColor: "#3f3a34" },
  { id: 16, name: "Неон", category: "Тёмные", bg: "#0f0f1a", accent: "#00f5d4", textColor: "#f0f0f0" },
  { id: 17, name: "Винтаж", category: "Креативные", bg: "#f3e9d2", accent: "#9c4722", textColor: "#5a3e2b" },
  { id: 18, name: "Сапфир", category: "Бизнес", bg: "linear-gradient(135deg,#0f2027,#2c5364)", accent: "#56ccf2", textColor: "#eaf6ff" },
  { id: 19, name: "Роза", category: "Креативные", bg: "linear-gradient(135deg,#ee9ca7,#ffdde1)", accent: "#b03052", textColor: "#7a2540" },
  { id: 20, name: "Контраст", category: "Тёмные", bg: "#000000", accent: "#facc15", textColor: "#ffffff" },
];

const FONTS = ["Inter", "Georgia", "Times New Roman", "Courier New", "Arial Black", "Impact", "Verdana", "Tahoma", "Trebuchet MS", "Palatino Linotype"];

const PRODUCT_GROUPS = [
  "Визитки", "Полиграфия", "Фото", "Награды",
];

const PRODUCTS: ProductType[] = [

  { id: "vizitka-h", name: "Визитка горизонтальная", icon: "💳", group: "Визитки", w: 90, h: 50, basePrice: 3, unit: "шт.", fields: ["company","person","position","phone","email","website","address"] },
  { id: "vizitka-v", name: "Визитка вертикальная", icon: "📇", group: "Визитки", w: 50, h: 90, basePrice: 3, unit: "шт.", fields: ["company","person","position","phone","email","website","address"] },

  { id: "flyer-a5", name: "Флаер A5", icon: "📃", group: "Полиграфия", w: 148, h: 210, basePrice: 5, unit: "шт.", fields: ["headline","subline","body","cta","phone","website"] },
  { id: "flyer-a6", name: "Флаер A6", icon: "📄", group: "Полиграфия", w: 105, h: 148, basePrice: 4, unit: "шт.", fields: ["headline","subline","body","cta","phone","website"] },
  { id: "listovka", name: "Листовка A4", icon: "📋", group: "Полиграфия", w: 210, h: 297, basePrice: 8, unit: "шт.", fields: ["headline","subline","body","cta","phone","website","address"] },
  { id: "buklet", name: "Буклет евро", icon: "📑", group: "Полиграфия", w: 210, h: 99, basePrice: 15, unit: "шт.", fields: ["headline","subline","body","cta","company","phone"] },
  { id: "plakat-a3", name: "Плакат A3", icon: "🖼️", group: "Полиграфия", w: 297, h: 420, basePrice: 45, unit: "шт.", fields: ["headline","subline","body","company"] },
  { id: "calendar", name: "Календарь карманный", icon: "📅", group: "Полиграфия", w: 70, h: 100, basePrice: 5, unit: "шт.", fields: ["headline","company","phone","year"] },
  { id: "nakleika", name: "Наклейка круглая", icon: "🏷️", group: "Полиграфия", w: 50, h: 50, basePrice: 3, unit: "шт.", fields: ["headline","subline"] },
  { id: "konvert", name: "Конверт C4", icon: "✉️", group: "Полиграфия", w: 229, h: 162, basePrice: 12, unit: "шт.", fields: ["company","address","phone","website"] },

  { id: "foto-10x15", name: "Фото 10×15", icon: "📸", group: "Фото", w: 150, h: 100, basePrice: 22, unit: "шт.", fields: ["headline"] },

  { id: "gramota", name: "Грамота", icon: "📜", group: "Награды", w: 210, h: 297, basePrice: 55, unit: "шт.", fields: ["headline","subline","body","person"] },
];

const FIELD_LABELS: Record<string, string> = {
  company: "Название компании", person: "Имя", position: "Должность",
  phone: "Телефон", email: "Email", website: "Сайт", address: "Адрес",
  headline: "Заголовок", subline: "Подзаголовок", body: "Основной текст",
  cta: "Кнопка / призыв", year: "Год",
};

const FIELD_DEFAULTS: Record<string, string> = {
  company: "Format7", person: "Иван Иванов", position: "Менеджер",
  phone: "+7 932 475-95-11", email: "Format7-tmn@yandex.ru",
  website: "формат7.рф", address: "г. Тюмень",
  headline: "Заголовок", subline: "Подзаголовок",
  body: "Текст описания здесь", cta: "Заказать", year: "2026",
};

export default function DesignerPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [groupFilter, setGroupFilter] = useState("Визитки");
  const [productId, setProductId] = useState("vizitka-h");
  const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];
  const groupProducts = PRODUCTS.filter((p) => p.group === groupFilter);

  const pricing = usePricing("designer", PRICING_DEFAULTS["designer"].data);
  const baseOf = (p: ProductType) => Number((pricing.products as any)?.[p.name] ?? p.basePrice);
  const productBase = baseOf(product);

  const [catFilter, setCatFilter] = useState("Все");
  const [templateId, setTemplateId] = useState(1);
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

  const [fields, setFields] = useState<Record<string, string>>({ ...FIELD_DEFAULTS });
  const setField = (key: string, val: string) => setFields((prev) => ({ ...prev, [key]: val }));
  const f = (key: string) => fields[key] || "";

  const [fontFamily, setFontFamily] = useState("Inter");
  const [bgOverride, setBgOverride] = useState("");
  const [accentOverride, setAccentOverride] = useState("");
  const [zoom, setZoom] = useState(1);
  const [side, setSide] = useState<"front" | "back">("front");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [tab, setTab] = useState<"product" | "templates" | "text" | "style">("product");
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  const handleLogo = (file?: File) => {
    if (!file) { setLogo(null); return; }
    const img = new Image();
    img.onload = () => setLogo(img);
    img.src = URL.createObjectURL(file);
  };

  const [quantity, setQuantity] = useState(100);
  const [sending, setSending] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [mode, setMode] = useState<"brief" | "constructor">("brief");

  const bg = bgOverride || template.bg;
  const accent = accentOverride || template.accent;
  const txtColor = template.textColor;
  const filtered = catFilter === "Все" ? TEMPLATES : TEMPLATES.filter((t) => t.category === catFilter);
  const totalPrice = productBase * quantity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 4;
    const aspect = product.w / product.h;
    const cw = 400;
    const ch = Math.round(cw / aspect);
    canvas.width = cw * scale;
    canvas.height = ch * scale;
    canvas.style.width = `${cw * zoom}px`;
    canvas.style.height = `${ch * zoom}px`;
    ctx.scale(scale, scale);

    if (bg.startsWith("linear-gradient")) {
      const colors = bg.match(/#[a-fA-F0-9]{6}/g) || ["#ffffff", "#ffffff"];
      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1] || colors[0]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, cw, ch);

    const isRound = product.id === "nakleika" || product.id === "znachok" || product.id === "brelok";
    if (isRound) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      if (bg.startsWith("linear-gradient")) {
        const colors = bg.match(/#[a-fA-F0-9]{6}/g) || ["#ffffff"];
        const grad = ctx.createLinearGradient(0, 0, cw, ch);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1] || colors[0]);
        ctx.fillStyle = grad;
      } else { ctx.fillStyle = bg; }
      ctx.fillRect(0, 0, cw, ch);
    }

    const isTextile = product.group === "Текстиль";
    if (isTextile && side === "front") {
      ctx.strokeStyle = accent + "33";
      ctx.lineWidth = 1;
      ctx.strokeRect(cw * 0.2, ch * 0.15, cw * 0.6, ch * 0.7);
      ctx.fillStyle = txtColor + "15";
      ctx.fillRect(cw * 0.2, ch * 0.15, cw * 0.6, ch * 0.7);
    }

    ctx.textAlign = textAlign as CanvasTextAlign;
    const anchorX = textAlign === "left" ? 28 : textAlign === "right" ? cw - 28 : cw / 2;

    if (side === "back") {

      ctx.fillStyle = accent;
      ctx.font = `bold ${Math.min(36, cw * 0.09)}px ${fontFamily}, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(f("company") || f("headline"), cw / 2, ch / 2 - 10);
      ctx.font = `${Math.min(14, cw * 0.035)}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = txtColor + "88";
      ctx.fillText(f("website") || f("subline") || f("phone"), cw / 2, ch / 2 + 20);
      if (logo) {
        const ratio = (logo.width || 1) / (logo.height || 1);
        let lw = cw * 0.3, lh = lw / ratio;
        const maxH = ch * 0.35;
        if (lh > maxH) { lh = maxH; lw = lh * ratio; }
        ctx.drawImage(logo, (cw - lw) / 2, ch * 0.12, lw, lh);
      }
      if (isRound) ctx.restore();
      return;
    }

    const g = product.group;
    const padX = 28;
    const padY = 24;

    if (!isRound && !isTextile) {
      ctx.fillStyle = accent;
      if (product.w >= product.h) {
        ctx.fillRect(0, 0, 6, ch);
      } else {
        ctx.fillRect(0, 0, cw, 6);
      }
    }

    if (g === "Визитки") {
      ctx.fillStyle = accent;
      ctx.font = `bold ${product.w >= product.h ? 22 : 18}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("company"), anchorX, padY + 22);
      ctx.fillStyle = txtColor;
      ctx.font = `bold ${product.w >= product.h ? 16 : 13}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("person"), anchorX, padY + 50);
      ctx.font = `${product.w >= product.h ? 12 : 10}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = txtColor + "aa";
      ctx.fillText(f("position"), anchorX, padY + 66);
      const contactY = product.w >= product.h ? ch - padY - 40 : padY + 100;
      ctx.font = `${product.w >= product.h ? 11 : 9}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = txtColor;
      [f("phone"), f("email"), f("website"), f("address")].filter(Boolean).forEach((line, i) => {
        ctx.fillText(line, anchorX, contactY + i * 15);
      });
    } else if (g === "Полиграфия") {

      ctx.fillStyle = accent;
      const hSize = Math.min(28, cw * 0.07);
      ctx.font = `bold ${hSize}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("headline"), anchorX, padY + hSize);

      ctx.fillStyle = txtColor;
      ctx.font = `${Math.min(16, cw * 0.04)}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("subline"), anchorX, padY + hSize + 26);

      ctx.font = `${Math.min(12, cw * 0.03)}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = txtColor + "cc";
      const bodyLines = (f("body") || "").match(/.{1,40}/g) || [];
      bodyLines.slice(0, 6).forEach((line, i) => {
        ctx.fillText(line, anchorX, padY + hSize + 52 + i * 16);
      });

      if (f("cta")) {
        const ctaY = ch - padY - 50;
        ctx.fillStyle = accent;
        const ctaW = ctx.measureText(f("cta")).width + 30;
        const ctaX = textAlign === "left" ? padX : textAlign === "right" ? cw - padX - ctaW : (cw - ctaW) / 2;
        ctx.beginPath();
        ctx.roundRect(ctaX, ctaY, ctaW, 28, 6);
        ctx.fill();
        ctx.fillStyle = bg.startsWith("#") ? bg : "#ffffff";
        ctx.font = `bold 12px ${fontFamily}, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(f("cta"), ctaX + ctaW / 2, ctaY + 18);
        ctx.textAlign = textAlign as CanvasTextAlign;
      }

      ctx.font = `${Math.min(10, cw * 0.025)}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = txtColor + "88";
      [f("phone"), f("website"), f("address")].filter(Boolean).forEach((line, i) => {
        ctx.fillText(line, anchorX, ch - padY - 5 + i * 13);
      });
    } else if (g === "Сувениры" || g === "Фото") {
      ctx.textAlign = "center";
      ctx.fillStyle = accent;
      ctx.font = `bold ${Math.min(24, cw * 0.06)}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("headline"), cw / 2, ch * 0.4);
      if (f("subline")) {
        ctx.fillStyle = txtColor;
        ctx.font = `${Math.min(14, cw * 0.035)}px ${fontFamily}, sans-serif`;
        ctx.fillText(f("subline"), cw / 2, ch * 0.4 + 26);
      }
      if (f("body")) {
        ctx.fillStyle = txtColor + "aa";
        ctx.font = `${Math.min(11, cw * 0.028)}px ${fontFamily}, sans-serif`;
        ctx.fillText(f("body"), cw / 2, ch * 0.4 + 48);
      }
    } else if (g === "Текстиль") {
      ctx.textAlign = "center";
      ctx.fillStyle = accent;
      ctx.font = `bold ${Math.min(30, cw * 0.075)}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("headline"), cw / 2, ch * 0.45);
      if (f("subline")) {
        ctx.fillStyle = txtColor;
        ctx.font = `${Math.min(16, cw * 0.04)}px ${fontFamily}, sans-serif`;
        ctx.fillText(f("subline"), cw / 2, ch * 0.45 + 30);
      }
    } else if (g === "Награды") {
      ctx.textAlign = "center";

      ctx.strokeStyle = accent + "44";
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, cw - 32, ch - 32);
      ctx.strokeStyle = accent + "22";
      ctx.lineWidth = 1;
      ctx.strokeRect(22, 22, cw - 44, ch - 44);

      ctx.fillStyle = accent;
      ctx.font = `bold ${Math.min(22, cw * 0.055)}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("headline"), cw / 2, padY + 50);

      ctx.fillStyle = txtColor;
      ctx.font = `${Math.min(14, cw * 0.035)}px ${fontFamily}, sans-serif`;
      ctx.fillText(f("subline"), cw / 2, padY + 76);

      if (f("person")) {
        ctx.fillStyle = accent;
        ctx.font = `bold ${Math.min(20, cw * 0.05)}px ${fontFamily}, sans-serif`;
        ctx.fillText(f("person"), cw / 2, ch / 2 + 10);
      }

      if (f("body")) {
        ctx.fillStyle = txtColor + "cc";
        ctx.font = `${Math.min(11, cw * 0.028)}px ${fontFamily}, sans-serif`;
        const bLines = (f("body")).match(/.{1,45}/g) || [];
        bLines.slice(0, 4).forEach((line, i) => {
          ctx.fillText(line, cw / 2, ch / 2 + 45 + i * 16);
        });
      }
    }

    if (logo) {
      const ratio = (logo.width || 1) / (logo.height || 1);
      let lw = cw * 0.24, lh = lw / ratio;
      const maxH = ch * 0.3;
      if (lh > maxH) { lh = maxH; lw = lh * ratio; }
      ctx.drawImage(logo, cw - lw - 14, 14, lw, lh);
    }

    if (isRound) ctx.restore();
  }, [fields, fontFamily, bg, accent, txtColor, zoom, side, textAlign, product, templateId, logo]);

  const handleOrder = async () => {
    const cName = user?.name || f("person") || f("headline");
    const cEmail = user?.email || f("email") || "Format7-tmn@yandex.ru";
    if (!cName) { router.push("/login"); return; }

    setSending(true);
    try {

      const fileIds: number[] = [];
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
          if (blob) {
            const designFile = new File([blob], `${product.id}-${template.name}.png`, { type: "image/png" });
            const up = await api.uploadFile(designFile, token || undefined);
            fileIds.push(up.id);
          }
        } catch (e) { console.error("design upload failed", e); }
      }

      const optionsObj: Record<string, string> = {
        Продукт: product.name,
        Шаблон: template.name,
        Шрифт: fontFamily,
        ...Object.fromEntries(product.fields.map((key) => [FIELD_LABELS[key] || key, f(key)])),
      };
      const designInfo = [
        `${product.icon} ${product.name}`,
        `Дизайн: ${template.name}`,
        `Тираж: ${quantity} ${product.unit}`,
      ].join(" | ");

      const order = await api.createOrder({
        customer_name: cName,
        customer_email: cEmail,
        customer_phone: f("phone"),
        comment: designInfo,
        items: [{ service_id: 1, quantity, price: productBase, options: optionsObj }],
        file_ids: fileIds,
      }, token || undefined);
      setOrderNumber(order.order_number);
    } catch (err: any) {
      toast.error(err.message || "Ошибка оформления");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${product.id}-${template.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (orderNumber) {
    return (
      <div className="bg-white min-h-[60vh] py-16 sm:py-24">
        <div className="container-page max-w-xl mx-auto text-center">
          <CheckCircle className="mx-auto mb-6 text-emerald-600" size={40} strokeWidth={2} />
          <p className="eyebrow mb-4">Готово</p>
          <h1 className="h-display mb-4">Заказ оформлен.</h1>
          <p className="text-ink-500 mb-2">Номер заказа:</p>
          <p className="font-heading text-3xl font-semibold text-ink-900 tabular mb-4">{orderNumber}</p>
          <p className="text-ink-500 mb-8">Наш дизайнер проверит макет и свяжется с вами.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setOrderNumber(null)} className="btn-primary">Новый дизайн</button>
            <Link href="/order-status" className="btn">Проверить статус</Link>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "brief") {
    return <DesignBriefForm />;
  }

  return (
    <div className="bg-white">
      <div className="border-b border-ink-200">
        <div className="container-page py-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-heading text-base font-semibold text-ink-900">Конструктор</h1>
            <span className="text-[12px] text-ink-400">{product.name}</span>
          </div>
          <button onClick={() => setMode("brief")} className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-ink-200 text-[12px] font-medium text-ink-700 hover:border-ink-300 transition-colors">
            <ClipboardList size={14} /> Бриф на дизайн
          </button>
        </div>
      </div>

      <div className="container-page py-4 grid lg:grid-cols-[260px_1fr_240px] gap-4">

        <div className="border border-ink-200 rounded-md overflow-hidden self-start">
          <div className="flex border-b border-ink-200">
            {([
              ["product", Layers, "Продукт"],
              ["templates", Palette, "Стиль"],
              ["text", Type, "Текст"],
              ["style", PenTool, "Цвета"],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  tab === key ? "text-ink-900 border-b-2 border-ink-900 bg-ink-50" : "text-ink-400 hover:text-ink-700"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3 max-h-[60vh] overflow-y-auto">

            {tab === "product" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {PRODUCT_GROUPS.map((g) => (
                    <button
                      key={g}
                      onClick={() => { setGroupFilter(g); const first = PRODUCTS.find((p) => p.group === g); if (first) setProductId(first.id); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        groupFilter === g ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <ul className="divide-y divide-ink-200 border border-ink-200 rounded-md overflow-hidden">
                  {groupProducts.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setProductId(p.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                          productId === p.id ? "bg-ink-50" : "hover:bg-ink-50"
                        }`}
                      >
                        <span className="grid place-items-center w-7 h-7 rounded-md bg-ink-100 text-ink-700 font-heading text-xs font-semibold shrink-0">{p.name.charAt(0)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-ink-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-ink-400 tabular">{p.w}×{p.h} мм · от {baseOf(p)}&nbsp;₽/{p.unit}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "templates" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {STYLE_CATS.map((c) => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${catFilter === c ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"}`}
                    >{c}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((t) => (
                    <button key={t.id} onClick={() => { setTemplateId(t.id); setBgOverride(""); setAccentOverride(""); }}
                      className={`rounded-md border overflow-hidden transition-colors ${templateId === t.id ? "border-ink-900" : "border-ink-200 hover:border-ink-400"}`}
                    >
                      <div className="h-14 flex items-center justify-center" style={{ background: t.bg }}>
                        <span style={{ color: t.accent, fontWeight: 700, fontSize: 10 }}>Aa</span>
                      </div>
                      <p className="text-[10px] font-medium text-ink-700 py-1 bg-white">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "text" && (
              <div className="space-y-2.5">
                <p className="text-[10px] text-ink-400 mb-1">{product.name}</p>
                {product.fields.map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] font-medium text-ink-500 mb-0.5">{FIELD_LABELS[key] || key}</label>
                    {key === "body" ? (
                      <textarea rows={3} value={f(key)} onChange={(e) => setField(key, e.target.value)}
                        className="w-full border border-ink-200 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-ink-500 transition-colors resize-none"
                      />
                    ) : (
                      <input type="text" value={f(key)} onChange={(e) => setField(key, e.target.value)}
                        className="w-full border border-ink-200 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-ink-500 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "style" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Логотип</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer text-[10px] font-medium text-ink-700 border border-dashed border-ink-300 rounded-md px-2.5 py-2 hover:border-ink-500 transition-colors text-center">
                      {logo ? "Заменить логотип" : "Загрузить PNG / JPG"}
                      <input type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => handleLogo(e.target.files?.[0])} />
                    </label>
                    {logo && (
                      <button onClick={() => setLogo(null)} className="text-[10px] font-medium text-ink-500 hover:text-red-600 transition-colors shrink-0">Убрать</button>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-ink-400">Прозрачный PNG — лучше всего. На лицевой — в углу, на оборотной — по центру.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Шрифт</label>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full border border-ink-200 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-ink-500 transition-colors">
                    {FONTS.map((ff) => <option key={ff} value={ff} style={{ fontFamily: ff }}>{ff}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Выравнивание</label>
                  <div className="flex gap-1">
                    {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                      <button key={a} onClick={() => setTextAlign(a)}
                        className={`p-2 rounded-md transition-colors ${textAlign === a ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:text-ink-900"}`}>
                        <Icon size={14} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Цвет фона</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgOverride || (bg.startsWith("#") ? bg : "#ffffff")} onChange={(e) => setBgOverride(e.target.value)} className="w-8 h-8 rounded border border-ink-200 cursor-pointer" />
                    <button onClick={() => setBgOverride("")} className="text-[10px] font-medium text-ink-500 hover:text-ink-900 transition-colors">Сбросить</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Акцентный цвет</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={accentOverride || accent} onChange={(e) => setAccentOverride(e.target.value)} className="w-8 h-8 rounded border border-ink-200 cursor-pointer" />
                    <button onClick={() => setAccentOverride("")} className="text-[10px] font-medium text-ink-500 hover:text-ink-900 transition-colors">Сбросить</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-500 mb-1">Быстрые цвета</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["#1a56db","#e94560","#10b981","#f59e0b","#8b5cf6","#ec4899","#000000","#6b7280"].map((c) => (
                      <button key={c} onClick={() => setAccentOverride(c)} className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 border border-ink-200 rounded-md px-3 py-1.5">
            <button onClick={() => setSide("front")} className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${side === "front" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"}`}>Лицевая</button>
            <button onClick={() => setSide("back")} className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${side === "back" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"}`}>Оборотная</button>
            <div className="w-px h-5 bg-ink-200 mx-1" />
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="p-1 text-ink-400 hover:text-ink-900 transition-colors"><ZoomOut size={15} strokeWidth={2} /></button>
            <span className="text-[10px] text-ink-400 w-10 text-center tabular">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="p-1 text-ink-400 hover:text-ink-900 transition-colors"><ZoomIn size={15} strokeWidth={2} /></button>
            <div className="w-px h-5 bg-ink-200 mx-1" />
            <button onClick={() => { setBgOverride(""); setAccentOverride(""); setZoom(1); }} className="p-1 text-ink-400 hover:text-ink-900 transition-colors" title="Сбросить"><RotateCcw size={14} strokeWidth={2} /></button>
          </div>
          <div className="bg-ink-100 rounded-md p-6 flex items-center justify-center min-h-[300px] w-full border border-ink-200">
            <div className="shadow-lg rounded-md overflow-hidden" style={{ lineHeight: 0 }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
          <p className="text-[10px] text-ink-400 mt-2 tabular">{product.name} · {product.w}×{product.h} мм · {side === "front" ? "лицевая" : "оборотная"}</p>
        </div>

        <div className="space-y-3 self-start">
          <div className="border border-ink-200 rounded-md p-4 space-y-4">
            <h3 className="eyebrow">Заказать печать</h3>
            <div className="space-y-2">
              <label className="block text-[10px] font-medium text-ink-500">Тираж ({product.unit})</label>
              <div className="flex flex-wrap gap-1.5">
                {[10, 50, 100, 200, 500, 1000].map((v) => (
                  <button key={v} onClick={() => setQuantity(v)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium tabular transition-colors ${quantity === v ? "bg-ink-900 text-white" : "border border-ink-200 text-ink-600 hover:border-ink-400"}`}
                  >{v}</button>
                ))}
              </div>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-ink-200 rounded-md px-2.5 py-1.5 text-xs tabular outline-none focus:border-ink-500 transition-colors" />
            </div>
            <div className="border-t border-ink-200 pt-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-ink-500"><span>Продукт</span><span className="font-medium text-ink-900 text-right truncate max-w-[120px]">{product.name}</span></div>
              <div className="flex justify-between text-ink-500"><span>Шаблон</span><span className="font-medium text-ink-900">{template.name}</span></div>
              <div className="flex justify-between text-ink-500"><span>Тираж</span><span className="font-medium text-ink-900 tabular">{quantity} {product.unit}</span></div>
              <div className="flex justify-between text-ink-500"><span>Цена/{product.unit}</span><span className="font-medium text-ink-900 tabular">от {productBase}&nbsp;₽</span></div>
            </div>
            <div className="border-t border-ink-200 pt-3">
              <p className="eyebrow mb-1">Итого от</p>
              <p className="font-heading text-2xl font-semibold text-ink-900 tabular">{totalPrice.toLocaleString("ru-RU")}&nbsp;₽</p>
            </div>
            <button onClick={handleOrder} disabled={sending}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              <ShoppingCart size={14} strokeWidth={2} />
              {sending ? "Оформляем…" : "Заказать печать"}
            </button>
            {!user && (
              <p className="text-[10px] text-ink-400 text-center">
                <Link href="/login" className="font-medium text-ink-700 hover:text-brand transition-colors">Войдите</Link> для быстрого оформления
              </p>
            )}
          </div>
          <button onClick={handleDownload}
            className="btn w-full">
            <Download size={14} strokeWidth={2} /> Скачать макет PNG
          </button>
          <div className="border border-ink-200 rounded-md p-3 text-[10px] text-ink-400 space-y-1.5">
            <p>Макет проверит дизайнер.</p>
            <p>Готовность: 1–3 рабочих дня.</p>
            <p>Срочно — наценка 50%.</p>
            <p>Самовывоз или доставка.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
