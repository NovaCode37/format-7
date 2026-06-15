"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart, Phone, Upload, Download, Minus, Plus, ChevronDown, Info, CheckCircle2, X,
} from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "./Toast";
import { api } from "@/lib/api";
import {
  type ProductCalc,
  type CalcOption,
  getQuantityMultiplier,
} from "@/lib/productCalculators";
import Product3D from "./Product3D";

interface Props {
  config: ProductCalc;
  serviceId: number;
}

export default function ProductCalculator({ config, serviceId }: Props) {
  const { user, token, addToCart } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeImage, setActiveImage] = useState(0);
  const [choices, setChoices] = useState<number[]>(() => config.options.map(() => 0));
  const [quantity, setQuantity] = useState(config.defaultQuantity);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  const setChoice = (optIdx: number, valIdx: number) => {
    setChoices((prev) => {
      const next = [...prev];
      next[optIdx] = valIdx;
      return next;
    });
  };

  const { unitPrice, totalPrice, qtyTierMultiplier } = useMemo(() => {
    let unit = config.basePricePerUnit;
    config.options.forEach((opt, i) => {
      const v = opt.values[choices[i] ?? 0];
      if (v) unit *= v.multiplier;
    });
    const tierMul = getQuantityMultiplier(quantity, config.quantityTiers);
    unit *= tierMul;
    const total = unit * quantity;
    return {
      unitPrice: Math.round(unit * 100) / 100,
      totalPrice: Math.round(total * 100) / 100,
      qtyTierMultiplier: tierMul,
    };
  }, [config, choices, quantity]);

  const fmtPrice = (n: number) =>
    n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAddToCart = async () => {
    if (!serviceId) {
      toast.error("Сервис временно недоступен. Закажите обратный звонок — мы оформим заказ вручную.");
      return;
    }
    if (!user) {
      toast.error("Войдите, чтобы добавить заказ в корзину");
      return;
    }
    setAdding(true);
    try {
      await addToCart(serviceId, quantity);
      setAdded(true);
      toast.success(`${config.title} — ${quantity} ${config.unit} добавлено в корзину`);
      setTimeout(() => setAdded(false), 2200);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка добавления");
    } finally {
      setAdding(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    try {
      const f = files[0];
      const up = await api.uploadFile(f, token || undefined);
      toast.success(`Файл «${up.original_name}» загружен`);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка загрузки макета");
    }
  };

  const incQty = () => setQuantity((q) => q + 1);
  const decQty = () => setQuantity((q) => Math.max(config.minQuantity, q - 1));

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">

              <Product3D
                image={config.gallery[activeImage]}
                backImage={config.gallery[(activeImage + 1) % config.gallery.length]}
                aspect={config.unit === "стр." ? "210/297" : "90/55"}
                className="w-full"
              />

              {config.gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {config.gallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                        i === activeImage ? "border-brand" : "border-ink-200 hover:border-ink-300"
                      }`}
                      aria-label={`Миниатюра ${i + 1}`}
                    >
                      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink-900">
                  Параметры заказа
                </h2>
                <p className="mt-1 text-[12px] text-ink-500">
                  Цена обновляется автоматически при изменении опций
                </p>
              </div>

              {config.options.map((opt, optIdx) => (
                <OptionField
                  key={opt.key}
                  option={opt}
                  selectedIndex={choices[optIdx] ?? 0}
                  onChange={(valIdx) => setChoice(optIdx, valIdx)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6">

                <label className="block text-[12px] font-semibold text-ink-700 mb-2">
                  Тираж ({config.unit})
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {config.quantityPresets.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={`px-2.5 h-8 rounded-md text-[12px] font-medium tabular transition-colors ${
                        quantity === q
                          ? "bg-brand text-white"
                          : "bg-ink-50 text-ink-700 border border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="flex items-center rounded-lg border border-ink-200 overflow-hidden">
                  <button
                    onClick={decQty}
                    className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50 transition-colors"
                    aria-label="Уменьшить"
                  >
                    <Minus size={14} strokeWidth={2} />
                  </button>
                  <input
                    type="number"
                    min={config.minQuantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(config.minQuantity, parseInt(e.target.value) || config.minQuantity))
                    }
                    className="flex-1 h-10 text-center text-sm font-semibold text-ink-900 tabular bg-white outline-none"
                  />
                  <button
                    onClick={incQty}
                    className="h-10 w-10 grid place-items-center text-ink-700 hover:bg-ink-50 transition-colors"
                    aria-label="Увеличить"
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>

                <div className="mt-5 pt-5 border-t border-ink-100">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    Стоимость заказа
                  </p>
                  <p className="mt-1.5 font-heading text-3xl font-bold text-ink-900 tabular tracking-tight">
                    {fmtPrice(totalPrice)}&nbsp;₽
                  </p>
                  <p className="mt-1 text-[12px] text-ink-500 tabular">
                    {fmtPrice(unitPrice)}&nbsp;₽ за {config.unit}
                    {qtyTierMultiplier < 1 && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        −{Math.round((1 - qtyTierMultiplier) * 100)}%
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`mt-4 w-full h-11 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] transition-colors ${
                    added
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 size={16} strokeWidth={2} />
                      Добавлено
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} strokeWidth={2} />
                      Добавить в&nbsp;корзину
                    </>
                  )}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full h-10 rounded-lg flex items-center justify-center gap-2 text-[13px] font-medium border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <Upload size={14} strokeWidth={2} />
                  Загрузить макет для проверки
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".pdf,.ai,.cdr,.eps,.tiff,.png,.jpg,.jpeg,.psd"
                  onChange={(e) => handleUpload(e.target.files)}
                />

                <Link
                  href="/calculator"
                  className="mt-2 w-full h-10 rounded-lg flex items-center justify-center gap-2 text-[13px] font-medium text-ink-700 hover:text-brand transition-colors"
                >
                  Расширенный расчёт
                </Link>
              </div>

              <button
                onClick={() => setCallbackOpen(true)}
                className="w-full h-11 rounded-lg flex items-center justify-center gap-2 bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-800 transition-colors"
              >
                <Phone size={14} strokeWidth={2} />
                Заказать обратный звонок
              </button>

              {config.templateUrl && (
                <a
                  href={config.templateUrl}
                  className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-700 hover:border-ink-300 transition-colors"
                  download
                >
                  <span className="grid place-items-center w-9 h-9 rounded-md bg-red-50 text-red-600">
                    <Download size={16} strokeWidth={2} />
                  </span>
                  <span className="text-[12px]">
                    Скачать шаблон<br />
                    <span className="text-ink-500">*.CDR и *.PDF</span>
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} title={config.title} />}
    </section>
  );
}

function OptionField({
  option,
  selectedIndex,
  onChange,
}: {
  option: CalcOption;
  selectedIndex: number;
  onChange: (idx: number) => void;
}) {
  const variant = option.variant ?? "pills";

  if (variant === "select") {
    return (
      <div>
        <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
          {option.label}:
        </label>
        <div className="relative">
          <select
            value={selectedIndex}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-11 px-3 pr-9 rounded-lg border border-amber-200 bg-amber-50 text-[13px] font-medium text-amber-900 outline-none appearance-none cursor-pointer hover:bg-amber-100 transition-colors"
          >
            {option.values.map((v, i) => (
              <option key={i} value={i}>
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 pointer-events-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">
        {option.label}:
      </label>
      <div className="flex flex-wrap gap-1.5">
        {option.values.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            title={v.hint}
            className={`px-3 h-9 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1 ${
              i === selectedIndex
                ? "bg-amber-50 text-amber-900 border border-amber-300"
                : "bg-white text-ink-700 border border-ink-200 hover:border-ink-300"
            }`}
          >
            {v.label}
            {v.hint && <Info size={11} className="opacity-60" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function CallbackModal({ onClose, title }: { onClose: () => void; title: string }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    setSending(true);
    try {

      await api.subscribe(`callback+${encodeURIComponent(name)}+${encodeURIComponent(phone)}@format7.local`);
      toast.success("Заявка принята, мы скоро перезвоним");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Не удалось отправить заявку");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl border border-ink-200 p-6 sm:p-7 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <h3 className="font-heading text-xl font-bold text-ink-900">Обратный звонок</h3>
        <p className="mt-1 text-sm text-ink-600">
          Перезвоним по вопросу <strong className="text-ink-900">{title}</strong>
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="input h-11"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className="input h-11 tabular"
            required
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-5 w-full btn-primary h-11 disabled:opacity-60"
        >
          {sending ? "Отправляем..." : "Заказать звонок"}
        </button>

        <p className="mt-3 text-[11px] text-ink-500 text-center">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <Link href="/legal/privacy" className="text-brand hover:underline">
            политикой обработки данных
          </Link>
        </p>
      </form>
    </div>
  );
}
