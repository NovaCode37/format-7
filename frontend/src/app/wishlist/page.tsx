"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Trash2 } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { api, type Service } from "@/lib/api";

type Item = { id: number; service_id: number; service: Service; created_at: string };

export default function WishlistPage() {
  const { token, addToCart } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    api.wishlistList(token)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router]);

  const remove = async (id: number) => {
    if (!token) return;
    await api.wishlistRemove(token, id);
    setItems(items.filter(i => i.id !== id));
  };

  const moveToCart = async (item: Item) => {
    await addToCart(item.service_id);
    await remove(item.id);
  };

  if (loading) return <div className="py-20 text-center text-ink-400">Загрузка…</div>;

  return (
    <div className="bg-white min-h-[60vh]">
      <section className="border-b border-ink-200">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow mb-3">Избранное</p>
          <h1 className="h-display flex items-center gap-3">
            <Heart size={28} strokeWidth={2} className="text-red-500 fill-red-500" />
            Список желаемого
          </h1>
        </div>
      </section>

      <section className="container-page py-14">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-500 mb-4">В избранном пока пусто.</p>
            <Link href="/prices" className="btn">Перейти к каталогу</Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink-200 border-y border-ink-200">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-4 py-5">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/services/${item.service.slug}`}
                    className="font-heading text-[15px] font-semibold hover:text-brand transition-colors"
                  >
                    {item.service.name}
                  </Link>
                  {item.service.description && (
                    <p className="text-[13px] text-ink-500 line-clamp-1 mt-0.5">
                      {item.service.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => moveToCart(item)}
                  className="btn btn-sm cursor-pointer"
                  title="В корзину"
                >
                  <ShoppingCart size={14} strokeWidth={2} /> В&nbsp;корзину
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="text-ink-400 hover:text-red-600 p-2 cursor-pointer transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
