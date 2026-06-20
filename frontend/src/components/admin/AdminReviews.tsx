"use client";

import { useEffect, useState } from "react";
import { api, type Review } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Trash2, Loader2, Star } from "@/lib/icons";

export default function AdminReviews({ token }: { token: string }) {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setReviews(await api.adminListReviews(token));
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const remove = async (r: Review) => {
    if (!confirm("Удалить этот отзыв?")) return;
    try {
      await api.adminDeleteReview(token, r.id);
      toast.success("Отзыв удалён");
      setReviews((list) => list.filter((x) => x.id !== r.id));
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ink-400" size={24} /></div>;
  }

  return (
    <div>
      <p className="text-[13px] text-ink-500 mb-5">{reviews.length} отзывов</p>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border border-ink-200 rounded-md p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-heading text-[14px] font-semibold text-ink-900">{r.author_name}</span>
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} weight={i < r.rating ? "fill" : "regular"} className={i < r.rating ? "text-amber-500" : "text-ink-200"} />
                  ))}
                </span>
                <span className="text-[11px] text-ink-400 tabular">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
              </div>
              <p className="mt-1.5 text-[13px] text-ink-700 whitespace-pre-wrap">{r.text}</p>
            </div>
            <button onClick={() => remove(r)} className="p-1.5 text-ink-400 hover:text-red-600 cursor-pointer shrink-0" title="Удалить"><Trash2 size={15} /></button>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-ink-400 py-10 text-sm">Отзывов пока нет</p>}
      </div>
    </div>
  );
}
