// Interface language: ?lang=en|fr, then the stored choice, then the browser language.

export type Locale = "en" | "fr";

const STORAGE_KEY = "horizon-demo-ign-geoplateforme:lang";

export function initialLocale(): Locale {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "fr") return fromUrl;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "fr") return stored;
    } catch {
        // Storage blocked (private mode): fall back to the browser language.
    }
    return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Remember the choice and expose it to assistive technologies. */
export function persistLocale(locale: Locale) {
    document.documentElement.lang = locale;
    try {
        localStorage.setItem(STORAGE_KEY, locale);
    } catch {
        // Not persisted: the choice lasts for this visit only.
    }
}
