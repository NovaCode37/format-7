"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, MapPin, Trash2, Star, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  getPushStatus,
  subscribePush,
  unsubscribePush,
  type PushStatus,
} from "@/lib/push";

type Address = {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
};

export default function ProfileSettings({ token }: { token: string }) {
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);

  const [pushStatus, setPushStatus] = useState<PushStatus>("unsupported");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    api.addressesList(token).then(setAddresses).catch(() => {});
    getPushStatus().then(setPushStatus);
  }, [token]);

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    setAdding(true);
    try {
      await api.addressesAdd(token, {
        label: newLabel.trim(),
        address: newAddress.trim(),
        is_default: addresses.length === 0,
      });
      const list = await api.addressesList(token);
      setAddresses(list);
      setNewLabel(""); setNewAddress("");
    } catch (err: any) {
      toast.error(err.message || "Не удалось сохранить");
    } finally { setAdding(false); }
  };

  const removeAddress = async (id: number) => {
    if (!confirm("Удалить адрес?")) return;
    await api.addressesRemove(token, id);
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const setDefault = async (id: number) => {
    await api.addressesSetDefault(token, id);
    const list = await api.addressesList(token);
    setAddresses(list);
  };

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushStatus === "subscribed") {
        await unsubscribePush(token);
      } else {
        const ok = await subscribePush(token);
        if (!ok) {
          toast.error("Не удалось включить уведомления. Проверьте, что разрешение не заблокировано в настройках браузера.");
        }
      }
      setPushStatus(await getPushStatus());
    } finally { setPushBusy(false); }
  };

  return (
    <section className="container-page py-14 sm:py-20 border-t border-ink-200">
      <p className="eyebrow mb-3">Настройки</p>
      <h2 className="h-section mb-10">Уведомления и адреса доставки</h2>

      <div className="grid grid-cols-12 gap-x-6 gap-y-10">

        <div className="col-span-12 lg:col-span-5">
          <h3 className="text-[15px] font-semibold mb-3">Push-уведомления</h3>
          <p className="text-[13px] text-ink-600 mb-5">
            Получайте мгновенные уведомления о статусе заказа прямо в браузере —
            без email и&nbsp;спама.
          </p>

          {pushStatus === "unsupported" && (
            <p className="text-[13px] text-ink-400">
              Ваш браузер не поддерживает push-уведомления.
            </p>
          )}
          {pushStatus === "denied" && (
            <p className="text-[13px] text-amber-700 border border-amber-200 bg-amber-50 rounded-md px-3 py-2">
              Уведомления заблокированы в&nbsp;настройках браузера.
              Разблокируйте их в иконке замка слева от адресной строки.
            </p>
          )}
          {(pushStatus === "subscribed" || pushStatus === "unsubscribed") && (
            <button
              onClick={togglePush}
              disabled={pushBusy}
              className="btn btn-sm cursor-pointer disabled:opacity-60"
            >
              {pushStatus === "subscribed" ? (
                <><BellOff size={14} strokeWidth={1.75} /> Отключить</>
              ) : (
                <><Bell size={14} strokeWidth={1.75} /> Включить уведомления</>
              )}
            </button>
          )}
        </div>

        <div className="col-span-12 lg:col-span-7">
          <h3 className="text-[15px] font-semibold mb-3">Сохранённые адреса</h3>
          <p className="text-[13px] text-ink-600 mb-5">
            Сохраните любимые адреса — выбирайте их одним кликом при оформлении заказа.
          </p>

          {addresses.length > 0 && (
            <ul className="space-y-2 mb-5">
              {addresses.map(a => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 border border-ink-200 rounded-md px-4 py-2.5"
                >
                  <MapPin size={14} strokeWidth={1.5} className="text-ink-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {a.label && (
                        <span className="text-[12px] font-semibold text-ink-900">{a.label}</span>
                      )}
                      {a.is_default && (
                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                          по умолчанию
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-ink-700 truncate">{a.address}</p>
                  </div>
                  {!a.is_default && (
                    <button
                      onClick={() => setDefault(a.id)}
                      title="Сделать адресом по умолчанию"
                      className="text-ink-400 hover:text-amber-500 transition-colors p-1.5 cursor-pointer"
                    >
                      <Star size={14} strokeWidth={1.75} />
                    </button>
                  )}
                  <button
                    onClick={() => removeAddress(a.id)}
                    className="text-ink-400 hover:text-red-600 transition-colors p-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addAddress} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Название (Дом, Офис)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="col-span-4 border border-ink-200 rounded-md px-3 py-2 text-sm"
              maxLength={50}
            />
            <input
              type="text"
              required
              placeholder="г. Тюмень, ул. ..."
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              className="col-span-6 border border-ink-200 rounded-md px-3 py-2 text-sm"
              maxLength={500}
            />
            <button type="submit" disabled={adding} className="col-span-2 btn btn-sm justify-center disabled:opacity-60">
              <Plus size={14} strokeWidth={1.75} /> Добавить
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
