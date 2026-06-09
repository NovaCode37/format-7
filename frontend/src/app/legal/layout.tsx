import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/legal/offer",   label: "Публичная оферта" },
  { href: "/legal/privacy", label: "Политика обработки ПДн" },
  { href: "/legal/cookies", label: "Политика cookies" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white">
      <section className="border-b border-ink-200">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow mb-3">Юридическая информация</p>
          <h1 className="h-display">Документы</h1>
          <nav className="mt-6 flex flex-wrap gap-2">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] px-3 py-1.5 rounded-md border border-ink-200 hover:bg-ink-100 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <article className="container-page py-10 sm:py-14 max-w-3xl prose prose-neutral prose-sm sm:prose-base prose-headings:font-heading prose-headings:text-ink-900 prose-a:text-brand">
        {children}
      </article>
    </div>
  );
}
