<script setup lang="ts">
export type ButtonStyle = "default" | "inline";

const {
    active = false,
    tooltip,
    buttonStyle = "default",
} = defineProps<{
    active?: boolean;
    tooltip?: string;
    buttonStyle?: ButtonStyle;
}>();

const emit = defineEmits<{
    click: [MouseEvent];
}>();
</script>

<template>
    <button
        :class="{ active: active, default: buttonStyle === 'default' }"
        @click="emit('click', $event)"
        :title="tooltip"
    >
        <slot></slot>
    </button>
</template>

<style scoped>
@reference "tailwindcss/theme";

.default {
    @apply border border-slate-500/40 bg-slate-400/5 hover:border-l-transparent hover:border-r-transparent;
}

button {
    @apply text-white 
        hover:bg-white/10 active:bg-white/20
        border-b border-t border-transparent hover:border-b-black/20 hover:border-t-white/5
        transition-all
        rounded-lg
        cursor-pointer select-none;

    &.active {
        @apply bg-white/15 border-b-black/20 border-t-white/5;
    }
}
</style>
