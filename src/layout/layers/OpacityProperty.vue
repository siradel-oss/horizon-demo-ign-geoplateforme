<script setup lang="ts">
import RangeInput from "@/components/RangeInput.vue";
import { useI18n } from "@/service/i18n";

const { t } = useI18n();

const value = defineModel<number>({ required: true });
</script>

<template>
    <label class="flex flex-col gap-1">
        <span class="flex flex-row justify-between text-sm text-slate-200">
            {{ t("opacity") }}
            <span class="tabular-nums text-slate-400">{{ Math.round(value * 100) }}%</span>
        </span>
        <RangeInput v-model.lazy="value" :min="0" :max="1" :step="0.01" />
    </label>
</template>
