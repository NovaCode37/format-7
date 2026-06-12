"use client";

import { useEffect, useRef, useState } from "react";
import { api, resolveImageUrl, type Service, type Category, type ServiceInput } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Plus, Pencil, Trash2, Upload, X, Loader2, ImageOff, Eye, EyeOff } from "@/lib/icons";

const EMPTY: ServiceInput = {
  name: "", slug: "", icon: "", description: "",
  category_id: null, order: 0, image: "", price_from: 0, is_active: true,
};

export default function AdminProducts({ token }: { token: string }) {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.adminListServices(token), api.adminListCategories(token)]);
      setServices(s);
      setCategories(c);
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name || "—";

  const remove = async (s: Service) => {
    if (!confirm(`Удалить «${s.name}»?`)) return;
    try {
      const r = await api.adminDeleteService(token, s.id);
      toast.success(r.soft ? "Товар скрыт (есть заказы — история сохранена)" : "Товар удалён");
      load();
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    }
  };

  const toggleActive = async (s: Service) => {
    try {
      await api.adminUpdateService(token, s.id, { ...toInput(s), is_active: !s.is_active });
      load();
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] text-ink-500">{services.length} товаров</p>
        <button onClick={() => setCreating(true)} className="btn btn-sm cursor-pointer">
          <Plus size={14} strokeWidth={2} /> Добавить товар
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>
      ) : (
        <div className="overflow-x-auto border border-ink-200 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
              <tr>
                <th className="px-3 py-3">Фото</th>
                <th className="px-3 py-3">Название</th>
                <th className="px-3 py-3">Категория</th>
                <th className="px-3 py-3">Цена от</th>
                <th className="px-3 py-3">Показ</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {services.map((s) => (
                <tr key={s.id} className={`hover:bg-ink-50/50 ${!s.is_active ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="w-12 h-9 rounded bg-ink-100 overflow-hidden grid place-items-center">
                      {s.image ? (
                        <img src={resolveImageUrl(s.image)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff size={14} className="text-ink-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-ink-900 font-medium">{s.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{s.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-ink-600 text-[13px]">{catName(s.category_id)}</td>
                  <td className="px-3 py-2 tabular text-ink-700">{s.price_from ? `от ${s.price_from} ₽` : "—"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleActive(s)} title={s.is_active ? "Скрыть" : "Показать"} className="cursor-pointer text-ink-400 hover:text-ink-900">
                      {s.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(s)} className="p-1.5 text-ink-400 hover:text-ink-900 cursor-pointer" title="Редактировать"><Pencil size={15} /></button>
                      <button onClick={() => remove(s)} className="p-1.5 text-ink-400 hover:text-red-600 cursor-pointer" title="Удалить"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <ProductModal
          token={token}
          categories={categories}
          service={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function toInput(s: Service): ServiceInput {
  return {
    name: s.name, slug: s.slug, icon: s.icon, description: s.description,
    category_id: s.category_id, order: s.order, image: s.image,
    price_from: s.price_from, is_active: s.is_active,
  };
}

function ProductModal({
  token, categories, service, onClose, onSaved,
}: {
  token: string;
  categories: Category[];
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ServiceInput>(service ? toInput(service) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof ServiceInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.adminUploadImage(token, file);
      set("image", url);
      toast.success("Фото загружено");
    } catch (e: any) {
      toast.error(e.message || "Не удалось загрузить");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    setSaving(true);
    try {
      if (service) await api.adminUpdateService(token, service.id, form);
      else await api.adminCreateService(token, form);
      toast.success("Сохранено");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-ink-950/50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg border border-ink-200 shadow-lg w-full max-w-lg my-8 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-ink-900">{service ? "Редактировать товар" : "Новый товар"}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 cursor-pointer"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Фото товара</label>
          <div className="flex items-center gap-3">
            <div className="w-24 h-16 rounded-md bg-ink-100 overflow-hidden grid place-items-center shrink-0">
              {form.image ? <img src={resolveImageUrl(form.image)} alt="" className="w-full h-full object-cover" /> : <ImageOff size={18} className="text-ink-300" />}
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-sm cursor-pointer disabled:opacity-60">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Загрузка…" : "Загрузить фото"}
              </button>
              {form.image && <button type="button" onClick={() => set("image", "")} className="text-[11px] text-ink-500 hover:text-red-600 cursor-pointer text-left">Убрать фото</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
        </div>

        <Field label="Название">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
        </Field>
        <Field label="Slug (адрес, должен совпадать со slug калькулятора)">
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input font-mono text-[13px]" placeholder="визитки" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Категория">
            <select value={form.category_id ?? ""} onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)} className="input cursor-pointer">
              <option value="">— без категории —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Цена «от», ₽">
            <input type="number" min={0} value={form.price_from ?? 0} onChange={(e) => set("price_from", Math.max(0, parseInt(e.target.value) || 0))} className="input tabular" />
          </Field>
        </div>
        <Field label="Порядок">
          <input type="number" value={form.order ?? 0} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="input tabular" />
        </Field>
        <Field label="Описание">
          <textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} className="input resize-none" />
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
          <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} />
          Показывать на сайте
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-60 cursor-pointer">
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
          <button onClick={onClose} className="btn cursor-pointer">Отмена</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
