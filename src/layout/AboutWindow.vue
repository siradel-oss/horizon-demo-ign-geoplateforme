<script setup lang="ts">
// "About" window: what the app is (a Horizon demonstrator), its limits, privacy,
// data sources, language, links and contact. Opens on the first visit.
import Window from "@/components/Window.vue";
import IconButton from "@/components/IconButton.vue";
import ChoiceGroup from "@/components/ChoiceGroup.vue";
import SiradelLogo from "@/components/SiradelLogo.vue";
import { useI18n } from "@/service/i18n";
import { persistLocale, type Locale } from "@/service/locale";
import { LINKS } from "@/links";

const open = defineModel<boolean>("open", { default: false });

const { t, locale } = useI18n();

const LOCALE_LABELS: Record<Locale, string> = { en: "English", fr: "Français" };

function setLocale(id: Locale | null) {
    if (!id) return;
    locale.value = id;
    persistLocale(id);
}
</script>

<template>
    <div v-if="open" class="fixed inset-0 z-50 bg-black/40" @click="open = false"></div>
    <!-- Centred by a flex wrapper: the window's own transform runs its slide-in. -->
    <div class="fixed z-50 inset-x-0 top-8 max-sm:top-2 flex justify-center pointer-events-none">
        <Window
            :open="open"
            position="center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            class="pointer-events-auto w-[min(40rem,calc(100vw-2rem))] max-h-[calc(100dvh-4rem)] max-sm:max-h-[calc(100dvh-var(--toolbar-h)-1rem)] p-5 text-sm"
        >
            <div class="flex flex-row items-center gap-3 mb-3">
                <h1 id="about-title" class="grow text-xl font-semibold">{{ t("about.title") }}</h1>
                <ChoiceGroup
                    role="group"
                    :aria-label="t('about.language')"
                    :options="['en', 'fr'] as Locale[]"
                    :labels="LOCALE_LABELS"
                    required
                    :model-value="locale as Locale"
                    @update:model-value="setLocale"
                />
                <IconButton
                    icon="close"
                    icon-size="md"
                    :tooltip="t('about.close')"
                    @click="open = false"
                />
            </div>

            <p>{{ t("about.intro") }}</p>

            <h2>{{ t("about.demonstrator_title") }}</h2>
            <i18n-t keypath="about.demonstrator_text" tag="p">
                <template #horizon
                    ><a :href="LINKS.horizon" target="_blank" rel="noopener">Horizon</a></template
                >
                <template #sce
                    ><a :href="LINKS.sce" target="_blank" rel="noopener">SCE</a></template
                >
            </i18n-t>

            <h2>{{ t("about.experiment_title") }}</h2>
            <p>{{ t("about.experiment_text") }}</p>
            <p>{{ t("about.affiliation") }}</p>

            <h2>{{ t("about.privacy_title") }}</h2>
            <p>{{ t("about.privacy_text") }}</p>

            <h2>{{ t("about.sources_title") }}</h2>
            <p>{{ t("about.sources_text") }}</p>

            <footer
                class="mt-5 pt-4 border-t border-white/20 flex flex-row flex-wrap items-center gap-x-5 gap-y-2"
            >
                <a
                    :href="LINKS.siradel"
                    target="_blank"
                    rel="noopener"
                    class="h-4 flex text-white"
                    aria-label="Siradel"
                >
                    <SiradelLogo />
                </a>
                <a :href="LINKS.repo" target="_blank" rel="noopener">{{
                    t("about.source_code")
                }}</a>
                <a :href="`mailto:${LINKS.contactEmail}`">{{ LINKS.contactEmail }}</a>
            </footer>
        </Window>
    </div>
</template>

<style scoped>
@reference "tailwindcss/theme";

h2 {
    @apply mt-4 mb-1 text-base font-semibold;
}

p {
    @apply mb-2 text-white/85;
}

li {
    @apply mb-1 text-white/85;
}

a {
    @apply text-white underline underline-offset-2 decoration-white/40 hover:decoration-white;
}
</style>
