<script setup lang="ts">
import { ref, watch } from "vue";
import IconButton from "@/components/IconButton.vue";
import Window from "@/components/Window.vue";
import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { horizonService } from "@/service/horizon";

const open = defineModel<boolean>("open", {
    default: true,
});

const { t } = useI18n();

let attributions = ref<string[]>([]);

watch(horizonService.api, (api) => api && onHorizonReady(api), { immediate: true });

function onHorizonReady(api: HrzApi.AsyncApi) {
    horizonService.onMessage("viewerReady", () =>
        api!.ViewerService.setAttributionEnabled({ value: true }),
    );
}

async function processAttributions(srcAttributions: HrzProtocol.IAttribution[]) {
    attributions.value = [];
    for (let attribution of srcAttributions) {
        if (attribution.text) {
            attributions.value.push(attribution.text);
        }
    }
}

horizonService.onMessage("attributions", (msg) => {
    if (msg.attributions?.attributions) {
        processAttributions(msg.attributions.attributions);
    }
});

// Bundled fonts: their licence files ship with the build (`?url` emits them as
// assets), which is what the SIL OFL and Apache 2.0 licences require; a link is enough.
import SourceSans3License from "/resources/SourceSans3-OFL.txt?url";
import MaterialSymbolsLicense from "/resources/MaterialSymbols-LICENSE.txt?url";
import { useI18n } from "@/service/i18n";

const FONTS = [
    { name: "Source Sans 3", license: "SIL Open Font License 1.1", url: SourceSans3License },
    { name: "Material Symbols", license: "Apache License 2.0", url: MaterialSymbolsLicense },
];
</script>

<template>
    <Window :open="open" position="right" class="absolute top-4 right-4 bottom-4 w-lg p-4 text-xs">
        <div class="flex flex-row items-center mb-4">
            <h1 class="grow text-xl font-semibold">{{ t("attributions") }}</h1>
            <IconButton icon="close" icon-size="md" @click="open = false" />
        </div>
        <template v-if="attributions.length > 0">
            <h2 class="text-lg font-semibold mb-2">{{ t("map_data") }}</h2>
        </template>
        <template v-for="(attr, index) in attributions" :key="index">
            <hr v-if="index > 0" />
            <p class="license-text" v-html="attr"></p>
        </template>
        <hr v-if="attributions.length > 0" />
        <h2 class="text-lg font-semibold mb-2">{{ t("fonts") }}</h2>
        <ul>
            <li v-for="font in FONTS" :key="font.name">
                {{ font.name }} —
                <a :href="font.url" target="_blank" rel="noopener" class="underline">{{
                    font.license
                }}</a>
            </li>
        </ul>
    </Window>
</template>

<style scoped>
@reference "tailwindcss/theme";

h2 {
    @apply text-xl font-normal mb-2;
}

.license-text {
    @apply whitespace-pre-wrap;
}
</style>
