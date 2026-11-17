<script setup lang="ts" generic="T extends string | number | symbol">
const {
    options,
    labels,
    required = false,
} = defineProps<{
    options: T[];
    labels?: Record<T, string>;
    /** Keeps an option selected: clicking the active one doesn't clear it. */
    required?: boolean;
}>();

const selected = defineModel<T | null>("modelValue", { default: null });
</script>

<template>
    <div class="flex flex-row">
        <button
            v-for="option in options"
            :key="option"
            @click="selected = selected === option && !required ? null : option"
            :class="{
                active: selected != null && selected == option,
                inactive: selected != null && selected != option,
            }"
        >
            {{ labels && labels[option] ? labels[option] : option }}
        </button>
    </div>
</template>

<style scoped>
@reference "tailwindcss/theme";

button {
    @apply text-white py-1 px-2 cursor-pointer select-none
        hover:bg-white/5
        border border-slate-500/40
        border-r-0
        first:rounded-l last:rounded-r last:border-r;
}

button.inactive {
    @apply text-slate-200/50;
}

button.active {
    @apply bg-blue-400/20;
}
</style>
