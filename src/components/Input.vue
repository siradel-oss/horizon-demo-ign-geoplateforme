<script setup lang="ts">
import { useTemplateRef } from "vue";

const { placeholder } = defineProps<{
    placeholder?: string;
}>();

const emit = defineEmits<{
    keydown: [event: KeyboardEvent];
}>();

const model = defineModel<string>();
const myInput = useTemplateRef("myInput");

function focus() {
    myInput.value?.focus();
}

defineExpose({
    focus,
});
</script>

<template>
    <input
        type="text"
        ref="myInput"
        :placeholder="placeholder"
        v-model="model"
        @keydown="emit('keydown', $event)"
        class="px-3 py-2 bg-slate-600/50 backdrop-blur-md placeholder:text-white/70 border border-white/20 rounded-lg text-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]"
    />
</template>
