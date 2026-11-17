import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { reactive, watch, type Component } from "vue";
import { horizonService } from "../horizon";

export interface BaseLayerState {
    visible: boolean;
}

/**
 * The LayerState contains layer properties such as opacity, color, etc.
 */
export abstract class Layer<S extends BaseLayerState = BaseLayerState> {
    public abstract readonly type: HrzProtocol.LayerType;

    public readonly state: S;

    /** Rendered between the visibility toggle and the name, e.g. a colour disc. */
    public readonly listDecoration: Component | null = null;

    /** Rendered in the properties window. Null means the layer has nothing to adjust. */
    public readonly properties: Component | null = null;

    constructor(
        public readonly name: string,
        public readonly handle: HrzProtocol.LayerHandle,
        state: S,
    ) {
        this.state = reactive(state) as S;
    }

    /**
     * Called once by the layers service inside an effect scope it owns. Override to push
     * this type's own state to the engine, calling super to keep the shared watchers.
     */
    watchState(): void {
        this.watchProperty(
            () => this.state.visible,
            (api, visible) => this.setVisibility(api, visible),
        );
    }

    /** Runs `apply` whenever `get` changes, once the viewer is available. */
    protected watchProperty<T>(get: () => T, apply: (api: HrzApi.AsyncApi, value: T) => void) {
        watch(get, (value) => {
            const api = horizonService.getApi();
            if (api) apply(api, value);
        });
    }

    protected abstract setVisibility(api: HrzApi.AsyncApi, visible: boolean): void;

    /** Applies this layer's position within the layers of its own type. */
    abstract setIndexOfType(api: HrzApi.AsyncApi, index: number, total: number): void;

    cleanup(api: HrzApi.AsyncApi): void {
        api.LayerService.destroyLayer(this.handle);
    }
}
