<script setup lang="ts">
import Button, { type ButtonStyle } from "./Button.vue";

const { active = false, buttonStyle = "inline" } = defineProps<{
    active?: boolean;
    buttonStyle?: ButtonStyle;
}>();

const emit = defineEmits<{
    click: [MouseEvent];
}>();
</script>

<template>
    <Button
        class="px-4 py-2"
        :active="active"
        :button-style="buttonStyle"
        @click="emit('click', $event)"
        ><slot></slot
    ></Button>
</template>
