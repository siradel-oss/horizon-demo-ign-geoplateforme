<script setup lang="ts">
import Icon from "./Icon.vue";
import Button, { type ButtonStyle } from "./Button.vue";

const {
    icon,
    active = false,
    buttonStyle = "inline",
} = defineProps<{
    icon: string;
    active?: boolean;
    buttonStyle?: ButtonStyle;
}>();

const emit = defineEmits<{
    click: [MouseEvent];
}>();
</script>

<template>
    <Button
        class="px-3 py-2 gap-2 flex flex-row items-center"
        @click="emit('click', $event)"
        :active="active"
        :button-style="buttonStyle"
    >
        <Icon :icon="icon" size="md" />
        <span><slot></slot></span>
    </Button>
</template>
