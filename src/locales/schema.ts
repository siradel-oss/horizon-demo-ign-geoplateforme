import enLocale from "./en.json";

export type MessageSchema = typeof enLocale;

export type NumberSchema = {
    decimal: Intl.NumberFormatOptions;
};

export type DatetimeSchema = {
    dateonly: Intl.DateTimeFormatOptions;
    timeonly: Intl.DateTimeFormatOptions;
};
