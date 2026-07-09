"use client";

import { useState } from "react";
import { Phone, X, CheckCircle } from "@/lib/icons";
import { api } from "@/lib/api";

export default function CallbackButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setOpen(false);
    setDone(false);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.requestCallback(name.trim(), phone.trim());
      setDone(true);
      setName("");
      setPhone("");
    } catch (err: any) {
      setError(err?.message || "Не удалось отправить заявку");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-accent text-white text-[12px] font-semibold hover:bg-accent-dark transition-colors cursor-pointer ${className}`}
      >
        <Phone size={12} strokeWidth={2} />
        Обратный звонок
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] grid place-items-center bg-ink-900/50 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-ink-200 p-6 relative"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
            >
              <X size={16} />
            </button>

            {done ? (
              <div className="text-center py-4">
                <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
                <h3 className="font-heading text-lg font-bold text-ink-900 mb-1">Заявка отправлена</h3>
                <p className="text-sm text-ink-500">Перезвоним в рабочее время: Пн–Пт 9:00–17:00.</p>
              </div>
            ) : (
              <>
                <h3 className="font-heading text-xl font-bold text-ink-900">Обратный звонок</h3>
                <p className="mt-1 mb-4 text-sm text-ink-600">Оставьте номер — перезвоним в рабочее время.</p>
                <form onSubmit={submit}>
                  <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Имя</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input w-full mb-3"
                    placeholder="Как к вам обращаться"
                  />
                  <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Телефон</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                    className="input w-full mb-4 tabular"
                    placeholder="+7 ___ ___-__-__"
                  />
                  {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-accent w-full disabled:opacity-60"
                  >
                    {sending ? "Отправляем…" : "Жду звонка"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
