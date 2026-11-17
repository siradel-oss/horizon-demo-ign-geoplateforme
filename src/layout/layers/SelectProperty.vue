<script setup lang="ts">
const { label, options } = defineProps<{
    label: string;
    options: string[];
}>();

const value = defineModel<string>({ required: true });
</script>

<template>
    <label class="flex flex-row items-center justify-between gap-2">
        <span class="text-sm text-slate-200">{{ label }}</span>
        <select
            v-model="value"
            class="min-w-0 max-w-40 truncate px-2 py-0.5 text-sm bg-slate-600/50 border border-white/20 rounded text-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]"
        >
            <option v-for="option in options" :key="option" :value="option" class="bg-slate-700">
                {{ option }}
            </option>
        </select>
    </label>
</template>
