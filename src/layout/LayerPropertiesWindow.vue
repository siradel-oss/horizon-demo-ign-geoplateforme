<script setup lang="ts">
import IconButton from "@/components/IconButton.vue";
import Window from "@/components/Window.vue";
import { useI18n } from "@/service/i18n";
import { layersService } from "@/service/layers";

const { t } = useI18n();

const selected = layersService.selectedLayer;

function close() {
    layersService.selectedLayerId.value = null;
}
</script>

<template>
    <Window
        :open="selected !== null"
        position="left"
        class="absolute top-0 left-100 w-2xs p-4 flex flex-col gap-3"
    >
        <div v-if="selected" class="contents">
            <div class="flex flex-row items-center">
                <div class="grow min-w-0">
                    <h1 class="text-xl font-semibold">{{ t("layer_properties") }}</h1>
                    <div class="truncate text-xs text-slate-300" :title="selected.layer.name">
                        {{ selected.layer.name }}
                    </div>
                </div>
                <IconButton icon="close" icon-size="md" @click="close()" />
            </div>

            <component
                :is="selected.layer.properties"
                v-if="selected.layer.properties"
                :layer="selected.layer"
            />
            <div v-else class="text-sm text-slate-300 italic">
                {{ t("no_adjustable_properties") }}
            </div>
        </div>
    </Window>
</template>
