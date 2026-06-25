import { SERVICE_FAQ } from "@/lib/serviceFaq";
import { ChevronDown } from "@/lib/icons";

// Видимый блок «Частые вопросы». Контент совпадает с микроразметкой FAQPage
// (см. серверный layout услуги), чтобы соответствовать правилам поисковиков.
export default function ServiceFaq() {
  return (
    <section className="container-page py-14 sm:py-20">
      <h2 className="h-section mb-8">Частые вопросы</h2>
      <div className="max-w-3xl divide-y divide-ink-200 border-y border-ink-200">
        {SERVICE_FAQ.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 list-none text-[15px] sm:text-base font-semibold text-ink-900">
              {item.q}
              <ChevronDown
                size={18}
                strokeWidth={2}
                className="shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm sm:text-[15px] text-ink-600 leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
