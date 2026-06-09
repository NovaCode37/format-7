"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();
  const { setToken } = useAuth();

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Ссылка недействительна");
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 8) { setError("Минимум 8 символов"); return; }
    if (pwd !== pwd2)   { setError("Пароли не совпадают"); return; }
    setLoading(true);
    try {
      const res = await api.resetPassword(token, pwd);
      setToken(res.access_token);
      setDone(true);
      setTimeout(() => router.push("/profile"), 1500);
    } catch (err: any) {
      setError(err.message || "Не удалось сбросить пароль");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="container-page max-w-md mx-auto py-14 sm:py-20">
        <p className="eyebrow mb-3">Сброс пароля</p>
        <h1 className="h-display mb-6">Новый пароль</h1>

        {done ? (
          <div className="border border-emerald-200 bg-emerald-50 rounded-md p-5">
            <p className="text-emerald-800">Пароль успешно изменён. Перенаправляем в профиль…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              required minLength={8}
              autoComplete="new-password"
              placeholder="Новый пароль (минимум 8 символов)"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              className="w-full border border-ink-200 rounded-md px-4 py-2.5 text-sm"
            />
            <input
              type="password"
              required minLength={8}
              autoComplete="new-password"
              placeholder="Повторите пароль"
              value={pwd2}
              onChange={e => setPwd2(e.target.value)}
              className="w-full border border-ink-200 rounded-md px-4 py-2.5 text-sm"
            />
            {error && <p className="text-red-600 text-[13px]">{error}</p>}
            <button type="submit" disabled={loading || !token} className="btn-primary w-full cursor-pointer disabled:opacity-60">
              {loading ? "Сохраняем…" : "Задать пароль"}
            </button>
            <p className="text-center text-[12px] text-ink-500">
              <Link href="/login" className="underline">На вход</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-400">Загрузка…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
