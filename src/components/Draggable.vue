<script setup lang="ts">
import { DRAGGABLE_SERVICE_KEY } from "@/lib/drag-group";
import { inject } from "vue";

const draggableService = inject(DRAGGABLE_SERVICE_KEY);
if (!draggableService) {
    throw new Error("Draggable must be used within a DragGroup");
}

const { index } = defineProps<{
    index: number;
}>();
</script>
<template>
    <div
        :draggable="draggableService.dragHandlePressed.value"
        @dragstart="draggableService.handleDragStart($event, index)"
        @dragend="draggableService.handleDragEnd($event)"
        @dragover.prevent="draggableService.handleDragOver($event, index)"
        @dragleave.prevent="draggableService.handleDragLeave($event)"
        @drop.prevent="draggableService.handleDrop($event, index)"
    >
        <slot></slot>
    </div>
</template>
