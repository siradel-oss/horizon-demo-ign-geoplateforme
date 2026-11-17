<script setup lang="ts">
import OpacityProperty from "./OpacityProperty.vue";
import type { ImageryRasterLayer } from "@/service/layers";

const { layer } = defineProps<{ layer: ImageryRasterLayer }>();
</script>

<template>
    <OpacityProperty v-model="layer.state.opacity" />
</template>
