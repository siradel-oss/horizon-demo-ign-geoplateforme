<script setup lang="ts">
import { DRAGGABLE_SERVICE_KEY, type DraggableService } from "@/lib/drag-group";
import { provide } from "vue";

const { group } = defineProps<{
    group: DraggableService;
}>();

provide(DRAGGABLE_SERVICE_KEY, group);
</script>
<template>
    <slot></slot>
</template>
