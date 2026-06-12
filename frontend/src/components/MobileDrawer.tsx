"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, User, LogOut, Heart, PenTool, Copy, ScanLine, Layers, BookOpen } from "@/lib/icons";
import { useAuth } from "@/lib/auth-context";

type NavItem = { href: string; label: string; icon?: React.ComponentType<any> };

interface Props {
  open: boolean;
  onClose: () => void;
  links: NavItem[];
}

export default function MobileDrawer({ open, onClose, links }: Props) {
  const { user, cartCount, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-ink-900/40 backdrop-blur-[2px] lg:hidden"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[min(360px,90vw)] z-[90] bg-white border-l border-ink-200 lg:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-ink-200 shrink-0">
              <span className="font-heading text-[15px] font-semibold tracking-tight text-ink-900">
                Меню
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть меню"
                className="h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 cursor-pointer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3" aria-label="Главное меню (мобильное)">
              <ul className="px-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 px-3 h-12 rounded-md text-[15px] text-ink-900 hover:bg-ink-100 transition-colors"
                    >
                      {l.icon && <l.icon size={16} strokeWidth={2} className="text-ink-500" />}
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-3 border-t border-ink-200" />

              <ul className="px-2">
                {user ? (
                  <>
                    {user.is_admin && (
                      <li>
                        <Link
                          href="/admin"
                          onClick={onClose}
                          className="flex items-center px-3 h-11 rounded-md text-[14px] text-amber-700 font-medium hover:bg-amber-50 transition-colors"
                        >
                          Админка
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        href="/profile"
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 h-11 rounded-md text-[14px] text-ink-900 hover:bg-ink-100 transition-colors"
                      >
                        <User size={16} strokeWidth={2} className="text-ink-500" />
                        <span className="flex-1 truncate">{user.name}</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/wishlist"
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 h-11 rounded-md text-[14px] text-ink-900 hover:bg-ink-100 transition-colors"
                      >
                        <Heart size={16} strokeWidth={2} className="text-ink-500" />
                        Избранное
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { logout(); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 h-11 rounded-md text-[14px] text-ink-700 hover:bg-ink-100 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} strokeWidth={2} className="text-ink-500" />
                        Выйти
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      href="/login"
                      onClick={onClose}
                      className="flex items-center px-3 h-11 rounded-md text-[14px] text-ink-900 font-medium hover:bg-ink-100 transition-colors"
                    >
                      Вход / Регистрация
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="p-4 border-t border-ink-200 shrink-0">
              <Link
                href="/cart"
                onClick={onClose}
                className="btn-primary w-full justify-center"
              >
                <ShoppingCart size={15} strokeWidth={2} />
                Корзина
                {cartCount > 0 && (
                  <span className="tabular text-white/85">· {cartCount}</span>
                )}
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
