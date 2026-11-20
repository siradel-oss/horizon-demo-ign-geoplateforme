<script setup lang="ts">
const { open = true, position: side = "left" } = defineProps<{
    open?: boolean;
    position?: "left" | "right" | "center";
}>();
</script>

<template>
    <Transition :name="`slide-${position}`" appear>
        <div
            v-if="open"
            :class="{ sheet: position !== 'center' }"
            class="backdrop-blur-lg bg-slate-800/60 border border-white/10 rounded-lg overflow-auto text-white shadow-[0_0px_20px_rgba(0,0,0,0.3)]"
        >
            <slot></slot>
        </div>
    </Transition>
</template>

<style scoped>
@reference "tailwindcss/theme";

/* Phone: side windows become a sheet above the bottom tool bar, full width,
   whatever position their caller gives them on larger screens. */
.sheet {
    @apply max-sm:fixed max-sm:inset-x-2 max-sm:top-auto max-sm:bottom-[calc(var(--toolbar-h)+0.5rem)] max-sm:w-auto max-sm:max-h-[60dvh] max-sm:z-40 max-sm:bg-slate-800/90;
}

.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-center-enter-active,
.slide-center-leave-active {
    @apply transition-[transform_opacity] ease-out duration-300;
}

.slide-right-enter-from,
.slide-right-leave-to {
    @apply transform translate-x-[100%] opacity-0;
}

.slide-left-enter-from,
.slide-left-leave-to {
    @apply transform translate-x-[-100%] opacity-0;
}

.slide-center-enter-from,
.slide-center-leave-to {
    @apply transform translate-y-[-100%] opacity-0;
}
</style>
