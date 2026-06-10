"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/Turnstile";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, captcha);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ink-50 border-t border-ink-200 min-h-[70vh] py-16 sm:py-24">
      <div className="container-page">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-start">

          <div className="col-span-12 lg:col-span-6">
            <p className="eyebrow mb-4">Личный кабинет</p>
            <h1 className="h-display">
              Вход в&nbsp;аккаунт
              <br />
              <span className="text-ink-400">Format7.</span>
            </h1>
            <p className="lead mt-6 text-ink-600">
              Авторизуйтесь, чтобы отслеживать статус заказов, сохранять макеты
              в&nbsp;конструкторе и&nbsp;быстрее оформлять повторные тиражи.
            </p>
            <p className="mt-6 text-[13px] text-ink-500">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-ink-900 font-medium hover:text-brand transition-colors">
                Зарегистрироваться →
              </Link>
            </p>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="card p-8 sm:p-10 max-w-[480px] lg:ml-auto">
              <h2 className="eyebrow mb-6">Учётные данные</h2>

              {error && (
                <div
                  role="alert"
                  className="mb-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md px-4 py-2.5"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[12px] font-medium text-ink-700 mb-1.5"
                  >
                    Электронная почта
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-[12px] font-medium text-ink-700 mb-1.5"
                  >
                    Пароль
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <Turnstile onVerify={setCaptcha} />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Входим…" : "Войти"}
                </button>
                <p className="text-center text-[12px] text-ink-500 pt-1">
                  <Link href="/forgot-password" className="underline hover:text-ink-900 transition-colors">
                    Забыли пароль?
                  </Link>
                </p>
              </form>

              <p className="mt-6 pt-5 border-t border-ink-200 text-[13px] text-ink-500 text-center">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-ink-900 font-medium hover:text-brand transition-colors">
                  Регистрация
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
