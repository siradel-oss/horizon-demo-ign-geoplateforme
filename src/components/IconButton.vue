<script setup lang="ts">
import Icon, { type IconSize } from "./Icon.vue";
import Button, { type ButtonStyle } from "./Button.vue";

const {
    active: active,
    icon,
    tooltip,
    iconSize = "lg",
    buttonStyle = "inline",
} = defineProps<{
    active?: boolean;
    icon: string;
    iconSize?: IconSize;
    tooltip?: string;
    buttonStyle?: ButtonStyle;
}>();

const emit = defineEmits<{
    click: [MouseEvent];
}>();
</script>

<template>
    <Button
        class="p-1 flex"
        @click="emit('click', $event)"
        :tooltip="tooltip"
        :active="active"
        :button-style="buttonStyle"
    >
        <Icon :icon="icon" :size="iconSize" />
    </Button>
</template>
