<script setup lang="ts" generic="T extends string">
import ChoiceGroup from "@/components/ChoiceGroup.vue";

const { label, options, labels } = defineProps<{
    label: string;
    options: T[];
    labels: Record<T, string>;
}>();

const value = defineModel<T>({ required: true });

function select(option: T | null) {
    if (option !== null) value.value = option;
}
</script>

<template>
    <div class="flex flex-row items-center justify-between gap-2">
        <span class="text-sm text-slate-200">{{ label }}</span>
        <ChoiceGroup
            :model-value="value"
            @update:model-value="select"
            :options="options"
            :labels="labels"
            required
            class="text-sm"
        />
    </div>
</template>
