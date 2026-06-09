"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Order } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, KeyRound, X, FileDown, XCircle, ChevronDown, Save, LogOut, Heart } from "lucide-react";
import ProfileSettings from "@/components/ProfileSettings";
import { useToast } from "@/components/Toast";

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  ready: "Готов",
  completed: "Выполнен",
  cancelled: "Отменён",
};

const STATUS_DOTS: Record<string, string> = {
  new:        "bg-brand",
  processing: "bg-amber-500",
  ready:      "bg-emerald-600",
  completed:  "bg-emerald-600",
  cancelled:  "bg-ink-400",
};

export default function ProfilePage() {
  const { user, token, logout, refresh, setToken } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eSaving, setESaving] = useState(false);
  const [eError, setEError] = useState("");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdCur, setPwdCur] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNew2, setPwdNew2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  const loadOrders = () => {
    if (!token) return;
    api.getMyOrders(token).then(setOrders).catch(() => {});
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    loadOrders();
  }, [token, router]);

  useEffect(() => {
    if (user) { setEName(user.name); setEPhone(user.phone || ""); }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!token) return;
    setESaving(true); setEError("");
    try {
      await api.updateProfile(token, { name: eName, phone: ePhone });
      if (refresh) await refresh();
      setEditOpen(false);
    } catch (err: any) {
      setEError(err.message || "Ошибка");
    } finally { setESaving(false); }
  };

  const handleChangePwd = async () => {
    if (!token) return;
    if (pwdNew !== pwdNew2) { setPwdMsg("Пароли не совпадают"); return; }
    if (pwdNew.length < 8) { setPwdMsg("Минимум 8 символов"); return; }
    setPwdSaving(true); setPwdMsg("");
    try {
      const res = await api.changePassword(token, pwdCur, pwdNew);

      if (res.access_token) setToken(res.access_token);
      setPwdMsg("Пароль изменён");
      setPwdCur(""); setPwdNew(""); setPwdNew2("");
      setTimeout(() => { setPwdOpen(false); setPwdMsg(""); }, 1200);
    } catch (err: any) {
      setPwdMsg(err.message || "Ошибка");
    } finally { setPwdSaving(false); }
  };

  const handleCancelOrder = async (orderNumber: string) => {
    if (!token) return;
    if (!confirm(`Отменить заказ ${orderNumber}?`)) return;
    try {
      await api.cancelOrder(token, orderNumber);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Не удалось отменить");
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white">

      <section className="border-b border-ink-200">
        <div className="container-page py-14 sm:py-20">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-start">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow mb-4">Личный кабинет</p>
              <h1 className="h-display">
                {user.name}
              </h1>
              <p className="mt-4 text-ink-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
              {user.email_verified === false && (
                <div className="mt-4 border border-amber-200 bg-amber-50 rounded-md px-4 py-3 text-[13px] text-amber-900 flex items-start gap-3">
                  <span>⚠</span>
                  <div className="flex-1">
                    Email не подтверждён. Мы отправили письмо при регистрации —
                    проверьте «Входящие» и&nbsp;«Спам».{" "}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token) return;
                        try { await api.resendVerification(token); toast.success("Письмо отправлено — проверьте «Спам»"); }
                        catch (err: any) { toast.error(err.message || "Ошибка отправки"); }
                      }}
                      className="underline hover:text-amber-950 cursor-pointer"
                    >
                      Отправить ещё раз
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-wrap items-start gap-2 lg:justify-end">
              <Link href="/wishlist" className="btn btn-sm">
                <Heart size={13} strokeWidth={1.75} />
                Избранное
              </Link>
              <button
                onClick={() => setEditOpen(true)}
                className="btn btn-sm"
              >
                <Pencil size={13} strokeWidth={1.75} />
                Изменить
              </button>
              <button
                onClick={() => setPwdOpen(true)}
                className="btn btn-sm"
              >
                <KeyRound size={13} strokeWidth={1.75} />
                Пароль
              </button>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="btn btn-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut size={13} strokeWidth={1.75} />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="h-section">Мои заказы</h2>
          <span className="text-[12px] text-ink-500 tabular">{orders.length} шт.</span>
        </div>

        {orders.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-ink-500 mb-4">У вас пока нет заказов.</p>
            <Link href="/calculator" className="text-sm font-medium text-ink-900 hover:text-brand transition-colors">
              Оформить заказ →
            </Link>
          </div>
        ) : (
          <div className="border border-ink-200 rounded-md overflow-hidden divide-y divide-ink-200">
            {orders.map((o) => {
              const expanded = expandedId === o.id;
              const canCancel = o.status === "new" || o.status === "processing";
              return (
                <div key={o.id} className="bg-white">
                  <button
                    onClick={() => setExpandedId(expanded ? null : o.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ink-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-heading text-sm font-semibold text-ink-900 tabular">
                        {o.order_number}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-700">
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[o.status] || "bg-ink-400"}`}
                        />
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                      <span className="text-[12px] text-ink-500 tabular">
                        {new Date(o.created_at).toLocaleString("ru-RU")}
                      </span>
                      {o.total > 0 && (
                        <span className="text-sm font-medium text-ink-900 tabular ml-auto">
                          {o.total.toLocaleString("ru-RU")}&nbsp;₽
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.75}
                      className={`text-ink-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {expanded && (
                    <div className="border-t border-ink-100 px-5 py-4 bg-ink-50 space-y-4">

                      <ul className="divide-y divide-ink-200 border border-ink-200 rounded-md overflow-hidden">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between text-[13px] bg-white px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-ink-900">{it.service.name}</p>
                              {it.options && (() => {
                                try {
                                  const opts = typeof it.options === "string" ? JSON.parse(it.options) : it.options;
                                  if (opts && typeof opts === "object" && Object.keys(opts).length > 0) {
                                    return (
                                      <p className="text-[11px] text-ink-500 mt-0.5">
                                        {Object.entries(opts).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                      </p>
                                    );
                                  }
                                } catch {}
                                return null;
                              })()}
                            </div>
                            <div className="text-right shrink-0 tabular">
                              <p className="font-medium text-ink-900">×{it.quantity}</p>
                              {it.price > 0 && <p className="text-[11px] text-ink-500">{it.price}&nbsp;₽/шт</p>}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {(o.delivery_type || o.delivery_address) && (
                        <div className="text-[13px] text-ink-700 bg-white border border-ink-200 rounded-md px-4 py-3">
                          <span className="font-medium text-ink-900">
                            {o.delivery_type === "delivery" ? "Доставка" : "Самовывоз"}:{" "}
                          </span>
                          {o.delivery_address || "в офисе"}
                        </div>
                      )}

                      {o.files && o.files.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="eyebrow">Файлы</p>
                          {o.files.map((f) => (
                            <a
                              key={f.id}
                              href={api.getFileUrl(f.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2.5 text-[13px] bg-white border border-ink-200 rounded-md px-4 py-2.5 hover:border-ink-400 hover:text-brand transition-colors"
                            >
                              <FileDown size={14} strokeWidth={1.75} className="text-ink-500 shrink-0" />
                              <span className="truncate flex-1">{f.original_name}</span>
                              <span className="text-[11px] text-ink-400 tabular shrink-0">{(f.size / 1024).toFixed(1)}&nbsp;КБ</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {o.comment && (
                        <div className="bg-white border border-ink-200 rounded-md px-4 py-3">
                          <p className="eyebrow mb-1.5">Комментарий</p>
                          <p className="text-[13px] text-ink-700">{o.comment}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={async () => {
                            if (!token) return;
                            try {
                              const r = await api.repeatOrder(token, o.order_number);
                              toast.success(`Добавлено в корзину: ${r.added} ${r.added === 1 ? "позиция" : "позиций"}`);
                            } catch (err: any) {
                              toast.error(err.message || "Не удалось повторить заказ");
                            }
                          }}
                          className="btn btn-sm"
                        >
                          Повторить заказ
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(o.order_number)}
                            className="btn btn-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <XCircle size={13} strokeWidth={1.75} />
                            Отменить заказ
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {token && <ProfileSettings token={token} />}

      {editOpen && (
        <Modal title="Редактировать профиль" onClose={() => setEditOpen(false)}>
          <Field label="Имя">
            <input value={eName} onChange={(e) => setEName(e.target.value)} className="input" />
          </Field>
          <Field label="Телефон">
            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="+7 ..." className="input tabular" />
          </Field>
          {eError && <p className="text-[13px] text-red-600">{eError}</p>}
          <button onClick={handleSaveProfile} disabled={eSaving} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            <Save size={14} strokeWidth={1.75} />
            {eSaving ? "Сохраняем…" : "Сохранить"}
          </button>
        </Modal>
      )}

      {pwdOpen && (
        <Modal title="Сменить пароль" onClose={() => setPwdOpen(false)}>
          <Field label="Текущий пароль">
            <input type="password" value={pwdCur} onChange={(e) => setPwdCur(e.target.value)} className="input" />
          </Field>
          <Field label="Новый пароль">
            <input type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} className="input" />
          </Field>
          <Field label="Повторите новый пароль">
            <input type="password" value={pwdNew2} onChange={(e) => setPwdNew2(e.target.value)} className="input" />
          </Field>
          {pwdMsg && (
            <p className={`text-[13px] ${pwdMsg === "Пароль изменён" ? "text-emerald-600" : "text-red-600"}`}>
              {pwdMsg}
            </p>
          )}
          <button onClick={handleChangePwd} disabled={pwdSaving} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            <Save size={14} strokeWidth={1.75} />
            {pwdSaving ? "Сохраняем…" : "Сменить пароль"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-ink-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50" onClick={onClose}>
      <div
        className="bg-white rounded-md border border-ink-200 shadow-lg w-full max-w-md p-6 sm:p-8 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-lg font-semibold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
