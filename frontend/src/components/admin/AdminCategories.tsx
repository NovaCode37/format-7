"use client";

import { useEffect, useState } from "react";
import { api, type Category, type CategoryInput } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Plus, Pencil, Trash2, X, Loader2, Folder } from "@/lib/icons";

const EMPTY: CategoryInput = { name: "", slug: "", icon: "", order: 0 };

export default function AdminCategories({ token }: { token: string }) {
  const toast = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCats(await api.adminListCategories(token));
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const remove = async (c: Category) => {
    if (!confirm(`Удалить категорию «${c.name}»? Товары останутся, но без категории.`)) return;
    try {
      await api.adminDeleteCategory(token, c.id);
      toast.success("Категория удалена");
      load();
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] text-ink-500">{cats.length} категорий</p>
        <button onClick={() => setCreating(true)} className="btn btn-sm cursor-pointer">
          <Plus size={14} strokeWidth={2} /> Добавить категорию
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>
      ) : (
        <div className="border border-ink-200 rounded-md divide-y divide-ink-100">
          {cats.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <Folder size={18} className="text-ink-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-ink-900 font-medium">{c.name}</div>
                <div className="text-[11px] text-ink-400 font-mono">{c.slug} · {c.services?.length || 0} товаров</div>
              </div>
              <button onClick={() => setEditing(c)} className="p-1.5 text-ink-400 hover:text-ink-900 cursor-pointer"><Pencil size={15} /></button>
              <button onClick={() => remove(c)} className="p-1.5 text-ink-400 hover:text-red-600 cursor-pointer"><Trash2 size={15} /></button>
            </div>
          ))}
          {cats.length === 0 && <p className="text-center text-ink-400 py-10 text-sm">Категорий пока нет</p>}
        </div>
      )}

      {(creating || editing) && (
        <CategoryModal
          token={token}
          category={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  token, category, onClose, onSaved,
}: {
  token: string;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CategoryInput>(
    category ? { name: category.name, slug: category.slug, icon: category.icon, order: category.order } : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof CategoryInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    setSaving(true);
    try {
      if (category) await api.adminUpdateCategory(token, category.id, form);
      else await api.adminCreateCategory(token, form);
      toast.success("Сохранено");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50" onClick={onClose}>
      <div className="bg-white rounded-lg border border-ink-200 shadow-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-ink-900">{category ? "Редактировать категорию" : "Новая категория"}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 cursor-pointer"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Название</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Slug</label>
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input font-mono text-[13px]" placeholder="полиграфия" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Порядок</label>
          <input type="number" value={form.order ?? 0} onChange={(e) => set("order", parseInt(e.target.value) || 0)} className="input tabular" />
        </div>
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
