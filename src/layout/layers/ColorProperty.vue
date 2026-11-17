<script setup lang="ts">
import ColorInput from "@/components/ColorInput.vue";
import { useI18n } from "@/service/i18n";

const { t } = useI18n();

const value = defineModel<string>({ required: true });
</script>

<template>
    <label class="flex flex-row items-center justify-between">
        <span class="text-sm text-slate-200">{{ t("color") }}</span>
        <ColorInput v-model.lazy="value" class="h-5 w-8 rounded" />
    </label>
</template>
