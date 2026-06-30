// Контакты и реквизиты сайта. Дефолты — текущие значения; админка их переопределяет.

export interface SiteSettings {
  phone: string;
  phoneHref: string;
  email: string;
  maxLink: string;
  address: string;
  hoursWeekday: string;
  hoursSaturday: string;
  legalName: string;
  inn: string;
  ogrnip: string;
}

export const SITE_DEFAULTS: SiteSettings = {
  phone: "+7 932 475-95-11",
  phoneHref: "+79324759511",
  email: "Format7-tmn@yandex.ru",
  maxLink: "https://max.ru/u/f9LHodD0cOL5K_y_ohndrIuQqxgsgd1UTeFnK4VSa5Swa303MHSbSyCAxRE",
  address: "г. Тюмень, ул. Широтная, д. 113, к1 стр1, офис 7",
  hoursWeekday: "Пн–Пт 9:00–13:00, 14:00–17:00",
  hoursSaturday: "Сб, Вс — выходной",
  legalName: "ИП Голубев Александр Александрович",
  inn: "720319019022",
  ogrnip: "322723200035243",
};

export const SETTINGS_LABELS: Record<keyof SiteSettings, string> = {
  phone: "Телефон (как показывать)",
  phoneHref: "Телефон для звонка (только цифры, +7…)",
  email: "Email",
  maxLink: "Ссылка на MAX",
  address: "Адрес",
  hoursWeekday: "Часы — будни",
  hoursSaturday: "Выходные дни",
  legalName: "Юр. наименование (ИП …)",
  inn: "ИНН",
  ogrnip: "ОГРНИП",
};
