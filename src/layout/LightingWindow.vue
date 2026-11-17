<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import IconButton from "@/components/IconButton.vue";
import TextButton from "@/components/TextButton.vue";
import Window from "@/components/Window.vue";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { horizonService } from "@/service/horizon";
import { HrzApi } from "@siradel-oss/horizon-api";
import RangeInput from "@/components/RangeInput.vue";
import { useI18n } from "@/service/i18n";

type LightingMode = "realistic" | "clarity" | "foggy";

const { t, n, d } = useI18n();

const lightingMode = ref<LightingMode>("realistic");
const settings = reactive<Map<LightingMode, () => HrzProtocol.IAmbientSettings>>(new Map());
const variables = reactive({
    fogDensityExp: -0.2,
    timeOfDay: 14,
    dayOfYear: 171,
});

const fogDensity = computed(() => Math.pow(10, variables.fogDensityExp));

const date = computed(() => {
    const year = new Date().getFullYear();
    let date = new Date(year, 0);
    date.setDate(variables.dayOfYear);
    date.setHours(Math.floor(variables.timeOfDay));
    date.setMinutes((variables.timeOfDay % 1) * 60);
    return date;
});

settings.set("realistic", () => ({
    lighting: {
        enableLighting: true,
        castShadows: true,
        receiveShadows: true,
    },
    sunAmbientBalance: 0.5,
    lightingStrength: 1,
    wrapLighting: 0,
    sky: {
        mode: HrzProtocol.SkyMode.SKY_SIMULATED,
        attenuation: 0.5,
    },
    sun: {
        mode: HrzProtocol.SunLightingMode.SUN_LIGHTING_SIMULATED,
        solarDate: {
            solarTime: variables.timeOfDay,
            atPrimeMeridian: false,
            dayOfYear: variables.dayOfYear,
        },
    },
    ambientLighting: {
        mode: HrzProtocol.AmbientLightingMode.AMBIENT_LIGHTING_SIMULATED,
    },
}));

settings.set("clarity", () => ({
    lightingStrength: 1.0,
    sunAmbientBalance: 0.5,
    wrapLighting: 1.0,
    lighting: {
        enableLighting: true,
        castShadows: false,
        receiveShadows: false,
    },
    sky: {
        mode: HrzProtocol.SkyMode.SKY_STATIC,
        staticAtmosphereColor: { r: 0.87, g: 0.94, b: 0.97, a: 1 },
        staticSpaceColor: { r: 0.5, g: 0.72, b: 0.92, a: 1 },
        staticColorTransitionStartDistance: 0,
        staticColorTransitionEndDistance: 300,
        staticColorTransitionDistanceUnit:
            HrzProtocol.StaticSkyColorTransitionUnit.STATIC_SKY_COLOR_TRANSITION_UNIT_PIXELS,
    },
    sun: {
        mode: HrzProtocol.SunLightingMode.SUN_LIGHTING_STATIC,
        staticColor: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
        angularDirection: {
            cameraFrame: HrzProtocol.AngularDirection.Frame.FRAME_ENU,
            azimuth: 2.36,
            altitude: 0.7,
        },
    },
    ambientLighting: {
        mode: HrzProtocol.AmbientLightingMode.AMBIENT_LIGHTING_STATIC,
        staticColor: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
    },
    undergroundColor: { a: 1 }, // @Todo Shouldn't be needed, remove when there is a fix in Horizon.
}));

settings.set("foggy", () => ({
    lightingStrength: 1.0,
    sunAmbientBalance: 0.0,
    lighting: {
        enableLighting: true,
        castShadows: true,
        receiveShadows: true,
    },
    sky: {
        mode: HrzProtocol.SkyMode.SKY_STATIC,
        staticAtmosphereColor: { r: 0.83, g: 0.83, b: 0.83, a: 1 },
        staticSpaceColor: {
            r: 0.0,
            g: 0.0,
            b: 0.0,
            a: 1,
        },
        staticColorTransitionStartDistance: 15000,
        staticColorTransitionEndDistance: 60000,
        staticColorTransitionDistanceUnit:
            HrzProtocol.StaticSkyColorTransitionUnit.STATIC_SKY_COLOR_TRANSITION_UNIT_METERS,
    },
    sun: {
        mode: HrzProtocol.SunLightingMode.SUN_LIGHTING_STATIC,
        staticColor: { r: 1, g: 1, b: 1, a: 1 },
        angularDirection: {
            cameraFrame: HrzProtocol.AngularDirection.Frame.FRAME_ENU,
            azimuth: 0,
            altitude: 0.6,
        },
    },
    ambientLighting: {
        mode: HrzProtocol.AmbientLightingMode.AMBIENT_LIGHTING_STATIC,
        staticColor: { r: 0.47, g: 0.47, b: 0.47, a: 1 },
    },
    primaryFog: {
        color: { r: 0.6, g: 0.6, b: 0.6, a: 1 },
        density: fogDensity.value * 2,
        applyToSky: false,
        startDistance: 0.0,
        falloffStart: 0.0,
        falloffEnd: 150.0,
    },
    secondaryFog: {
        color: { r: 0.69, g: 0.69, b: 0.69, a: 1 },
        density: fogDensity.value * 0.7,
        applyToSky: true,
        startDistance: 0.0,
        falloffStart: 0.0,
        falloffEnd: 3000.0,
    },
}));

const open = defineModel<boolean>("open", { default: true });

watch(
    [lightingMode, variables, horizonService.api],
    async () => {
        const api = horizonService.getApi();
        if (!api) return;

        const ambientSettings = settings.get(lightingMode.value)?.();
        if (ambientSettings) {
            await HrzApi.SceneViewSettingsPathBuilder.create(
                HrzProtocol.SceneViewIndex.SCENE_VIEW_0,
            )
                .ambient()
                .set(api, ambientSettings);
        }
    },
    { immediate: true },
);
</script>

<template>
    <Window :open="open" position="left" class="absolute top-0 left-0 w-xs p-4">
        <div class="flex flex-row items-center">
            <h1 class="grow text-xl font-semibold">{{ t("lighting") }}</h1>
            <IconButton icon="close" icon-size="md" @click="open = false" />
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
            <TextButton :active="lightingMode === 'realistic'" @click="lightingMode = 'realistic'"
                >{{ t("realistic_mode") }}
            </TextButton>
            <TextButton :active="lightingMode === 'clarity'" @click="lightingMode = 'clarity'">{{
                t("clarity_mode")
            }}</TextButton>
            <TextButton :active="lightingMode === 'foggy'" @click="lightingMode = 'foggy'">{{
                t("foggy_mode")
            }}</TextButton>
        </div>
        <div v-if="lightingMode !== 'clarity'" class="flex flex-col text-white gap-2">
            <hr class="mb-1! mt-2!" />
            <label v-if="lightingMode === 'foggy'" class="flex flex-col gap-1">
                <span>{{ t("fog_density") }} ({{ n(fogDensity, "decimal") }})</span>
                <RangeInput v-model="variables.fogDensityExp" :min="-1.5" :max="0.7" />
            </label>
            <label v-if="lightingMode === 'realistic'" class="flex flex-col gap-1">
                <span> {{ t("day_of_year") }} ({{ d(date, "dateonly") }}) </span>
                <RangeInput v-model="variables.dayOfYear" :min="1" :max="365" :step="1" />
            </label>
            <label v-if="lightingMode === 'realistic'" class="flex flex-col gap-1">
                <span> {{ t("local_solar_time") }} ({{ d(date, "timeonly") }}) </span>
                <RangeInput v-model="variables.timeOfDay" :min="0" :max="24" />
            </label>
        </div>
    </Window>
</template>
