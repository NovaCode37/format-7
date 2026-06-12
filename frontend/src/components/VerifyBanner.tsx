"use client";

import { useState } from "react";
import { MailWarning, X } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useToast } from "./Toast";

export default function VerifyBanner() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!user || user.email_verified || hidden) return null;

  const resend = async () => {
    if (!token) return;
    setSending(true);
    try {
      await api.resendVerification(token);
      toast.success(`Письмо отправлено на ${user.email}`);
    } catch (e: any) {
      toast.error(e?.message || "Не удалось отправить письмо");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container-page py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-amber-900">
        <MailWarning size={15} className="text-amber-600 shrink-0" />
        <span>
          Подтвердите email — мы отправили письмо на <strong>{user.email}</strong>.
        </span>
        <button
          onClick={resend}
          disabled={sending}
          className="font-semibold underline hover:text-amber-700 disabled:opacity-60 transition-colors"
        >
          {sending ? "Отправляем…" : "Отправить ещё раз"}
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label="Скрыть"
          className="ml-1 text-amber-500 hover:text-amber-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
