"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2, Star, Plus } from "@/lib/icons";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

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

  useEffect(() => {
    api.addressesList(token).then(setAddresses).catch(() => {});
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

  return (
    <section className="container-page py-14 sm:py-20 border-t border-ink-200">
      <p className="eyebrow mb-3">Настройки</p>
      <h2 className="h-section mb-10">Адреса доставки</h2>

      <div className="max-w-2xl">
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
                <MapPin size={14} strokeWidth={2} className="text-ink-400 shrink-0" />
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
                    <Star size={14} strokeWidth={2} />
                  </button>
                )}
                <button
                  onClick={() => removeAddress(a.id)}
                  className="text-ink-400 hover:text-red-600 transition-colors p-1.5 cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={2} />
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
            <Plus size={14} strokeWidth={2} /> Добавить
          </button>
        </form>
      </div>
    </section>
  );
}
