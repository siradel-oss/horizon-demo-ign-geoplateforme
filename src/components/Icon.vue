<script setup lang="ts">
export type IconSize = "sm" | "md" | "lg" | "xl";

const { size = "md", icon } = defineProps<{
    icon: string;
    size?: IconSize;
}>();
</script>

<style scoped>
.sm {
    font-variation-settings:
        "FILL" 0,
        "wght" 400,
        "GRAD" 0,
        "opsz" 24;
    font-size: 18px;
}

.md {
    font-variation-settings:
        "FILL" 0,
        "wght" 400,
        "GRAD" 0,
        "opsz" 24;
    font-size: 24px;
}

.lg {
    font-variation-settings:
        "FILL" 0,
        "wght" 400,
        "GRAD" 0,
        "opsz" 40;
    font-size: 32px;
}

.xl {
    font-variation-settings:
        "FILL" 0,
        "wght" 400,
        "GRAD" 0,
        "opsz" 40;
    font-size: 40px;
}
</style>

<template>
    <span class="material-symbols-rounded" :class="size">{{ icon }}</span>
</template>
