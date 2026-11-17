<script setup lang="ts">
import { computed } from "vue";
import ChoiceProperty from "./ChoiceProperty.vue";
import ColorProperty from "./ColorProperty.vue";
import NumberProperty from "./NumberProperty.vue";
import OpacityProperty from "./OpacityProperty.vue";
import SelectProperty from "./SelectProperty.vue";
import { useI18n } from "@/service/i18n";
import type { VectorLayer, VectorRepresentation } from "@/service/layers";

const { layer } = defineProps<{ layer: VectorLayer }>();

const { t } = useI18n();

type HeightSource = "fixed" | "attribute";

// Attributes that commonly hold a height, preselected when switching to "attribute".
const HEIGHT_ATTRIBUTE_NAMES = ["hauteur", "render_height", "height"];

const numericFields = computed(() =>
    layer.fields.filter((field) => field.type === "number").map((field) => field.name),
);

const heightSource = computed<HeightSource>({
    get: () => (layer.state.extrusion.attribute === null ? "fixed" : "attribute"),
    set: (source) => {
        if (source === "fixed") {
            layer.state.extrusion.attribute = null;
        } else if (layer.state.extrusion.attribute === null) {
            const fields = numericFields.value;
            layer.state.extrusion.attribute =
                HEIGHT_ATTRIBUTE_NAMES.find((name) => fields.includes(name)) ?? fields[0] ?? null;
        }
    },
});

const heightAttribute = computed<string>({
    get: () => layer.state.extrusion.attribute ?? "",
    set: (attribute) => (layer.state.extrusion.attribute = attribute),
});

const representationLabels = computed<Record<VectorRepresentation, string>>(() => ({
    flat: t("representation_flat"),
    extruded: t("representation_extruded"),
}));

const heightSourceLabels = computed<Record<HeightSource, string>>(() => ({
    fixed: t("height_fixed"),
    attribute: t("height_attribute"),
}));
</script>

<template>
    <OpacityProperty v-model="layer.state.opacity" />
    <ColorProperty v-model="layer.state.color" />
    <ChoiceProperty
        v-model="layer.state.representation"
        :label="t('representation')"
        :options="['flat', 'extruded']"
        :labels="representationLabels"
    />
    <template v-if="layer.state.representation === 'extruded'">
        <ChoiceProperty
            v-if="numericFields.length > 0"
            v-model="heightSource"
            :label="t('height_source')"
            :options="['fixed', 'attribute']"
            :labels="heightSourceLabels"
        />
        <SelectProperty
            v-if="heightSource === 'attribute'"
            v-model="heightAttribute"
            :label="t('attribute')"
            :options="numericFields"
        />
        <NumberProperty
            v-model="layer.state.extrusion.height"
            :label="heightSource === 'attribute' ? t('fallback_height') : t('height')"
            unit="m"
            :min="0"
        />
    </template>
</template>
