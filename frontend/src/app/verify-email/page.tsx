"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "@/lib/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { refresh } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMsg("Ссылка недействительна"); return; }
    api.verifyEmail(token)
      .then(async () => {
        setState("ok");
        if (refresh) await refresh();
      })
      .catch(err => {
        setState("error");
        setMsg(err?.message || "Не удалось подтвердить email");
      });
  }, [token, refresh]);

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="container-page max-w-md mx-auto py-20 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-ink-400" size={32} />
            <p className="text-ink-500">Подтверждаем email…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={48} strokeWidth={2} />
            <h1 className="h-section mb-3">Email подтверждён</h1>
            <p className="text-ink-600 mb-6">Спасибо! Теперь вы получаете уведомления о заказах.</p>
            <Link href="/profile" className="btn-primary">Мои заказы</Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto mb-4 text-red-600" size={48} strokeWidth={2} />
            <h1 className="h-section mb-3">Не удалось подтвердить</h1>
            <p className="text-ink-600 mb-6">{msg}</p>
            <Link href="/profile" className="btn-secondary">В профиль</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-400">Загрузка…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
