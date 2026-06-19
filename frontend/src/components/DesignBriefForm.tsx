"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/lib/icons";
import {
  Upload, X, FileCheck2, CheckCircle2, Phone, Palette,
  Type, Image as ImageIcon, PenLine, Layers, AlignVerticalJustifyCenter, Wand2,
} from "@/lib/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "./Toast";
import { PillsField } from "./calc/kit";

const PRODUCTS = [
  "Визитки", "Листовки", "Флаеры", "Буклеты", "Открытки",
  "Наклейки и стикеры", "Карманные календари", "Настольный календарь-домик",
  "Плакатный календарь", "Перекидной настенный календарь", "Квартальный календарь",
  "Блокноты", "Меню для кафе", "Грамоты и дипломы", "Конверты",
  "Печать фотографий", "Другое",
];

const PRODUCT_SLUG: Record<string, string> = {
  "Визитки": "визитки",
  "Листовки": "листовки",
  "Флаеры": "флаеры",
  "Буклеты": "буклеты",
  "Открытки": "открытки",
  "Наклейки и стикеры": "наклейки",
  "Карманные календари": "карманные-календари",
  "Настольный календарь-домик": "настольный-календарь-домик",
  "Плакатный календарь": "плакатный-календарь",
  "Перекидной настенный календарь": "перекидной-календарь",
  "Квартальный календарь": "квартальный-календарь",
  "Блокноты": "блокноты",
  "Меню для кафе": "меню-для-кафе",
  "Грамоты и дипломы": "грамоты-и-дипломы",
  "Конверты": "конверты",
  "Печать фотографий": "печать-фотографий",
};

const DESIGN_PRICE = 1000;

type FileEntry = { file: File; id: number | null };

export default function DesignBriefForm({ onUseConstructor }: { onUseConstructor?: () => void }) {
  const { user, token } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [product, setProduct] = useState<string>(PRODUCTS[0]);
  const [orientation, setOrientation] = useState<"Вертикальный" | "Горизонтальный">("Вертикальный");
  const [sides, setSides] = useState<"Односторонняя" | "Двусторонняя">("Односторонняя");
  const [size, setSize] = useState("");
  const [sheets, setSheets] = useState("");
  const [content, setContent] = useState("");
  const [font, setFont] = useState("");
  const [palette, setPalette] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");

  const [images, setImages] = useState<FileEntry[]>([]);
  const [sketch, setSketch] = useState<FileEntry[]>([]);
  const [brandbook, setBrandbook] = useState<FileEntry[]>([]);

  const [sending, setSending] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("product");
    if (!p) return;
    const match = PRODUCTS.find((x) => x.toLowerCase() === p.toLowerCase());
    setProduct(match ?? "Другое");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Укажите ФИО и номер телефона для связи");
      return;
    }
    setSending(true);
    try {

      const all = [...images, ...sketch, ...brandbook];
      const fileIds: number[] = [];
      for (const entry of all) {
        if (entry.id != null) { fileIds.push(entry.id); continue; }
        try {
          const up = await api.uploadFile(entry.file, token || undefined);
          fileIds.push(up.id);
        } catch {  }
      }

      const options: Record<string, any> = {
        orientation,
        sides,
        size: size || "—",
        sheets: sheets || "—",
        font: font || "—",
        palette_cmyk: palette || "—",
        images: images.map((f) => f.file.name).join(", ") || "—",
        sketch: sketch.map((f) => f.file.name).join(", ") || "—",
        brandbook: brandbook.map((f) => f.file.name).join(", ") || "—",
      };

      const comment = [
        `БРИФ НА ДИЗАЙН — ${product}`,
        `Ориентация: ${orientation} · Стороны: ${sides}`,
        size ? `Формат/размер: ${size}` : null,
        sheets ? `Листов/блоков: ${sheets}` : null,
        font ? `Шрифт: ${font}` : null,
        palette ? `Палитра CMYK: ${palette}` : null,
        content ? `Текст: ${content}` : null,
        `Контакт: ${name}, ${phone}`,
      ].filter(Boolean).join(" | ");

      const order = await api.createOrder({
        customer_name: name,
        customer_email: user?.email || "Format7-tmn@yandex.ru",
        customer_phone: phone,
        comment,
        items: [{ service_id: 0, quantity: 1, price: DESIGN_PRICE, options: { "Товар": `Дизайн — ${product}`, ...options } }],
        file_ids: fileIds,
      }, token || undefined);

      if (order.payment_token) {
        router.push(`/orders/${encodeURIComponent(order.order_number)}/pay?pt=${encodeURIComponent(order.payment_token)}`);
        return;
      }
      setOrderNumber(order.order_number);
    } catch (err: any) {
      toast.error(err?.message || "Не удалось отправить бриф");
    } finally {
      setSending(false);
    }
  };

  if (orderNumber) {
    return (
      <section className="bg-white">
        <div className="container-page py-16 sm:py-24 max-w-xl mx-auto text-center">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-ink-900">Бриф отправлен</h1>
          <p className="mt-2 text-ink-600">
            Дизайнер изучит ваше ТЗ и свяжется по телефону <span className="font-medium text-ink-900">{phone}</span> для уточнения деталей и стоимости.
          </p>
          <p className="mt-1 text-[13px] text-ink-500">Номер заявки: <span className="font-semibold text-ink-900">{orderNumber}</span></p>

          <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50 p-4 flex items-center gap-3 text-left">
            <span className="grid place-items-center w-11 h-11 rounded-md bg-white border border-ink-200 text-ink-700"><Phone size={22} /></span>
            <div className="text-[12px] text-ink-700">
              <p className="font-semibold text-ink-900">Оплата после согласования</p>
              <p>Менеджер согласует стоимость и способ оплаты после утверждения концепции макета.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push(PRODUCT_SLUG[product] ? `/services/${PRODUCT_SLUG[product]}` : "/catalog")}
              className="h-11 px-5 rounded-lg bg-amber-500 text-white text-[14px] font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              Перейти к заказу печати
              <ArrowRight size={15} strokeWidth={2} />
            </button>
            <div className="flex gap-2 justify-center">
              <button onClick={() => router.push("/profile")} className="h-11 px-5 rounded-lg border border-ink-200 text-ink-700 text-[13px] font-medium hover:bg-ink-50">Мои заказы</button>
              <a href="tel:+79324759511" className="h-11 px-5 rounded-lg flex items-center justify-center gap-2 border border-ink-200 text-ink-900 text-[13px] font-medium hover:bg-ink-50"><Phone size={14} /> Позвонить</a>
              <button onClick={() => setOrderNumber(null)} className="h-11 px-5 rounded-lg border border-ink-200 text-ink-700 text-[13px] font-medium hover:bg-ink-50">Новый бриф</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="container-page py-10 sm:py-14">

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Дизайнер</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">Бриф на разработку макета</h1>
            <p className="mt-2 text-ink-500 text-sm max-w-2xl">
              Заполните ТЗ — чем подробнее, тем точнее результат. Дизайнер свяжется с вами для согласования концепции и стоимости.
            </p>
          </div>
          {onUseConstructor && (
            <button onClick={onUseConstructor} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-200 text-[13px] font-medium text-ink-700 hover:border-ink-300 transition-colors">
              <Wand2 size={15} /> Визуальный конструктор
            </button>
          )}
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6 space-y-5">

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><Layers size={13} /> Вид продукта</label>
                <select value={product} onChange={(e) => setProduct(e.target.value)} className="input h-11 w-full">
                  {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <PillsField label="Тип ориентации макета" values={["Вертикальный", "Горизонтальный"]} value={orientation} onChange={(v) => setOrientation(v as any)} />

              <PillsField label="Стороны печати" values={["Односторонняя", "Двусторонняя"]} value={sides} onChange={(v) => setSides(v as any)} />

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><AlignVerticalJustifyCenter size={13} /> Размер изображения, мм</label>
                <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Какой формат используется: А3 / А4 / А5 / А6 или точный размер в мм" className="input h-11 w-full" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><Layers size={13} /> Количество листов (блоков) в продукте</label>
                <input value={sheets} onChange={(e) => setSheets(e.target.value)} placeholder="Например: 1, 2, 12…" className="input h-11 w-full" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><Type size={13} /> Текстовое содержание</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Укажите выверенный и структурированный текст: слоганы, заголовки и другая необходимая информация." className="input w-full py-2.5 resize-y" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><Type size={13} /> Шрифт</label>
                <input value={font} onChange={(e) => setFont(e.target.value)} placeholder="Наименование и размер используемого шрифта (например: Montserrat, 14 pt)" className="input h-11 w-full" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-1.5"><Palette size={13} /> Цветовая палитра CMYK</label>
                <input value={palette} onChange={(e) => setPalette(e.target.value)} placeholder="Основные и доп. цвета (например: C0 M80 Y100 K0). Брендбук — приложите файлом справа." className="input h-11 w-full" />
              </div>
            </div>

            <div className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6">
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 mb-3"><Phone size={13} /> Контакты для связи</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ФИО *" className="input h-11" required />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер телефона *" className="input h-11 tabular" required />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-5">

              <FileField
                icon={<ImageIcon size={16} />}
                label="Изображения"
                hint="Файлы с изображениями для макета: логотипы, фото, графика (PNG, JPG, AI, PSD, TIFF, PDF)."
                accept=".png,.jpg,.jpeg,.tiff,.psd,.ai,.eps,.pdf,.svg"
                multiple
                files={images}
                setFiles={setImages}
              />

              <FileField
                icon={<PenLine size={16} />}
                label="Эскиз от руки"
                hint="Нарисованный от руки эскиз — чтобы наглядно показать, что и где должно располагаться."
                accept=".png,.jpg,.jpeg,.pdf"
                multiple
                files={sketch}
                setFiles={setSketch}
              />

              <FileField
                icon={<Palette size={16} />}
                label="Брендбук / цвета (опц.)"
                hint="Если есть брендбук с прописанными цветами — приложите файл."
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.zip"
                multiple
                files={brandbook}
                setFiles={setBrandbook}
              />

              <div className="rounded-xl border border-ink-200 bg-white p-5">
                <button type="submit" disabled={sending} className="w-full h-12 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                  {sending ? "Оформляем…" : `Перейти к оплате — ${DESIGN_PRICE} ₽`}
                </button>
                <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
                  Разработка макета — фиксированно <b>{DESIGN_PRICE} ₽</b>. В стоимость входят 2 доработки, каждая последующая — +100 ₽. После оформления откроется страница оплаты по СБП.
                </p>
                {!user && (
                  <p className="mt-2 text-[11px] text-ink-400">
                    <Link href="/login" className="font-medium text-ink-700 hover:text-brand">Войдите</Link>, чтобы отслеживать статус и оплату.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function FileField({
  icon, label, hint, accept, multiple, files, setFiles,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  files: FileEntry[];
  setFiles: React.Dispatch<React.SetStateAction<FileEntry[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list || !list.length) return;
    const next = Array.from(list).map((file) => ({ file, id: null as number | null }));
    setFiles((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full rounded-lg border-2 border-dashed p-5 text-left transition-colors ${
          files.length ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50 hover:bg-amber-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`grid place-items-center w-10 h-10 rounded-lg ${files.length ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {files.length ? <FileCheck2 size={18} /> : icon}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-[14px] font-bold text-ink-900">{label}</p>
            <p className="text-[11px] text-ink-500 flex items-center gap-1"><Upload size={11} /> Добавить файлы</p>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] text-ink-500 leading-relaxed">{hint}</p>
      </button>
      <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => add(e.target.files)} />

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1.5">
              <span className="text-[12px] text-ink-700 truncate">{f.file.name}</span>
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0 text-ink-400 hover:text-ink-900" aria-label="Убрать файл">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
