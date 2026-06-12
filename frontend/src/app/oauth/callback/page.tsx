"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function OAuthCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { setToken, refresh } = useAuth();

  useEffect(() => {
    (async () => {
      let token = params.get("token") || "";
      if (!token) {
        const code = params.get("code") || "";
        if (!code) {
          router.replace("/login?oauth_error=missing_token");
          return;
        }
        try {
          const out = await api.exchangeOAuthCode(code);
          token = out.access_token || "";
        } catch {
          router.replace("/login?oauth_error=exchange_failed");
          return;
        }
      }
      if (!token) {
        router.replace("/login?oauth_error=missing_token");
        return;
      }
      setToken(token);
      if (refresh) await refresh();
      router.replace("/");
    })();
  }, [params, setToken, refresh, router]);

  return (
    <div className="bg-white min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-ink-400 mx-auto mb-3" size={24} />
        <p className="text-ink-500 text-sm">Завершаем вход…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-400">Загрузка…</div>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
