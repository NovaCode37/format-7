"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/Turnstile";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const nameParts = name.trim().split(/\s+/).filter((w) => w.length >= 2);
    if (nameParts.length < 2) {
      setError("Укажите имя и фамилию (например: Иван Петров)");
      return;
    }
    setLoading(true);
    try {
      await register(email, name.trim().replace(/\s+/g, " "), password, phone, captcha);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Ошибка регистрации");
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
              Регистрация
              <br />
              <span className="text-ink-400">в&nbsp;Format7.</span>
            </h1>
            <p className="lead mt-6 text-ink-600">
              Создайте аккаунт, чтобы сохранять макеты, отслеживать статусы заказов
              и&nbsp;получать персональные скидки на&nbsp;повторные тиражи.
            </p>
            <ul className="mt-8 space-y-2 text-[13px] text-ink-600">
              <li>— История заказов и&nbsp;повторная печать</li>
              <li>— Сохранение макетов в&nbsp;конструкторе</li>
              <li>— Ранний доступ к&nbsp;акциям</li>
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="card p-8 sm:p-10 max-w-[480px] lg:ml-auto">
              <h2 className="eyebrow mb-6">Данные аккаунта</h2>

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
                  <label htmlFor="reg-name" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                    Имя и фамилия
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Например: Иван Петров"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                    Электронная почта
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                    Телефон <span className="text-ink-400 font-normal">· необязательно</span>
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input tabular"
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                    Пароль <span className="text-ink-400 font-normal">· минимум 8 символов</span>
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                  />
                </div>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                  aria-hidden="true"
                />
                <Turnstile onVerify={setCaptcha} />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Отправляем…" : "Создать аккаунт"}
                </button>
              </form>

              <p className="mt-6 pt-5 border-t border-ink-200 text-[13px] text-ink-500 text-center">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-ink-900 font-medium hover:text-brand transition-colors">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
