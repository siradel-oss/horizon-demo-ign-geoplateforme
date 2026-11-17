import { createApp } from "vue";
import App from "./App.vue";
import { createI18n } from "vue-i18n";
import { initialLocale } from "./service/locale";

const locale = initialLocale();

import frLocale from "./locales/fr.json";
import enLocale from "./locales/en.json";
import type { DatetimeSchema, MessageSchema, NumberSchema } from "./locales/schema";

const EN_DATETIME_FORMATS: DatetimeSchema = {
    dateonly: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    },
    timeonly: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    },
};

const FR_DATETIME_FORMATS: DatetimeSchema = {
    dateonly: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    },
    timeonly: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    },
};

const EN_NUMBER_FORMATS: NumberSchema = {
    decimal: {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    },
};

const FR_NUMBER_FORMATS: NumberSchema = {
    decimal: {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    },
};

const i18n = createI18n<{ message: MessageSchema; datetimeFormats: DatetimeSchema }, "en" | "fr">({
    legacy: false,
    locale,
    fallbackLocale: "en",
    messages: {
        en: enLocale,
        fr: frLocale,
    },
    numberFormats: {
        en: EN_NUMBER_FORMATS,
        fr: FR_NUMBER_FORMATS,
    },
    datetimeFormats: {
        en: EN_DATETIME_FORMATS,
        fr: FR_DATETIME_FORMATS,
    },
});

document.documentElement.lang = locale;

createApp(App).use(i18n).mount("#app");
