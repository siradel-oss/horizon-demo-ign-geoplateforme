<script setup lang="ts">
const {
    label,
    unit,
    min,
    step = "any",
} = defineProps<{
    label: string;
    unit?: string;
    min?: number;
    step?: number | "any";
}>();

const value = defineModel<number>({ required: true });

// An emptied or invalid field keeps the previous value rather than pushing NaN to the engine.
function update(event: Event) {
    const input = event.target as HTMLInputElement;
    const number = input.valueAsNumber;
    if (Number.isFinite(number) && (min === undefined || number >= min)) {
        value.value = number;
    } else {
        input.valueAsNumber = value.value;
    }
}
</script>

<template>
    <label class="flex flex-row items-center justify-between gap-2">
        <span class="text-sm text-slate-200">{{ label }}</span>
        <span class="flex flex-row items-center gap-1 text-sm text-slate-400">
            <input
                type="number"
                :value="value"
                :min="min"
                :step="step"
                @change="update"
                class="w-20 px-2 py-0.5 text-right tabular-nums bg-slate-600/50 border border-white/20 rounded text-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]"
            />
            <span v-if="unit">{{ unit }}</span>
        </span>
    </label>
</template>
