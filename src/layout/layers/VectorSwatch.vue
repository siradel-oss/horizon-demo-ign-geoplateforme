<script setup lang="ts">
import ColorInput from "@/components/ColorInput.vue";
import { useI18n } from "@/service/i18n";
import type { VectorLayer } from "@/service/layers";

const { t } = useI18n();

const { layer } = defineProps<{ layer: VectorLayer }>();
</script>

<template>
    <ColorInput
        v-model.lazy="layer.state.color"
        class="ml-1 h-4 w-4 rounded-full"
        :title="t('layer_color')"
    />
</template>
