"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Turnstile from "@/components/Turnstile";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.forgotPassword(email, captcha);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Ошибка отправки");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="container-page max-w-md mx-auto py-14 sm:py-20">
        <p className="eyebrow mb-3">Восстановление доступа</p>
        <h1 className="h-display mb-6">Забыли пароль?</h1>

        {sent ? (
          <div className="border border-ink-200 rounded-md p-6">
            <p className="text-ink-700 mb-4">
              Если указанный email зарегистрирован, мы отправили на него письмо
              со ссылкой для сброса. Ссылка действительна <b>30 минут</b>.
            </p>
            <p className="text-[13px] text-ink-500">
              Не пришло письмо? Проверьте папку «Спам».
            </p>
            <Link href="/login" className="btn btn-sm mt-5 inline-flex">
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-ink-600 text-[14px]">
              Введите email, указанный при регистрации. Мы пришлём ссылку для создания
              нового пароля.
            </p>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-ink-200 rounded-md px-4 py-2.5 text-sm"
            />
            <Turnstile onVerify={setCaptcha} />
            {error && <p className="text-red-600 text-[13px]">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer disabled:opacity-60">
              {loading ? "Отправляем…" : "Получить ссылку"}
            </button>
            <p className="text-center text-[12px] text-ink-500">
              <Link href="/login" className="underline">Вспомнил пароль — на вход</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
