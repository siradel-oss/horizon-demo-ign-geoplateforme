<script setup lang="ts">
import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzCoreBackend, type HrzCoreRuntimeFile } from "@siradel-oss/horizon-core";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { onMounted, ref, useTemplateRef, watch } from "vue";
import AttributionsWindow from "./layout/AttributionsWindow.vue";
import LayersWindow from "./layout/LayersWindow.vue";
import LayerPropertiesWindow from "./layout/LayerPropertiesWindow.vue";
import IconButton from "./components/IconButton.vue";
import SearchWindow from "./layout/SearchWindow.vue";
import { horizonService } from "./service/horizon";
import { addDefaultLayers } from "./service/layers";
import LightingWindow from "./layout/LightingWindow.vue";
import CompassOverlay from "./layout/CompassOverlay.vue";
import LoadingIndicator from "./components/LoadingIndicator.vue";
import Icon from "./components/Icon.vue";
import CatalogWindow from "./layout/CatalogWindow.vue";
import { useI18n } from "./service/i18n";
import AboutWindow from "./layout/AboutWindow.vue";
import SiradelLogo from "./components/SiradelLogo.vue";
import { LINKS } from "./links";
import { PHONE } from "./service/device";

const { t } = useI18n();

const VIEWER_OPTIONS = new HrzProtocol.ViewerOptions({
    showLoadingScreen: true,
    keyBindings: {
        bindings: [
            {
                action: HrzProtocol.KeyAction.TOGGLE_DEV_UI,
                key: HrzProtocol.Key.K_P,
            },
            {
                action: HrzProtocol.KeyAction.RESET_NORTH,
                key: HrzProtocol.Key.K_R,
            },
            {
                action: HrzProtocol.KeyAction.MOD_KEY,
                key: HrzProtocol.Key.K_CTRL,
            },
        ],
    },
    graphicsSettingsOverrides: {
        atmosphereEnabled: true,
    },
});

async function goToDefaultViewpoint(api: HrzApi.AsyncApi, duration: number) {
    api.CameraService.setOrbit({
        cameraIndex: HrzProtocol.CameraIndex.CAMERA_0,
        bounds: {
            bounds: {
                west: -5.668945,
                south: 41.804078,
                east: 10.371094,
                north: 52.025459,
            },
            tilt: 0,
        },
        goToAnimation: {
            duration: duration,
            easingExponent: 2,
            easingFunction: HrzProtocol.EasingFunctions.EASE_INOUT,
            trajectoryType: HrzProtocol.TrajectoryType.BALLISTIC,
        },
        maxAltitude: 100000000,
        minTilt: 0,
        maxTilt: Math.PI,
    });
}

const canvas = useTemplateRef("hrz-canvas");

let attributionsOpen = ref(false);
let layersOpen = ref(false);
let searchOpen = ref(false);
let lightingOpen = ref(false);
let catalogOpen = ref(false);
let isFullscreen = ref(false);

// The about window opens once, on the first visit.
const ABOUT_SEEN_KEY = "horizon-demo-ign-geoplateforme:about-seen";
let aboutOpen = ref(false);
try {
    aboutOpen.value = !localStorage.getItem(ABOUT_SEEN_KEY);
    localStorage.setItem(ABOUT_SEEN_KEY, "1");
} catch {
    aboutOpen.value = true;
}
let successiveIsNotWorking = ref<number>(0);
let warningMsg = ref("");

async function checkIsWorking(api: HrzApi.AsyncApi) {
    let isWorking = await api.ViewerService.isWorking();
    if (!isWorking.value) {
        successiveIsNotWorking.value++;
    } else {
        successiveIsNotWorking.value = 0;
    }
}

function closeLeftWindows() {
    layersOpen.value = false;
    searchOpen.value = false;
    lightingOpen.value = false;
}

watch(
    horizonService.api,
    (api) => {
        if (api) {
            onHorizonReady(api);
        }
    },
    { immediate: true },
);

async function onHorizonReady(api: HrzApi.AsyncApi) {
    await goToDefaultViewpoint(api, 0);
    await addDefaultLayers(api);

    setInterval(() => checkIsWorking(api), 100);

    horizonService.onMessage("viewerReady", async () => {
        if (api) {
            const cfg = await api.ViewerService.getConfiguration();
            // Phones run at a lower level on purpose: no warning there.
            if (!PHONE && cfg.graphicsProfile != HrzProtocol.GraphicsLevel.GRAPHICS_LEVEL_HIGH) {
                warningMsg.value = t("graphics_level_warnings_msg");
            }

            HrzApi.SceneViewSettingsPathBuilder.create(HrzProtocol.SceneViewIndex.SCENE_VIEW_0)
                .terrain()
                .terrainColor()
                .set(api, { r: 0.9, g: 0.9, b: 0.9, a: 1 });
        }
    });
}

onMounted(() => {
    if (!canvas.value) {
        console.error("Canvas not found");
        return;
    }

    HrzCoreBackend.init(
        canvas.value,
        (asset: HrzCoreRuntimeFile) => {
            switch (asset) {
                case "hrz_core.js":
                    return new URL("@siradel-oss/horizon-core/dist/hrz_core.js", import.meta.url)
                        .href;
                case "hrz_core.wasm":
                    return new URL("@siradel-oss/horizon-core/dist/hrz_core.wasm", import.meta.url)
                        .href;
            }
            throw new Error(`Unknown runtime file: ${asset}`);
        },
        VIEWER_OPTIONS,
        (backend: HrzCoreBackend | null, initStatus: HrzProtocol.ViewerInitStatus) => {
            if (initStatus === HrzProtocol.ViewerInitStatus.INIT_SUCCESS && backend) {
                horizonService.initialize(backend);
            }
        },
    );
});

function closeWindows() {
    if (aboutOpen.value) {
        aboutOpen.value = false;
    } else if (catalogOpen.value) {
        catalogOpen.value = false;
    } else if (attributionsOpen.value) {
        attributionsOpen.value = false;
    } else {
        closeLeftWindows();
    }
}

document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}
</script>

<template>
    <div
        class="w-screen h-dvh relative bg-slate-700 overflow-clip select-none"
        @keydown.escape="closeWindows"
        tabindex="0"
    >
        <div class="absolute inset-0">
            <canvas ref="hrz-canvas" class="w-full h-full touch-none focus:outline-none"></canvas>
        </div>
        <div
            class="absolute top-4 bottom-4 left-4 gap-4 flex flex-row items-start pointer-events-none max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:gap-0"
        >
            <!-- Phone: the tool column becomes a bar along the bottom edge. -->
            <div
                class="z-50 max-sm:z-30 pointer-events-auto h-full p-3 flex flex-col gap-2 items-center shadow-[0_0px_30px_rgba(0,0,0,0.3)] rounded-xl backdrop-blur-md bg-slate-700/30 border border-white/10 max-sm:w-full max-sm:h-(--toolbar-h) max-sm:flex-row max-sm:justify-between max-sm:gap-0 max-sm:px-2 max-sm:py-0 max-sm:pb-[env(safe-area-inset-bottom)] max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:bg-slate-800/80"
            >
                <IconButton
                    icon="layers"
                    :tooltip="t('layers')"
                    :active="layersOpen"
                    @click="
                        !layersOpen && closeLeftWindows();
                        layersOpen = !layersOpen;
                    "
                />
                <IconButton
                    icon="shelves"
                    :tooltip="t('catalog')"
                    :active="catalogOpen"
                    @click="catalogOpen = !catalogOpen"
                />
                <IconButton
                    icon="search"
                    :tooltip="t('address_search')"
                    :active="searchOpen"
                    @click="
                        !searchOpen && closeLeftWindows();
                        searchOpen = !searchOpen;
                    "
                />
                <IconButton
                    icon="sunny"
                    :tooltip="t('lighting')"
                    :active="lightingOpen"
                    @click="
                        !lightingOpen && closeLeftWindows();
                        lightingOpen = !lightingOpen;
                    "
                />
                <div class="grow max-sm:hidden"></div>
                <IconButton
                    icon="info"
                    :tooltip="t('about.open')"
                    :active="aboutOpen"
                    @click="aboutOpen = !aboutOpen"
                />
                <IconButton
                    :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                    :tooltip="t('fullscreen')"
                    :active="isFullscreen"
                    @click="toggleFullscreen()"
                />
                <IconButton
                    icon="license"
                    :tooltip="t('attributions')"
                    :active="attributionsOpen"
                    @click="attributionsOpen = !attributionsOpen"
                />
            </div>
            <div class="relative">
                <LayersWindow v-model:open="layersOpen" class="pointer-events-auto" />
                <LayerPropertiesWindow v-if="layersOpen" class="pointer-events-auto" />
                <SearchWindow v-model:open="searchOpen" class="pointer-events-auto" />
                <LightingWindow v-model:open="lightingOpen" class="pointer-events-auto" />
            </div>
        </div>
        <CompassOverlay class="absolute bottom-4 right-4 max-sm:bottom-auto max-sm:top-10 max-sm:right-2" />
        <AttributionsWindow v-model:open="attributionsOpen" />
        <CatalogWindow v-model:open="catalogOpen" />
        <AboutWindow v-model:open="aboutOpen" />
        <a
            :href="LINKS.siradel"
            target="_blank"
            rel="noopener"
            class="absolute top-4 right-4 h-3.5 flex text-white/70 hover:text-white transition-colors"
            aria-label="Siradel"
            title="Siradel"
        >
            <SiradelLogo />
        </a>
        <Transition name="fade">
            <LoadingIndicator
                class="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-sm:bottom-[calc(var(--toolbar-h)+0.5rem)]"
                v-show="successiveIsNotWorking < 5"
            />
        </Transition>
        <div class="absolute top-5 left-1/2 transform -translate-x-1/2">
            <div
                v-if="warningMsg"
                class="text-sm bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 pr-6 rounded relative max-w-150"
                role="alert"
            >
                <strong class="font-bold">{{ t("warning") }}</strong>
                &nbsp;
                <span>{{ warningMsg }}</span>
                <button @click="warningMsg = ''" class="cursor-pointer flex absolute right-2 top-2">
                    <Icon icon="close" size="sm" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
