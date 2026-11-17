<script setup lang="ts">
import { computed } from "vue";

const [value, modifiers] = defineModel<string, "lazy">({ required: true });

const eventName = computed(() => (modifiers.lazy ? "change" : "input"));

function updateValue(event: Event) {
    const target = event.target as HTMLInputElement;
    value.value = target.value;
}
</script>

<template>
    <input type="color" :value="value" @[eventName]="updateValue" />
</template>

<style scoped>
@reference "tailwindcss/theme";

input[type="color"] {
    @apply shrink-0 cursor-pointer appearance-none border border-white/30 bg-transparent p-0;
}

input[type="color"]::-webkit-color-swatch-wrapper {
    @apply p-0;
}

input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: inherit;
}

input[type="color"]::-moz-color-swatch {
    border: none;
    border-radius: inherit;
}
</style>
