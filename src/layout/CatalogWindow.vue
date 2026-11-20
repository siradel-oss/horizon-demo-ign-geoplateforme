<script setup lang="ts">
import Window from "@/components/Window.vue";
import IconButton from "@/components/IconButton.vue";
import Badge from "@/components/Badge.vue";
import * as IgnCatalog from "@/service/ign-catalog";
import { useI18n } from "@/service/i18n";
import { ref, useTemplateRef, watchEffect, watch } from "vue";
import TextIconButton from "@/components/TextIconButton.vue";
import Input from "@/components/Input.vue";
import MiniSearch from "minisearch";
import ChoiceGroup from "@/components/ChoiceGroup.vue";
import LoadingIndicator from "@/components/LoadingIndicator.vue";
import { HrzApi } from "@siradel-oss/horizon-api";
import { horizonService } from "@/service/horizon";
import {
    createDtmRasterLayer,
    createImageryRasterLayer,
    createVectorLayer,
    layersService,
} from "@/service/layers";

const open = defineModel<boolean>("open", { default: true });

const { t } = useI18n();

const selectedCatalog = ref<number | null>(null);
const layersList = ref<IgnCatalog.Layer[]>([]);
const filteredLayersList = ref<IgnCatalog.Layer[]>([]);
const filterQuery = ref<string>("");
const filterTileType = ref<IgnCatalog.TileType | null>(null);
const loading = ref<boolean>(false);
const filterInput = useTemplateRef("filterInput");

// flush: "post" because the pane, and with it the input, is rendered by this very
// change and isn't in the DOM yet when a default-flush watcher runs.
watch(
    selectedCatalog,
    (catalog) => {
        if (catalog !== null) filterInput.value?.focus();
    },
    { flush: "post" },
);

const TILE_TYPE_NAME: Record<IgnCatalog.TileType, string> = {
    [IgnCatalog.TileType.IMAGERY]: t("imagery"),
    [IgnCatalog.TileType.ELEVATION]: t("elevation_map"),
    [IgnCatalog.TileType.VECTOR]: t("vector"),
};

let catalogsCache: IgnCatalog.Layer[][] = [];

let miniSearch = new MiniSearch<IgnCatalog.Layer>({
    idField: "identifier",
    fields: ["title", "identifier"],
    storeFields: ["title", "identifier"],
});

watchEffect(() => {
    if (!open.value) {
        selectedCatalog.value = null;
    }
});

watchEffect(async () => {
    if (selectedCatalog.value !== null) {
        const index = selectedCatalog.value;
        if (!catalogsCache[index]) {
            loading.value = true;
            try {
                catalogsCache[index] = await IgnCatalog.fetchCatalog(IgnCatalog.CATALOGS[index]!);
            } finally {
                loading.value = false;
            }
        }
        layersList.value = catalogsCache[index]!;
    } else {
        layersList.value = [];
    }
});

watchEffect(() => {
    miniSearch.removeAll();
    miniSearch.addAll(layersList.value);
    filterQuery.value = "";
});

watch([layersList, filterQuery, filterTileType], () => {
    if (filterQuery.value.trim() === "") {
        filteredLayersList.value = layersList.value;
    } else {
        let results = miniSearch.search(filterQuery.value.trim(), {
            prefix: true,
            fuzzy: 0.2,
        });
        filteredLayersList.value = results.map((r) => {
            return layersList.value.find((layer) => layer.identifier === r.id)!;
        });
    }
    if (filterTileType.value !== null) {
        filteredLayersList.value = filteredLayersList.value.filter(
            (layer) => layer.tileType === filterTileType.value,
        );
    }
});

async function addLayer(layer: IgnCatalog.Layer) {
    const api = horizonService.getApi();
    if (!api) return;

    const catalog = IgnCatalog.CATALOGS[selectedCatalog.value ?? 0]!;
    if (layer.tileType === IgnCatalog.TileType.VECTOR) {
        await addVectorLayer(api, catalog, layer);
    } else if (layer.tileType === IgnCatalog.TileType.ELEVATION) {
        await addDtmLayer(api, catalog, layer);
    } else {
        await addImageryLayer(api, catalog, layer);
    }
}

async function addImageryLayer(
    api: HrzApi.AsyncApi,
    catalog: IgnCatalog.Catalog,
    layer: IgnCatalog.Layer,
) {
    layersService.addLayer(
        await createImageryRasterLayer(
            api,
            layer.title,
            catalog.wmtsUrl ?? "",
            layer.identifier,
            IgnCatalog.IGN_ATTRIBUTION,
        ),
    );
}

async function addDtmLayer(
    api: HrzApi.AsyncApi,
    catalog: IgnCatalog.Catalog,
    layer: IgnCatalog.Layer,
) {
    layersService.addLayer(
        await createDtmRasterLayer(
            api,
            layer.title,
            catalog.wmtsUrl ?? "",
            layer.identifier,
            IgnCatalog.IGN_ATTRIBUTION,
        ),
    );
}

async function addVectorLayer(
    api: HrzApi.AsyncApi,
    catalog: IgnCatalog.Catalog,
    layer: IgnCatalog.Layer,
) {
    const attribution =
        layer.attribution ??
        (await IgnCatalog.fetchTilesetAttribution(catalog.tmsUrl!, layer.tilesetId!));

    layersService.addLayer(
        await createVectorLayer(
            api,
            layer.title,
            layer.metadataUrl!,
            layer.sourceLayerName!,
            layer.fields ?? [],
            attribution,
        ),
    );
}
</script>

<template>
    <Transition name="fade">
        <div v-show="open" class="fixed inset-0 bg-slate-800/60 z-50"></div>
    </Transition>
    <Window
        :open="open"
        position="center"
        class="absolute w-240 h-150 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-[calc(100vw-1rem)] max-sm:top-2 max-sm:translate-y-0 max-sm:h-[calc(100dvh-var(--toolbar-h)-1rem)]"
        @keydown.escape.stop="open = false"
        tabindex="0"
    >
        <div class="flex flex-col h-full">
            <div class="flex flex-row items-center p-4">
                <h1 class="grow text-3xl max-sm:text-xl font-semibold" v-if="selectedCatalog === null">
                    {{ t("catalog") }}
                </h1>
                <h1 class="grow text-3xl max-sm:text-xl font-semibold" v-else>
                    <a href="javascript:void(0)" @click="selectedCatalog = null">{{
                        t("catalog")
                    }}</a>
                    &nbsp;&rarr;&nbsp;&nbsp;{{ IgnCatalog.CATALOGS[selectedCatalog]!.name }}
                </h1>
                <IconButton icon="close" icon-size="md" @click="open = false" />
            </div>
            <div class="overflow-x-clip grow relative max-sm:overflow-y-auto">
                <Transition name="slide-right">
                    <ul
                        v-if="selectedCatalog === null"
                        id="left"
                        class="grid grid-cols-4 max-sm:grid-cols-2 gap-3 absolute px-4 w-full"
                    >
                        <li
                            v-for="(catalog, index) in IgnCatalog.CATALOGS"
                            :key="catalog.name"
                            class="border border-slate-500/40 rounded p-3 cursor-pointer select-none hover:bg-slate-500/10 transition-colors"
                            @click="selectedCatalog = index"
                        >
                            {{ catalog.name }}
                        </li>
                    </ul>
                    <div v-else id="right" class="absolute w-full flex flex-col gap-3 h-full">
                        <div class="px-4 flex flex-row flex-wrap gap-x-4 gap-y-2">
                            <Input
                                ref="filterInput"
                                v-model="filterQuery"
                                :placeholder="t('filter_layers')"
                                class="w-1/2 max-sm:w-full"
                            />
                            <ChoiceGroup
                                :options="Object.values(IgnCatalog.TileType)"
                                :labels="TILE_TYPE_NAME"
                                v-model="filterTileType"
                            ></ChoiceGroup>
                        </div>
                        <div v-if="loading" class="grow flex items-center justify-center">
                            <LoadingIndicator />
                        </div>
                        <ul
                            v-else
                            class="grow divide-y divide-slate-500/40 px-4 pb-4 overflow-y-auto"
                        >
                            <li
                                v-for="layer in filteredLayersList"
                                :key="layer.identifier"
                                class="flex flex-row items-center justify-between gap-2 py-1"
                            >
                                <span class="max-w-3/4">
                                    {{ layer.title }}
                                    <Badge>{{ layer.layerType }}</Badge>
                                    <Badge>{{ TILE_TYPE_NAME[layer.tileType] }}</Badge>
                                </span>
                                <TextIconButton
                                    icon="add"
                                    button-style="default"
                                    @click="addLayer(layer)"
                                    >{{ t("add_to_scene") }}</TextIconButton
                                >
                            </li>
                        </ul>
                    </div>
                </Transition>
            </div>
        </div>
    </Window>
</template>

<style>
@reference "tailwindcss/theme";

.fade-enter-active,
.fade-leave-active {
    @apply transition-opacity ease-in-out duration-200;
}

.fade-enter-from,
.fade-leave-to {
    @apply opacity-0;
}

.slide-right-enter-active,
.slide-right-leave-active {
    @apply transition-[transform_opacity] ease-out duration-200;
}

.slide-right-enter-from#left,
.slide-right-leave-to#left {
    @apply transform -translate-x-full opacity-0;
}

.slide-right-leave-to#right,
.slide-right-enter-from#right {
    @apply transform translate-x-full opacity-0;
}
</style>
