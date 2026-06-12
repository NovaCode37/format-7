"use client";

import { useEffect, useState } from "react";
import { api, type Review } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Star } from "@/lib/icons";

export default function ReviewsPage() {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getReviews().then(setReviews).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSending(true);
    try {
      const review = await api.createReview({ author_name: name, rating, text }, token || undefined);
      setReviews([review, ...reviews]);
      setText("");
      setMsg("Отзыв отправлен!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err.message || "Ошибка");
    } finally {
      setSending(false);
    }
  };

  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="bg-white">

      <section className="border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow mb-4">Отзывы клиентов</p>
              <h1 className="h-display">
                Что говорят о&nbsp;нас
                <br />
                <span className="text-ink-400">реальные заказчики.</span>
              </h1>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <dl className="grid grid-cols-2 divide-x divide-ink-200 border-t border-ink-200">
                <div className="py-5 pr-4">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    Средняя оценка
                  </dt>
                  <dd className="mt-2 font-heading text-3xl font-semibold text-ink-900 tabular">
                    {avg}
                    <span className="text-ink-400"> / 5</span>
                  </dd>
                </div>
                <div className="py-5 pl-4">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    Всего отзывов
                  </dt>
                  <dd className="mt-2 font-heading text-3xl font-semibold text-ink-900 tabular">
                    {reviews.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-14 sm:py-20 grid grid-cols-12 gap-x-6 gap-y-10">

        <aside className="col-span-12 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
            <h2 className="eyebrow mb-5">Оставить отзыв</h2>
            {msg && (
              <p
                role="status"
                className="mb-4 text-[13px] text-ink-700 bg-ink-50 border border-ink-200 rounded-md px-3 py-2"
              >
                {msg}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="rev-name" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                  Имя
                </label>
                <input
                  id="rev-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <span className="block text-[12px] font-medium text-ink-700 mb-1.5">
                  Оценка
                </span>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Оценка">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={v === rating}
                      aria-label={`${v} из 5`}
                      onClick={() => setRating(v)}
                      className="p-1 -m-1 transition-colors"
                    >
                      <Star
                        size={22}
                        strokeWidth={2}
                        className={v <= rating ? "text-ink-900" : "text-ink-300"}
                        fill={v <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="rev-text" className="block text-[12px] font-medium text-ink-700 mb-1.5">
                  Текст отзыва
                </label>
                <textarea
                  id="rev-text"
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="input h-auto py-2.5 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "Отправляем…" : "Отправить отзыв"}
              </button>
            </div>
          </form>
        </aside>

        <div className="col-span-12 lg:col-span-7">
          {reviews.length === 0 ? (
            <div className="card p-10 text-center text-ink-500 text-sm">
              Пока нет отзывов. Будьте первым, кто оставит впечатление.
            </div>
          ) : (
            <ul className="border-t border-ink-200">
              {reviews.map((r) => (
                <li key={r.id} className="py-6 border-b border-ink-200">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden="true"
                        className="grid place-items-center w-9 h-9 rounded-full bg-ink-100 text-ink-700 text-sm font-semibold uppercase shrink-0"
                      >
                        {r.author_name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-900 truncate">
                          {r.author_name}
                        </div>
                        <div className="text-[12px] text-ink-500 tabular">
                          {new Date(r.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5" aria-label={`Оценка ${r.rating} из 5`}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star
                          key={v}
                          size={14}
                          strokeWidth={2}
                          className={v <= r.rating ? "text-ink-900" : "text-ink-300"}
                          fill={v <= r.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-ink-700 leading-relaxed">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
