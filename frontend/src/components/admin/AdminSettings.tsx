"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { SITE_DEFAULTS, SETTINGS_LABELS, type SiteSettings } from "@/lib/siteDefaults";
import { Loader2 } from "@/lib/icons";

const ORDER: (keyof SiteSettings)[] = [
  "phone", "phoneHref", "email", "maxLink",
  "address", "hoursWeekday", "hoursSaturday",
  "legalName", "inn", "ogrnip",
];

export default function AdminSettings({ token }: { token: string }) {
  const toast = useToast();
  const [form, setForm] = useState<SiteSettings>(SITE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSiteSettings()
      .then((data) => setForm({ ...SITE_DEFAULTS, ...(data || {}) }))
      .catch(() => setForm(SITE_DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof SiteSettings, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.adminPutSiteSettings(token, form);
      toast.success("Контакты сохранены");
    } catch (e: any) {
      toast.error(e.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] text-ink-500">Контакты и реквизиты — показываются в шапке, футере, контактах и на оплате.</p>
        <button onClick={save} disabled={saving} className="btn-primary btn-sm cursor-pointer disabled:opacity-60">
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ORDER.map((k) => (
          <div key={k} className={k === "address" || k === "maxLink" || k === "legalName" ? "sm:col-span-2" : ""}>
            <label className="block text-[12px] font-medium text-ink-700 mb-1.5">{SETTINGS_LABELS[k]}</label>
            <input
              value={form[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
              className="input w-full"
            />
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-ink-500">Изменения применяются сразу после сохранения (у посетителей — при следующей загрузке страницы).</p>
    </div>
  );
}
