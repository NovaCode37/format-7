"use client";

import Reveal from "./Reveal";

const STEPS = [
  { num: "01", title: "Выберите", desc: "Найдите нужную услугу в каталоге или воспользуйтесь калькулятором." },
  { num: "02", title: "Загрузите", desc: "Прикрепите готовый макет или закажите дизайн у нашего специалиста." },
  { num: "03", title: "Получите", desc: "Заберите заказ в офисе или закажите доставку по Тюмени." },
];

export default function HowItWorks() {
  return (
    <section className="bg-white">
      <div className="container-page py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow mb-2">Как это работает</p>
          <h2 className="h-section max-w-md">Три простых шага</h2>
        </Reveal>

        <div className="mt-10 sm:mt-14 relative">
          <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-ink-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-ink-900 text-white grid place-items-center mb-6 relative z-10">
                    <span className="font-heading text-xl font-bold tabular">{s.num}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-ink-900 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-500 leading-relaxed max-w-xs">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
