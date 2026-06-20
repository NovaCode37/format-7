"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, ShoppingCart, User, LogOut, Heart, Menu,
  FileText, Camera, Printer, LayoutGrid,
} from "@/lib/icons";
import MobileDrawer from "./MobileDrawer";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSiteSettings } from "@/lib/siteSettings";
import { api, type Service } from "@/lib/api";
import { searchCatalog, type CatalogIndexItem } from "@/lib/catalogIndex";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/catalog", label: "Каталог", icon: LayoutGrid },
  { href: "/services/копирование-и-печать-документов", label: "Печать документов", icon: FileText },
  { href: "/services/печать-фотографий", label: "Печать фото", icon: Camera },
  { href: "/services/оперативная-полиграфия", label: "Полиграфия", icon: Printer },
];

export default function Header() {
  const { user, cartCount, logout } = useAuth();
  const site = useSiteSettings();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogIndexItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const local = searchCatalog(query);
    setResults(local);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      api.search(query)
        .then((apiList: Service[]) => {
          if (!apiList?.length) return;
          setResults((prev) => {
            const haveSlugs = new Set(prev.map((p) => p.slug));
            const extras: CatalogIndexItem[] = apiList
              .filter((s) => !haveSlugs.has(s.slug))
              .map((s) => ({
                title: s.name,
                slug: s.slug,
                image: "",
                from: "",
                group: "Сервис",
              }));
            return [...prev, ...extras].slice(0, 10);
          });
        })
        .catch(() => {});
    }, 300);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 border-b ${
        scrolled
          ? "surface-header border-ink-200 shadow-soft"
          : "bg-white border-transparent"
      }`}
    >
      <div className="container-page h-16 flex items-center gap-3 sm:gap-5">

        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="Format7 — на главную"
        >
          <img
            src="/logo.png"
            alt="Формат7"
            className="h-9 w-auto"
          />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="font-heading text-[15px] font-bold text-ink-900 leading-none">
              Формат7
            </span>
            <span className="text-[10px] text-ink-400 uppercase tracking-[0.1em] mt-0.5">
              Онлайн-типография
            </span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 text-[13px] font-bold ml-2" aria-label="Главное меню">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 h-9 inline-flex items-center gap-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
            >
              {"icon" in l && l.icon && <l.icon size={14} strokeWidth={2} />}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block flex-1 min-w-[200px] max-w-[340px] relative ml-auto" ref={wrapperRef}>
          <Search
            size={15}
            strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Поиск услуг..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            aria-label="Поиск"
            className="input pl-10 pr-3 h-10 text-[13px] rounded-xl bg-ink-50 border-ink-100 focus:bg-white focus:border-ink-300"
          />
          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-ink-100 rounded-2xl shadow-elev max-h-[320px] overflow-y-auto p-1.5"
              >
                {results.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${encodeURIComponent(s.slug)}`}
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
                  >
                    {s.image ? (
                      <span
                        aria-hidden="true"
                        className="relative w-9 h-9 shrink-0 overflow-hidden rounded-lg bg-ink-100"
                      >
                        <img
                          src={s.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="w-9 h-9 shrink-0 grid place-items-center rounded-lg bg-ink-50 text-ink-500 text-xs font-semibold uppercase"
                      >
                        {s.title.charAt(0)}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-ink-900 truncate">
                        {s.title}
                      </span>
                      <span className="block text-[11px] text-ink-500 truncate">
                        {s.group}{s.from ? ` · ${s.from}` : ""}
                      </span>
                    </span>
                  </Link>
                ))}
              </motion.div>
            )}
            {showResults && query.length >= 2 && results.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-ink-100 rounded-2xl shadow-elev px-4 py-3 text-sm text-ink-500"
              >
                Ничего не найдено
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 text-sm ml-auto md:ml-0">
          <a
            href={site.maxLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Написать в MAX"
            aria-label="Написать в MAX"
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-ink-50 transition-colors"
          >
            <img src="/max-icon.png" alt="MAX" className="w-5 h-5 rounded-[5px]" />
          </a>
          {user ? (
            <>
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="h-9 px-3 inline-flex items-center rounded-lg text-amber-700 font-medium hover:bg-amber-50 transition-colors"
                >
                  Админка
                </Link>
              )}
              <Link
                href="/wishlist"
                title="Избранное"
                aria-label="Избранное"
                className="h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:text-red-500 hover:bg-ink-50 transition-colors"
              >
                <Heart size={15} strokeWidth={2} />
              </Link>
              <Link
                href="/profile"
                title={user.name}
                aria-label="Профиль"
                className="h-9 w-9 grid place-items-center rounded-lg text-ink-900 hover:bg-ink-50 transition-colors"
              >
                <User size={15} strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Выйти"
                aria-label="Выйти"
                className="h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} strokeWidth={2} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-ink-600 font-medium hover:bg-ink-50 transition-colors"
            >
              <User size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Вход</span>
            </Link>
          )}
          <Link
            href="/cart"
            className="ml-1 btn btn-sm bg-ink-900 text-white border-ink-900 hover:bg-ink-800 hover:border-ink-800"
            aria-label="Корзина"
          >
            <ShoppingCart size={15} strokeWidth={2} />
            <span className="hidden sm:inline">
              Корзина
              {cartCount > 0 && (
                <span className="ml-1 tabular text-white/80">· {cartCount}</span>
              )}
            </span>
            {cartCount > 0 && (
              <span className="sm:hidden tabular text-white/80">{cartCount}</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Открыть меню"
            className="xl:hidden h-9 w-9 grid place-items-center rounded-lg text-ink-700 hover:bg-ink-50 transition-colors cursor-pointer ml-1"
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={NAV_LINKS} />
    </header>
  );
}
