import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { computed, EffectScope, effectScope, onScopeDispose, ref, watch, type Ref } from "vue";
import { horizonService } from "../horizon";
import { DEFAULT_IMAGERY_LAYER, IGN_ATTRIBUTION } from "../ign-catalog";
import { Layer } from "./layer";
import { createImageryRasterLayer } from "./imagery-raster-layer";

export { Layer, type BaseLayerState as LayerState } from "./layer";
export { ImageryRasterLayer, createImageryRasterLayer } from "./imagery-raster-layer";
export { DtmRasterLayer, createDtmRasterLayer } from "./dtm-raster-layer";
export { VectorLayer, createVectorLayer, type VectorRepresentation } from "./vector-layer";

interface UiLayer {
    id: number;
    layer: Layer;
}

interface ManagedLayer extends UiLayer {
    scope: EffectScope;
}

class LayersService {
    nextLayerId = 1;
    managedLayers: Ref<ManagedLayer[]> = ref([]);
    selectedLayerId: Ref<number | null> = ref(null);

    public layers = computed<UiLayer[]>(() => this.managedLayers.value);

    public selectedLayer = computed(
        () => this.layers.value.find((entry) => entry.id === this.selectedLayerId.value) ?? null,
    );

    private layerTypeArrays = computed(() => {
        const layers = this.managedLayers.value;
        let typeToIndex: Map<HrzProtocol.LayerType, Array<Layer>> = new Map();
        for (let i = 0; i < layers.length; i++) {
            const layerType = layers[i]!.layer.type;
            if (!typeToIndex.has(layerType)) {
                typeToIndex.set(layerType, []);
            }
            typeToIndex.get(layerType)!.push(layers[i]!.layer);
        }
        return typeToIndex;
    });

    constructor() {
        watch(this.layerTypeArrays, () => {
            const api = horizonService.getApi();
            if (api) {
                this.layerTypeArrays.value.forEach((layersOfType) => {
                    for (let i = 0; i < layersOfType.length; i++) {
                        layersOfType[i]!.setIndexOfType(api, i, layersOfType.length);
                    }
                });
            }
        });
    }

    addLayer(layer: Layer) {
        // The scope owns whatever watchers the layer sets up, so removeLayer can drop them
        // all without knowing what the layer type registered.
        const scope = effectScope(true);
        scope.run(() => {
            layer.watchState();
            onScopeDispose(() => {
                const api = horizonService.getApi();
                if (api) layer.cleanup(api);
            });
        });

        const ml: ManagedLayer = { id: this.nextLayerId++, layer, scope };
        this.managedLayers.value.splice(0, 0, ml);
    }

    removeLayer(id: number) {
        if (this.selectedLayerId.value === id) this.selectedLayerId.value = null;

        const index = this.managedLayers.value.findIndex((ml) => ml.id === id);
        if (index == -1) return;

        const [removedLayer] = this.managedLayers.value.splice(index, 1);
        removedLayer.scope.stop();
    }

    // fromIndex and toIndex are indices without the type's own list.
    reorderLayerOfType(type: HrzProtocol.LayerType, fromIndex: number, toIndex: number) {
        const layers = this.managedLayers.value;
        const positionsOfType = (all: ManagedLayer[]) =>
            all.map((ml, i) => (ml.layer.type === type ? i : -1)).filter((i) => i !== -1);

        const before = positionsOfType(layers);
        if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= before.length ||
            toIndex >= before.length
        ) {
            return;
        }

        const [movedLayer] = layers.splice(before[fromIndex]!, 1);

        // Recomputed after the removal, so the remaining positions have already shifted.
        const after = positionsOfType(layers);
        const insertIndex = toIndex < after.length ? after[toIndex]! : layers.length;
        layers.splice(insertIndex, 0, movedLayer!);
    }
}

export const layersService = new LayersService();

export async function addDefaultLayers(api: HrzApi.AsyncApi) {
    if (layersService.layers.value.length > 0) return;

    layersService.addLayer(
        await createImageryRasterLayer(
            api,
            DEFAULT_IMAGERY_LAYER.title,
            DEFAULT_IMAGERY_LAYER.wmtsUrl,
            DEFAULT_IMAGERY_LAYER.identifier,
            IGN_ATTRIBUTION,
        ),
    );
}
