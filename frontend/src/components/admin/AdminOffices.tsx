"use client";

import { useEffect, useState } from "react";
import { api, type Office, type OfficeInput } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Plus, Pencil, Trash2, X, Loader2, MapPin } from "@/lib/icons";

const EMPTY: OfficeInput = { name: "", address: "", phone: "", hours: "", is_open: true, lat: "", lng: "" };

export default function AdminOffices({ token }: { token: string }) {
  const toast = useToast();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Office | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setOffices(await api.adminListOffices(token));
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const remove = async (o: Office) => {
    if (!confirm(`Удалить офис «${o.name}»?`)) return;
    try {
      await api.adminDeleteOffice(token, o.id);
      toast.success("Офис удалён");
      load();
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] text-ink-500">{offices.length} офисов</p>
        <button onClick={() => setCreating(true)} className="btn btn-sm cursor-pointer">
          <Plus size={14} strokeWidth={2} /> Добавить офис
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {offices.map((o) => (
            <div key={o.id} className="border border-ink-200 rounded-md p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${o.is_open ? "bg-emerald-600" : "bg-ink-400"}`} />
                    <h3 className="font-heading text-[15px] font-semibold text-ink-900">{o.name}</h3>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-600 flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0 text-ink-400" />{o.address}</p>
                  {o.hours && <p className="mt-1 text-[12px] text-ink-500 tabular">{o.hours}</p>}
                  {o.phone && <p className="mt-1 text-[12px] text-ink-500 tabular">{o.phone}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(o)} className="p-1.5 text-ink-400 hover:text-ink-900 cursor-pointer"><Pencil size={15} /></button>
                  <button onClick={() => remove(o)} className="p-1.5 text-ink-400 hover:text-red-600 cursor-pointer"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
          {offices.length === 0 && <p className="text-center text-ink-400 py-10 text-sm col-span-2">Офисов пока нет</p>}
        </div>
      )}

      {(creating || editing) && (
        <OfficeModal
          token={token}
          office={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function OfficeModal({
  token, office, onClose, onSaved,
}: {
  token: string;
  office: Office | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<OfficeInput>(
    office
      ? { name: office.name, address: office.address, phone: office.phone, hours: office.hours, is_open: office.is_open, lat: office.lat, lng: office.lng }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof OfficeInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error("Заполните название и адрес");
      return;
    }
    setSaving(true);
    try {
      if (office) await api.adminUpdateOffice(token, office.id, form);
      else await api.adminCreateOffice(token, form);
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
      <div className="bg-white rounded-lg border border-ink-200 shadow-lg w-full max-w-md my-8 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-ink-900">{office ? "Редактировать офис" : "Новый офис"}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 cursor-pointer"><X size={18} /></button>
        </div>
        <F label="Название"><input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="Format7 — Центр" /></F>
        <F label="Адрес"><input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="г. Тюмень, ул. ..." /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Телефон"><input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className="input tabular" /></F>
          <F label="Часы работы"><input value={form.hours ?? ""} onChange={(e) => set("hours", e.target.value)} className="input" placeholder="Пн–Пт 9–19" /></F>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Широта (lat)"><input value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value)} className="input tabular" placeholder="57.13" /></F>
          <F label="Долгота (lng)"><input value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value)} className="input tabular" placeholder="65.59" /></F>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
          <input type="checkbox" checked={form.is_open ?? true} onChange={(e) => set("is_open", e.target.checked)} />
          Сейчас открыт
        </label>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-60 cursor-pointer">{saving ? "Сохраняем…" : "Сохранить"}</button>
          <button onClick={onClose} className="btn cursor-pointer">Отмена</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
