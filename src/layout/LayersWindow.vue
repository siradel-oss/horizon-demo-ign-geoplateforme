<script setup lang="ts">
import Draggable from "@/components/Draggable.vue";
import DragGroup from "@/components/DragGroup.vue";
import DragHandle from "@/components/DragHandle.vue";
import IconButton from "@/components/IconButton.vue";
import Window from "@/components/Window.vue";
import { computed } from "vue";
import { DraggableService } from "@/lib/drag-group";
import { useI18n } from "@/service/i18n";
import { layersService } from "@/service/layers";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: true });

type LayerGroupTitleKey = "vector" | "imagery" | "elevation_map";

// Layers of different types can't be stacked against each other, so they get their own
// section and their own drag group. Listed from what draws on top down to the terrain the
// rest is draped over.
const LAYER_TYPE_GROUPS: { type: HrzProtocol.LayerType; titleKey: LayerGroupTitleKey }[] = [
    { type: HrzProtocol.LayerType.VECTOR_TILES, titleKey: "vector" },
    { type: HrzProtocol.LayerType.IMAGERY_RASTER, titleKey: "imagery" },
    { type: HrzProtocol.LayerType.DTM_RASTER, titleKey: "elevation_map" },
];

const layerTypeGroups = LAYER_TYPE_GROUPS.map((group) => {
    const dragGroup = new DraggableService();
    dragGroup.setOnReorderCallback((from, to) =>
        layersService.reorderLayerOfType(group.type, from, to),
    );
    return { ...group, dragGroup };
});

function toggleSelection(id: number) {
    layersService.selectedLayerId.value = layersService.selectedLayerId.value === id ? null : id;
}

const groupedLayers = computed(() =>
    layerTypeGroups
        .map((group) => ({
            ...group,
            layers: layersService.layers.value.filter((entry) => entry.layer.type === group.type),
        }))
        .filter((group) => group.layers.length > 0),
);
</script>

<template>
    <Window :open="open" position="left" class="absolute top-0 left-0 w-sm p-4">
        <div class="flex flex-row items-center">
            <h1 class="grow text-xl font-semibold">{{ t("layers") }}</h1>
            <IconButton icon="close" icon-size="md" @click="open = false" />
        </div>
        <div v-if="groupedLayers.length === 0" class="mt-4 text-slate-300 px-4 italic text-center">
            {{ t("no_layers") }}
        </div>
        <div v-else class="mt-2 flex flex-col gap-3">
            <div v-for="group in groupedLayers" :key="group.type">
                <h2 class="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {{ t(group.titleKey) }}
                </h2>
                <ul class="flex flex-col divide-y divide-slate-200/30">
                    <DragGroup :group="group.dragGroup">
                        <Draggable
                            v-for="(entry, index) in group.layers"
                            :key="entry.id"
                            :index="index"
                        >
                            <li
                                class="flex flex-row items-center py-2 px-1 group"
                                :class="{
                                    'opacity-60': !entry.layer.state.visible,
                                    'bg-blue-400/20 rounded':
                                        layersService.selectedLayerId.value === entry.id,
                                    'shadow-lg bg-slate-200/20 rounded opacity-60':
                                        group.dragGroup.isBeingDragged(index),
                                    'outline-white outline rounded':
                                        group.dragGroup.isDraggedOver(index),
                                }"
                            >
                                <div
                                    class="opacity-50 hover:opacity-100 cursor-move"
                                    @pointerdown="group.dragGroup.startDrag()"
                                >
                                    <DragHandle />
                                </div>
                                <IconButton
                                    :icon="
                                        entry.layer.state.visible ? 'visibility' : 'visibility_off'
                                    "
                                    icon-size="md"
                                    @click="entry.layer.state.visible = !entry.layer.state.visible"
                                />
                                <component
                                    :is="entry.layer.listDecoration"
                                    v-if="entry.layer.listDecoration"
                                    :layer="entry.layer"
                                />
                                <div
                                    class="grow truncate ml-2 cursor-pointer"
                                    :title="entry.layer.name"
                                    @click="toggleSelection(entry.id)"
                                >
                                    {{ entry.layer.name }}
                                </div>
                                <div class="hidden group-hover:block">
                                    <IconButton
                                        icon="delete"
                                        icon-size="md"
                                        @click="layersService.removeLayer(entry.id)"
                                    />
                                </div>
                            </li>
                        </Draggable>
                    </DragGroup>
                </ul>
            </div>
        </div>
    </Window>
</template>

<style scoped>
@reference "tailwindcss/theme";

h3 {
    @apply mt-4 mb-2 text-sm font-semibold text-slate-200;
}

.layerButton {
    @apply text-left flex flex-row items-center gap-4;
}
</style>
