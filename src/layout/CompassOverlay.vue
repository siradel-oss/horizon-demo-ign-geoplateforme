<script setup lang="ts">
import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { ref, useTemplateRef, watch } from "vue";
import { horizonService } from "@/service/horizon";

const compass = useTemplateRef("compass");
let heading = ref(0);
let tilt = ref(0);

watch(horizonService.api, (api) => api && onHorizonReady(api), { immediate: true });

async function onHorizonReady(api: HrzApi.AsyncApi) {
    setInterval(async () => {
        const cam = await api.CameraService.getCameraPose({
            camera: HrzProtocol.CameraIndex.CAMERA_0,
        });
        heading.value = cam.bearing;
        tilt.value = cam.tilt;
    }, 100);
}

watch([heading, tilt], () => {
    if (compass.value) {
        const squish = Math.pow(Math.cos(tilt.value), 3) * 0.65;
        compass.value.style.transform = `scaleY(${1 - squish}) rotate(${-heading.value}rad)`;
    }
});

async function resetView() {
    const api = horizonService.getApi();
    if (api) {
        await api.CameraService.resetNorth({
            resetTilt: true,
            cameraIndex: HrzProtocol.CameraIndex.CAMERA_0,
            animationOptions: {
                duration: 1,
                easingExponent: 2,
                easingFunction: HrzProtocol.EasingFunctions.EASE_INOUT,
                trajectoryType: HrzProtocol.TrajectoryType.BALLISTIC,
            },
        });
    }
}
</script>

<template>
    <div
        class="rounded-full p-2 backdrop-blur-md bg-slate-700/30 shadow-[0_0px_30px_rgba(0,0,0,0.3)] border border-white/10 pointer-events-auto cursor-pointer"
    >
        <div
            ref="compass"
            class="w-20 h-20 bg-slate-100 mask-[url(/resources/compass.svg)] mask-center mask-no-repeat mask-contain transition-transform"
            @click.stop="resetView"
        ></div>
    </div>
</template>
