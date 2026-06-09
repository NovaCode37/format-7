"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function WishlistButton({ serviceId, className = "" }: { serviceId: number; className?: string }) {
  const { token } = useAuth();
  const [in_, setIn] = useState<{ id: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const ensureLoaded = async () => {
    if (loaded || !token) return;
    try {
      const list = await api.wishlistList(token);
      const hit = list.find(i => i.service_id === serviceId);
      setIn(hit ? { id: hit.id } : null);
    } catch {  }
    setLoaded(true);
  };

  useEffect(() => { setLoaded(false); setIn(null); }, [token, serviceId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    try {
      await ensureLoaded();
      if (in_) {
        await api.wishlistRemove(token, in_.id);
        setIn(null);
      } else {
        const res = await api.wishlistAdd(token, serviceId);
        setIn({ id: res.id });
      }
    } finally { setBusy(false); }
  };

  return (
    <button
      onClick={toggle}
      onMouseEnter={ensureLoaded}
      disabled={busy}
      title={in_ ? "Убрать из избранного" : "В избранное"}
      className={`p-1.5 rounded-md text-ink-400 hover:text-red-500 transition-colors cursor-pointer ${className}`}
      aria-pressed={!!in_}
      aria-label={in_ ? "Убрать из избранного" : "Добавить в избранное"}
    >
      <Heart
        size={16}
        strokeWidth={1.75}
        className={in_ ? "fill-red-500 text-red-500" : ""}
      />
    </button>
  );
}
