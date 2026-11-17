import { useI18n as vueUseI18n } from "vue-i18n";
import type { DatetimeSchema, MessageSchema, NumberSchema } from "@/locales/schema";
import type { Locale } from "./locale";

export function useI18n() {
    return vueUseI18n<
        { message: MessageSchema; datetime: DatetimeSchema; number: NumberSchema },
        Locale
    >();
}
