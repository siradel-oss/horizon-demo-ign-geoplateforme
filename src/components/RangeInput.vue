<script setup lang="ts">
import { computed } from "vue";

const [value, modifiers] = defineModel<number, "lazy">("modelValue");

const {
    step = "any",
    min,
    max,
} = defineProps<{
    min: number;
    max: number;
    step?: number | "any";
}>();

const eventName = computed(() => (modifiers.lazy ? "change" : "input"));

function updateValue(event: Event) {
    const target = event.target as HTMLInputElement;
    value.value = target.valueAsNumber;
}
</script>

<template>
    <input
        class="h-4 appearance-none accent-blue-300 hover:accent-blue-200 focus:accent-blue-200 bg-slate-600/50 rounded border border-white/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)] inline-block"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="value"
        @[eventName]="updateValue"
    />
</template>
