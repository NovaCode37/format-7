"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Office } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import CopyPrintCalculator from "@/components/CopyPrintCalculator";
import {
  Calculator, ShoppingCart, CheckCircle, Upload, MapPin,
  Truck, ChevronRight, ChevronLeft, FileText, Trash2, Info, Star,
} from "@/lib/icons";

interface PriceOption {
  label: string;
  values: { label: string; multiplier: number }[];
}

interface ServiceConfig {
  name: string;
  icon: string;
  basePrice: number;
  unit: string;

  slugs?: string[];
  options: PriceOption[];
}

const SERVICES: ServiceConfig[] = [
  {
    name: "Копирование и печать",
    icon: "📄",
    basePrice: 5,
    unit: "стр.",
    slugs: ["копирование-и-печать-документов"],
    options: [
      { label: "Формат",      values: [{ label: "A4", multiplier: 1 }, { label: "A3", multiplier: 2 }, { label: "A2", multiplier: 5 }, { label: "A1", multiplier: 10 }] },
      { label: "Цветность",   values: [{ label: "Ч/б", multiplier: 1 }, { label: "Цветная", multiplier: 3 }] },
      { label: "Сторонность", values: [{ label: "Односторонняя", multiplier: 1 }, { label: "Двусторонняя", multiplier: 1.7 }] },
    ],
  },
  {
    name: "Визитки",
    icon: "💳",
    basePrice: 3,
    unit: "шт.",
    slugs: ["визитки"],
    options: [
      { label: "Тип бумаги", values: [{ label: "Мелованная 300г", multiplier: 1 }, { label: "Дизайнерская", multiplier: 2.5 }, { label: "Картон 350г", multiplier: 1.5 }, { label: "Текстурная", multiplier: 3 }] },
      { label: "Цветность",  values: [{ label: "4+0 (одна сторона)", multiplier: 1 }, { label: "4+4 (две стороны)", multiplier: 1.6 }] },
      { label: "Ламинация",  values: [{ label: "Без ламинации", multiplier: 1 }, { label: "Глянцевая", multiplier: 1.4 }, { label: "Матовая", multiplier: 1.5 }, { label: "Soft-touch", multiplier: 2 }] },
    ],
  },
  {
    name: "Листовки и флаеры",
    icon: "📃",
    basePrice: 4,
    unit: "шт.",
    slugs: ["листовки", "флаеры"],
    options: [
      { label: "Формат",    values: [{ label: "A6 (105×148 мм)", multiplier: 0.5 }, { label: "A5 (148×210 мм)", multiplier: 1 }, { label: "A4 (210×297 мм)", multiplier: 1.8 }, { label: "Евро (100×210 мм)", multiplier: 0.8 }] },
      { label: "Бумага",    values: [{ label: "Мелованная 130г", multiplier: 1 }, { label: "Мелованная 170г", multiplier: 1.3 }, { label: "Мелованная 300г", multiplier: 1.8 }] },
      { label: "Цветность", values: [{ label: "4+0 (одна сторона)", multiplier: 1 }, { label: "4+4 (две стороны)", multiplier: 1.7 }] },
    ],
  },
  {
    name: "Буклеты",
    icon: "📑",
    basePrice: 15,
    unit: "шт.",
    slugs: ["буклеты"],
    options: [
      { label: "Формат", values: [{ label: "А4 → 3 сгиба (евробуклет)", multiplier: 1 }, { label: "А3 → 2 сгиба", multiplier: 2 }] },
      { label: "Бумага", values: [{ label: "Мелованная 130г", multiplier: 1 }, { label: "Мелованная 170г", multiplier: 1.3 }] },
    ],
  },
  {
    name: "Открытки",
    icon: "🖼️",
    basePrice: 30,
    unit: "шт.",
    slugs: ["открытки"],
    options: [
      { label: "Формат",    values: [{ label: "Евро (98×210)", multiplier: 1 }, { label: "А6", multiplier: 0.85 }, { label: "А5", multiplier: 1.4 }] },
      { label: "Цветность", values: [{ label: "4+0", multiplier: 1 }, { label: "4+4", multiplier: 1.4 }] },
    ],
  },
  {
    name: "Календари",
    icon: "📅",
    basePrice: 90,
    unit: "шт.",
    slugs: ["календари"],
    options: [
      { label: "Тип", values: [{ label: "Карманный", multiplier: 0.25 }, { label: "Настенный А4", multiplier: 1 }, { label: "Настенный А3", multiplier: 1.6 }, { label: "Перекидной А3", multiplier: 4.5 }] },
    ],
  },
  {
    name: "Наклейки и стикеры",
    icon: "🏷️",
    basePrice: 10,
    unit: "шт.",
    slugs: ["наклейки"],
    options: [
      { label: "Размер",   values: [{ label: "60×60", multiplier: 1 }, { label: "100×100", multiplier: 1.6 }] },
      { label: "Материал", values: [{ label: "Бумага", multiplier: 1 }, { label: "Винил", multiplier: 1.55 }, { label: "Магнитный", multiplier: 2.4 }] },
    ],
  },
  {
    name: "Меню для кафе",
    icon: "🍽️",
    basePrice: 80,
    unit: "шт.",
    slugs: ["меню-для-кафе"],
    options: [
      { label: "Формат",    values: [{ label: "А4", multiplier: 1 }, { label: "А5", multiplier: 0.7 }, { label: "А3", multiplier: 1.8 }] },
      { label: "Ламинация", values: [{ label: "Без", multiplier: 1 }, { label: "Глянец", multiplier: 1.25 }, { label: "Soft-touch", multiplier: 1.7 }] },
    ],
  },
  {
    name: "Блокноты",
    icon: "📓",
    basePrice: 200,
    unit: "шт.",
    slugs: ["блокноты"],
    options: [
      { label: "Формат",  values: [{ label: "А6", multiplier: 0.7 }, { label: "А5", multiplier: 1 }, { label: "А4", multiplier: 1.6 }] },
      { label: "Переплёт", values: [{ label: "Скоба", multiplier: 1 }, { label: "Пружина", multiplier: 1.3 }, { label: "Твёрдый", multiplier: 2.2 }] },
    ],
  },
  {
    name: "Сканирование",
    icon: "📋",
    basePrice: 10,
    unit: "стр.",
    slugs: ["сканирование-документов"],
    options: [
      { label: "Формат",      values: [{ label: "А4", multiplier: 1 }, { label: "А3", multiplier: 1.8 }] },
      { label: "Разрешение",  values: [{ label: "300 dpi", multiplier: 1 }, { label: "600 dpi", multiplier: 1.4 }, { label: "1200 dpi", multiplier: 2.2 }] },
    ],
  },
  {
    name: "Ламинирование",
    icon: "🔖",
    basePrice: 30,
    unit: "шт.",
    slugs: ["ламинирование"],
    options: [
      { label: "Формат",  values: [{ label: "A4", multiplier: 1 }, { label: "A3", multiplier: 2 }, { label: "A5", multiplier: 0.6 }] },
      { label: "Толщина", values: [{ label: "80 мкм", multiplier: 1 }, { label: "125 мкм", multiplier: 1.3 }, { label: "175 мкм", multiplier: 1.6 }, { label: "250 мкм", multiplier: 2 }] },
    ],
  },
  {
    name: "Переплёт и брошюровка",
    icon: "📚",
    basePrice: 80,
    unit: "шт.",
    slugs: ["переплёт-и-брошюровка"],
    options: [
      { label: "Тип переплёта", values: [{ label: "Пластик. пружина", multiplier: 1 }, { label: "Метал. пружина", multiplier: 1.5 }, { label: "Клеевой (КБС)", multiplier: 2 }, { label: "Твёрдый", multiplier: 4 }] },
    ],
  },
];

const STEPS = ["Услуга", "Параметры", "Файлы", "Получение", "Оформление"];

export default function CalculatorPage() {
  return <CopyPrintCalculator />;

  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [choices, setChoices] = useState<number[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [comment, setComment] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const svc = SERVICES[selectedIdx];

  useEffect(() => {
    const want = searchParams.get("service");
    if (!want) return;
    const decoded = decodeURIComponent(want).toLowerCase();
    const idx = SERVICES.findIndex((s) => s.slugs?.includes(decoded));
    if (idx >= 0) {
      setSelectedIdx(idx);
      setChoices([]);
      setStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    api.getOffices().then(setOffices).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setCName(user.name);
      setCEmail(user.email);
      setCPhone(user.phone || "");
    }
  }, [user]);

  const handleServiceChange = (idx: number) => {
    setSelectedIdx(idx);
    setChoices([]);
  };

  const getChoice = (optIdx: number) => choices[optIdx] ?? 0;
  const setChoice = (optIdx: number, valIdx: number) => {
    const next = [...choices];
    next[optIdx] = valIdx;
    setChoices(next);
  };

  const totalPrice = useMemo(() => {
    let price = svc.basePrice;
    svc.options.forEach((opt, i) => {
      price *= opt.values[getChoice(i)].multiplier;
    });
    return Math.round(price * quantity * 100) / 100;
  }, [svc, choices, quantity]);

  const unitPrice = useMemo(() => {
    if (quantity <= 0) return 0;
    return Math.round((totalPrice / quantity) * 100) / 100;
  }, [totalPrice, quantity]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " Б";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
    return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return quantity > 0;
    if (step === 2) return true;
    if (step === 3) return deliveryType === "delivery" ? deliveryAddress.trim().length > 0 : true;
    if (step === 4) return cName.trim() && cEmail.trim() && agreeTerms;
    return false;
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      const fileIds: number[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadingIdx(i);
        try {
          const up = await api.uploadFile(files[i], token || undefined);
          fileIds.push(up.id);
        } catch (e: any) {
          console.error("upload failed", e);
        }
      }
      setUploadingIdx(null);

      const optionsObj: Record<string, string> = {};
      svc.options.forEach((opt, i) => {
        optionsObj[opt.label] = opt.values[getChoice(i)].label;
      });

      const optionsSummary = svc.options
        .map((opt, i) => `${opt.label}: ${opt.values[getChoice(i)].label}`)
        .join("; ");
      const fullComment = [
        `${svc.icon} ${svc.name}`,
        `${quantity} ${svc.unit}`,
        optionsSummary,
        comment,
      ].filter(Boolean).join(" | ");

      const order = await api.createOrder(
        {
          customer_name: cName,
          customer_email: cEmail,
          customer_phone: cPhone,
          comment: fullComment,
          items: [{ service_id: 1, quantity, price: unitPrice, options: optionsObj }],
          delivery_type: deliveryType,
          delivery_address: deliveryType === "delivery" ? deliveryAddress : "",
          office_id: deliveryType === "pickup" ? offices[selectedOffice]?.id ?? null : null,
          file_ids: fileIds,
        },
        token || undefined
      );
      setResult(order.order_number);
    } catch (err: any) {
      toast.error(err.message || "Ошибка оформления заказа");
    } finally {
      setSending(false);
      setUploadingIdx(null);
    }
  };

  if (result) {
    return (
      <div className="bg-white min-h-[60vh] py-16 sm:py-24">
        <div className="container-page max-w-xl mx-auto text-center">
          <CheckCircle className="mx-auto mb-6 text-emerald-600" size={40} strokeWidth={2} />
          <p className="eyebrow mb-4">Готово</p>
          <h1 className="h-display mb-4">Заказ оформлен.</h1>
          <p className="text-ink-500 mb-2">Номер вашего заказа:</p>
          <p className="font-heading text-3xl font-semibold text-ink-900 tabular mb-6">{result}</p>
          <div className="border border-ink-200 rounded-md p-5 text-[13px] text-ink-700 mb-8 inline-block text-left">
            Мы свяжемся с вами по <strong className="text-ink-900">{cEmail}</strong> для подтверждения.
            <br />Отслеживайте статус заказа по его номеру.
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setResult(null); setStep(0); setFiles([]); setComment(""); }}
              className="btn-primary"
            >
              Новый заказ
            </button>
            <a href="/order-status" className="btn">
              Проверить статус
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow mb-4">Калькулятор</p>
          <h1 className="h-display">Заказать онлайн</h1>
        </div>
      </section>

      <div className="border-b border-ink-200">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  i === step
                    ? "bg-ink-900 text-white"
                    : i < step
                    ? "bg-ink-100 text-ink-700 cursor-pointer hover:bg-ink-200"
                    : "text-ink-400"
                }`}
              >
                <span className="grid place-items-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-semibold tabular">
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-ink-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="container-page py-10 sm:py-14 grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="h-section">Выберите услугу</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {SERVICES.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => handleServiceChange(i)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-md border text-left transition-colors ${
                      i === selectedIdx
                        ? "border-ink-900 bg-ink-50"
                        : "border-ink-200 hover:border-ink-400"
                    }`}
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-md bg-ink-100 text-ink-700 font-heading text-base font-semibold">
                      {s.name.charAt(0)}
                    </span>
                    <span className={`text-[12px] font-medium leading-tight ${i === selectedIdx ? "text-ink-900" : "text-ink-700"}`}>{s.name}</span>
                    <span className="text-[11px] text-ink-400 tabular">от {s.basePrice}&nbsp;₽/{s.unit}</span>
                  </button>
                ))}
              </div>
              <div className="border border-ink-200 rounded-md p-4 flex items-start gap-3">
                <Info size={16} strokeWidth={2} className="text-ink-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-ink-700">
                  <strong className="text-ink-900">{svc.name}</strong> — базовая цена от <strong className="text-ink-900">{svc.basePrice}&nbsp;₽</strong> за {svc.unit}.
                  Выберите параметры на следующем шаге для точного расчёта.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="h-section">Параметры: {svc.name}</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-2">Тираж ({svc.unit})</label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[10, 50, 100, 250, 500, 1000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setQuantity(v)}
                      className={`px-4 py-2 rounded-md text-[12px] font-medium tabular transition-colors ${
                        quantity === v
                          ? "bg-ink-900 text-white"
                          : "border border-ink-200 text-ink-700 hover:border-ink-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ink-500">Или введите:</span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input w-28 tabular"
                  />
                  <span className="text-[12px] text-ink-400">{svc.unit}</span>
                </div>
              </div>

              {svc.options.map((opt, optIdx) => (
                <div key={opt.label}>
                  <label className="block text-[12px] font-medium text-ink-700 mb-2">{opt.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val, valIdx) => (
                      <button
                        key={val.label}
                        onClick={() => setChoice(optIdx, valIdx)}
                        className={`px-4 py-2 rounded-md text-[12px] font-medium transition-colors ${
                          getChoice(optIdx) === valIdx
                            ? "bg-ink-900 text-white"
                            : "border border-ink-200 text-ink-700 hover:border-ink-400"
                        }`}
                      >
                        {val.label}
                        {val.multiplier !== 1 && (
                          <span className="ml-1 opacity-50 tabular">×{val.multiplier}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="h-section">Загрузите макет</h2>
              <p className="text-[13px] text-ink-500">
                Прикрепите готовый макет для печати (PDF, JPG, PNG, AI, CDR, PSD). Если макета нет — опишите пожелания в комментарии.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-ink-900 bg-ink-50" : "border-ink-300 hover:border-ink-500"
                }`}
              >
                <Upload className="mx-auto mb-3 text-ink-400" size={28} strokeWidth={2} />
                <p className="text-sm font-medium text-ink-900 mb-1">Перетащите файлы сюда</p>
                <p className="text-[12px] text-ink-400">или нажмите для выбора · PDF, JPG, PNG, AI, CDR, PSD</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.psd,.tiff,.svg"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <ul className="border border-ink-200 rounded-md overflow-hidden divide-y divide-ink-200">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 bg-white px-4 py-3">
                      <FileText size={16} strokeWidth={2} className="text-ink-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-ink-900 truncate">{f.name}</p>
                        <p className="text-[11px] text-ink-400 tabular">
                          {formatSize(f.size)}
                          {uploadingIdx === i && <span className="ml-2 text-brand">загружается…</span>}
                        </p>
                      </div>
                      <button onClick={() => removeFile(i)} className="grid place-items-center w-7 h-7 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Комментарий к заказу</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Опишите пожелания к макету, тексты для визиток, ссылки на файлы..."
                  className="input resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="h-section">Способ получения</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex items-start gap-3 p-4 rounded-md border text-left transition-colors ${
                    deliveryType === "pickup" ? "border-ink-900 bg-ink-50" : "border-ink-200 hover:border-ink-400"
                  }`}
                >
                  <MapPin size={18} strokeWidth={2} className="text-ink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">Самовывоз</p>
                    <p className="text-[12px] text-ink-500 mt-0.5">Бесплатно · забрать в офисе</p>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`flex items-start gap-3 p-4 rounded-md border text-left transition-colors ${
                    deliveryType === "delivery" ? "border-ink-900 bg-ink-50" : "border-ink-200 hover:border-ink-400"
                  }`}
                >
                  <Truck size={18} strokeWidth={2} className="text-ink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">Доставка</p>
                    <p className="text-[12px] text-ink-500 mt-0.5">По Тюмени · от 700&nbsp;₽</p>
                  </div>
                </button>
              </div>

              {deliveryType === "pickup" && offices.length > 0 && (
                <div>
                  <label className="block text-[12px] font-medium text-ink-700 mb-2">Выберите офис</label>
                  <ul className="border border-ink-200 rounded-md overflow-hidden divide-y divide-ink-200">
                    {offices.map((o, i) => (
                      <li key={o.id}>
                        <button
                          onClick={() => setSelectedOffice(i)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                            selectedOffice === i ? "bg-ink-50" : "hover:bg-ink-50"
                          }`}
                        >
                          <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            selectedOffice === i ? "border-ink-900" : "border-ink-300"
                          }`}>
                            {selectedOffice === i && <div className="w-2 h-2 rounded-full bg-ink-900" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-ink-900">{o.name}</p>
                            <p className="text-[12px] text-ink-500">{o.address}</p>
                            <p className="text-[11px] text-ink-400 mt-0.5">{o.hours} · {o.phone}</p>
                          </div>
                          {o.is_open && (
                            <span className="ml-auto text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">Открыт</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deliveryType === "delivery" && (
                <div>
                  <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Адрес доставки</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="ул. Республики, 45, офис 12"
                    className="input"
                  />
                  <p className="text-[11px] text-ink-400 mt-1.5">Стоимость доставки уточнит менеджер после оформления</p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="h-section">Контактные данные</h2>

              {user && (
                <div className="border border-ink-200 rounded-md px-4 py-3 text-[13px] text-ink-700 flex items-center gap-2">
                  <Star size={14} strokeWidth={2} className="text-ink-500 shrink-0" />
                  Вы вошли как <strong className="text-ink-900">{user?.name}</strong> — данные заполнены автоматически
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Имя *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    className="input tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div className="border border-ink-200 rounded-md overflow-hidden">
                <div className="px-4 py-3 bg-ink-50 border-b border-ink-200">
                  <h3 className="eyebrow">Ваш заказ</h3>
                </div>
                <div className="px-4 py-3 space-y-2 text-[13px]">
                  <div className="flex justify-between"><span className="text-ink-500">Услуга</span><span className="font-medium text-ink-900">{svc.name}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Тираж</span><span className="font-medium text-ink-900 tabular">{quantity} {svc.unit}</span></div>
                  {svc.options.map((opt, i) => (
                    <div key={opt.label} className="flex justify-between"><span className="text-ink-500">{opt.label}</span><span className="font-medium text-ink-900">{opt.values[getChoice(i)].label}</span></div>
                  ))}
                  {files.length > 0 && (
                    <div className="flex justify-between"><span className="text-ink-500">Файлы</span><span className="font-medium text-ink-900 tabular">{files.length} шт.</span></div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-500">Получение</span>
                    <span className="font-medium text-ink-900">
                      {deliveryType === "pickup" ? `Самовывоз: ${offices[selectedOffice]?.name || "—"}` : `Доставка: ${deliveryAddress}`}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-ink-200 flex justify-between items-baseline">
                  <span className="font-medium text-ink-900">Итого</span>
                  <span className="font-heading text-xl font-semibold text-ink-900 tabular">{totalPrice.toLocaleString("ru-RU")}&nbsp;₽</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-ink-900"
                />
                <span className="text-[12px] text-ink-500">
                  Я согласен с условиями обработки персональных данных и политикой конфиденциальности
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} strokeWidth={2} />
              Назад
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={!canNext()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Далее
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={sending || !canNext()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={16} strokeWidth={2} />
                {sending ? "Оформляем..." : "Оформить заказ"}
              </button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-ink-200 rounded-md p-5 bg-ink-50">
            <p className="eyebrow mb-3">Текущая стоимость</p>
            <p className="font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">
              {totalPrice.toLocaleString("ru-RU")}&nbsp;₽
            </p>
            <p className="text-[12px] text-ink-500 mt-1 tabular">
              {unitPrice.toLocaleString("ru-RU")}&nbsp;₽ за&nbsp;{svc.unit}
            </p>
            <hr className="my-4 border-ink-200" />
            <dl className="space-y-2 text-[12px]">
              <div className="flex justify-between"><dt className="text-ink-500">Услуга</dt><dd className="font-medium text-ink-900 text-right">{svc.name}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Тираж</dt><dd className="font-medium text-ink-900 tabular">{quantity} {svc.unit}</dd></div>
              {svc.options.map((opt, i) => (
                <div key={opt.label} className="flex justify-between gap-2">
                  <dt className="text-ink-500 truncate">{opt.label}</dt>
                  <dd className="font-medium text-ink-900 text-right truncate">{opt.values[getChoice(i)].label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
