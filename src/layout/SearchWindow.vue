<script setup lang="ts">
import IconButton from "@/components/IconButton.vue";
import Window from "@/components/Window.vue";
import Input from "@/components/Input.vue";
import { ref, useTemplateRef, watchEffect } from "vue";
import { horizonService } from "@/service/horizon";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import * as IgnGeocoding from "@/service/ign-geocoding";
import { rateLimit } from "@/utils";
import { useI18n } from "@/service/i18n";

const { t } = useI18n();

const MIN_SEARCH_LENGTH = 4;

const open = defineModel<boolean>("open", { default: true });
const searchTerm = ref("");
const completionResults = ref<Array<IgnGeocoding.CompletionResult>>([]);
const selectedResult = ref(0);
const hasNoResult = ref(false);
const searchInput = useTemplateRef("searchInput");

watchEffect(() => {
    if (open) {
        completionResults.value = [];
        searchTerm.value = "";
        searchInput.value?.focus();
        selectedResult.value = 0;
        hasNoResult.value = false;
    }
});

const doCompletion = rateLimit(function (term: string) {
    if (!term || term.length < MIN_SEARCH_LENGTH) {
        completionResults.value = [];
        hasNoResult.value = false;
        return;
    }

    IgnGeocoding.doCompletion(term, 4).then((results) => {
        selectedResult.value = 0;
        completionResults.value = results;
        hasNoResult.value = results.length === 0;
    });
}, 400);

watchEffect(() => doCompletion(searchTerm.value));

function onKeydown(event: KeyboardEvent) {
    function offsetSelectedResult(offset: number) {
        if (completionResults.value.length > 0) {
            selectedResult.value =
                (selectedResult.value + offset + completionResults.value.length) %
                completionResults.value.length;
            event.preventDefault();
        }
    }

    if (event.key === "ArrowDown") {
        offsetSelectedResult(1);
    } else if (event.key === "ArrowUp") {
        offsetSelectedResult(-1);
    }
}

function goToResult(index: number) {
    const api = horizonService.getApi();

    if (!api || index < 0 || index >= completionResults.value.length) {
        return;
    }

    const result = completionResults.value[index]!;
    IgnGeocoding.doSearch(result).then((searchResult) => {
        if (!searchResult) {
            return;
        }

        const bbox = searchResult.bbox;

        api.CameraService.setOrbit({
            cameraIndex: HrzProtocol.CameraIndex.CAMERA_0,
            bounds: {
                bounds: bbox,
                tilt: 0,
            },
            altitudeMode: HrzProtocol.AltitudeMode.RELATIVE_TO_TERRAIN,
            goToAnimation: {
                duration: 3,
                easingExponent: 2,
                easingFunction: HrzProtocol.EasingFunctions.EASE_INOUT,
                trajectoryType: HrzProtocol.TrajectoryType.BALLISTIC,
            },
            maxAltitude: 10000000,
            minTilt: 0,
            maxTilt: Math.PI,
        });

        open.value = false;
    });
}
</script>

<template>
    <Window :open="open" position="left" class="absolute top-0 left-0 w-xs p-4">
        <div class="flex flex-row items-center">
            <h1 class="grow text-xl font-semibold">{{ t("address_search") }}</h1>
            <IconButton icon="close" icon-size="md" @click="open = false" />
        </div>
        <form class="mt-2" @submit.prevent="goToResult(selectedResult)">
            <Input
                class="w-full"
                ref="searchInput"
                :placeholder="t('search_ellipsis')"
                v-model="searchTerm"
                @keydown="onKeydown"
            />
        </form>
        <ul class="mt-2 divide-white/10 divide-y" v-show="!hasNoResult">
            <li v-for="(result, index) in completionResults" :key="index" class="py-1 font-medium">
                <div
                    class="p-2 hover:bg-white/5 rounded-md cursor-pointer"
                    :class="{ selectedResult: index === selectedResult }"
                    @click="goToResult(index)"
                >
                    {{ result.label }}
                </div>
            </li>
        </ul>
        <div v-show="hasNoResult" class="mt-4 px-2 text-white/50">{{ t("no_results") }}</div>
    </Window>
</template>

<style scoped>
@reference "tailwindcss/theme";

.selectedResult {
    @apply bg-white/5 outline outline-white/20;
}
</style>
