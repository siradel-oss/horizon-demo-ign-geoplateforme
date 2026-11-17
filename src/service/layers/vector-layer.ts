import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import VectorProperties from "@/layout/layers/VectorProperties.vue";
import VectorSwatch from "@/layout/layers/VectorSwatch.vue";
import type { VectorField } from "@/service/ign-catalog";
import { hexToColor } from "@/utils";
import { Layer, type BaseLayerState } from "./layer";

const VECTOR_PALETTE = [
    "#3b82f6",
    "#ef4444",
    "#22b04d",
    "#f59e0b",
    "#a855f7",
    "#06b6d4",
    "#e94799",
    "#828c0f",
];

// Polygon fills sit at a fraction of the layer opacity so the outline still reads against
// them and the imagery underneath stays visible.
const VECTOR_FILL_OPACITY_RATIO = 0.35;

// Facades fade to this fraction of the layer colour at their base, which helps reading volumes.
const EXTRUDED_LOWER_COLOR_FACTOR = 0.55;

const DEFAULT_EXTRUSION_HEIGHT = 10;

const POLYGON_REPR = 0;
const POLYLINE_REPR = 1;
const POINT_REPR = 2;
const EXTRUDED_REPR = 3;

// The data layer declares at most one attribute: the one the extrusion reads.
const HEIGHT_ATTR_ID = 1;
const HEIGHT_ATTR_NAME = "height";

export type VectorRepresentation = "flat" | "extruded";

export interface ExtrusionSettings {
    /** Numeric attribute giving each feature's height; null extrudes everything by `height`. */
    attribute: string | null;
    /** The fixed height, or the fallback for features missing the attribute, in metres. */
    height: number;
}

export interface VectorLayerState extends BaseLayerState {
    opacity: number;
    color: string;
    representation: VectorRepresentation;
    // Each representation keeps its own settings, so switching back and forth loses nothing.
    extrusion: ExtrusionSettings;
}

interface VectorSource {
    dataLayerId: number;
    metadataUrl: string;
    sourceLayerName: string;
    attribution: string;
}

/** The attribute the current representation reads, which the data layer must declare. */
function usedAttribute(state: VectorLayerState): string | null {
    return state.representation === "extruded" ? state.extrusion.attribute : null;
}

// Extrusions follow the terrain under each vertex so their base never floats or sinks; flat
// overlays are draped onto the ground by the engine, so they need no clamping at all.
function clampModeFor(state: VectorLayerState): HrzProtocol.VectorClampMode {
    return state.representation === "extruded"
        ? HrzProtocol.VectorClampMode.PER_VERTEX
        : HrzProtocol.VectorClampMode.NO_CLAMPING;
}

function strokeColor(state: VectorLayerState): HrzProtocol.Color.$Properties {
    return hexToColor(state.color, Math.min(state.opacity / VECTOR_FILL_OPACITY_RATIO, 1));
}

function fillColor(state: VectorLayerState): HrzProtocol.Color.$Properties {
    return hexToColor(state.color, state.opacity);
}

// Volumes use the stroke alpha: at the default opacity they are opaque, like the outlines.
function extrudedColors(state: VectorLayerState) {
    const color = strokeColor(state);
    return {
        upper: color,
        roof: color,
        lower: {
            r: color.r! * EXTRUDED_LOWER_COLOR_FACTOR,
            g: color.g! * EXTRUDED_LOWER_COLOR_FACTOR,
            b: color.b! * EXTRUDED_LOWER_COLOR_FACTOR,
            a: color.a,
        },
    };
}

function buildStylingScript(state: VectorLayerState): string {
    let polygon: string;
    if (state.representation === "extruded") {
        // A missing value leaves the property at its default, which is the fixed height.
        const setHeight = usedAttribute(state)
            ? `if (not is_nan(attr("${HEIGHT_ATTR_NAME}"))) { set "extrusion" = attr("${HEIGHT_ATTR_NAME}"); }`
            : "";
        polygon = `${setHeight} emit ${EXTRUDED_REPR};`;
    } else {
        polygon = `fork { emit ${POLYGON_REPR}; } emit ${POLYLINE_REPR};`;
    }

    return `
        if (attr("geom_type") == enum("VectorGeometryType", "POLYGON_GEOMETRY")) {
            ${polygon}
        }
        elif (attr("geom_type") == enum("VectorGeometryType", "POLYLINE_GEOMETRY")) {
            emit ${POLYLINE_REPR};
        }
        else {
            emit ${POINT_REPR};
        }
    `;
}

function buildStyle(
    state: VectorLayerState,
    zIndex: number,
): HrzProtocol.VectorTilesStyle.$Properties {
    const stroke = strokeColor(state);
    const extruded = extrudedColors(state);

    return {
        featureTypeAttributeName: "geom_type",
        stylingScript: buildStylingScript(state),
        attributes: usedAttribute(state)
            ? [{ vectorDataAttrId: HEIGHT_ATTR_ID, stylingName: HEIGHT_ATTR_NAME }]
            : [],
        representations: [
            {
                id: POLYGON_REPR,
                sceneViews: { bits: 1 },
                flatOverlayPolygon: {
                    color: { defaultValue: fillColor(state) },
                    zIndex,
                    clipToTile: true,
                },
            },
            {
                id: POLYLINE_REPR,
                sceneViews: { bits: 1 },
                flatOverlayPolyline: {
                    color: { defaultValue: stroke },
                    width: { defaultValue: 2 },
                    widthUnit: HrzProtocol.InWorldSizeUnit.IN_WORLD_SIZE_IN_PIXELS,
                    roundTips: true,
                    zIndex,
                    clipToTile: true,
                },
            },
            {
                id: POINT_REPR,
                sceneViews: { bits: 1 },
                flatOverlayPoint: {
                    color: { defaultValue: stroke },
                    radius: { defaultValue: 5 },
                    radiusUnit: HrzProtocol.InWorldSizeUnit.IN_WORLD_SIZE_IN_PIXELS,
                    zIndex,
                    clipToTile: true,
                },
            },
            {
                id: EXTRUDED_REPR,
                sceneViews: { bits: 1 },
                extrudedGeometry: {
                    extrusion: { name: "extrusion", defaultValue: state.extrusion.height },
                    upperColor: { defaultValue: extruded.upper },
                    lowerColor: { defaultValue: extruded.lower },
                    roofColor: { defaultValue: extruded.roof },
                    lighting: { enableLighting: true, castShadows: true, receiveShadows: true },
                    clipToTile: true,
                },
            },
        ],
    };
}

function buildDataLayer(
    source: VectorSource,
    attribute: string | null,
): HrzProtocol.VectorDataLayer.$Properties {
    return {
        id: source.dataLayerId,
        sources: [
            {
                hasGeometry: true,
                attributes: attribute
                    ? [
                          {
                              id: HEIGHT_ATTR_ID,
                              sourceName: attribute,
                              transform:
                                  HrzProtocol.AttributeTransform.ATTRIBUTE_TRANSFORM_TO_NUMBER,
                          },
                      ]
                    : [],
                tilejsonDataProvider: {
                    url: source.metadataUrl,
                    httpHeaders: {},
                    layerName: source.sourceLayerName,
                    attribution: source.attribution,
                },
            },
        ],
    };
}

export class VectorLayer extends Layer<VectorLayerState> {
    public readonly type: HrzProtocol.LayerType = HrzProtocol.LayerType.VECTOR_TILES;

    public readonly properties = VectorProperties;
    public readonly listDecoration = VectorSwatch;

    private currentZIndex: number = -1;

    constructor(
        name: string,
        handle: HrzProtocol.LayerHandle,
        private readonly dataHandle: HrzProtocol.LayerHandle,
        private readonly source: VectorSource,
        /** The attributes the source layer declares, whether or not they are loaded. */
        public readonly fields: VectorField[],
        state: VectorLayerState,
    ) {
        super(name, handle, state);
    }

    override watchState(): void {
        super.watchState();
        this.watchProperty(
            () => [this.state.color, this.state.opacity] as const,
            (api) => this.applyColors(api),
        );
        this.watchProperty(
            () => this.state.extrusion.height,
            (api, height) => {
                HrzApi.VectorTilesLayerPathBuilder.create(this.handle)
                    .style()
                    .representations(EXTRUDED_REPR)
                    .extrudedGeometry()
                    .extrusion()
                    .defaultValue()
                    .set(api, height);
            },
        );
        this.watchProperty(
            () => [this.state.representation, usedAttribute(this.state)] as const,
            (api) => this.applyRepresentation(api),
        );
    }

    protected setVisibility(api: HrzApi.AsyncApi, visible: boolean): void {
        HrzApi.VectorTilesLayerPathBuilder.create(this.handle).visible().set(api, visible);
    }

    setIndexOfType(api: HrzApi.AsyncApi, index: number, total: number): void {
        const zIndex = total - 1 - index;

        if (this.currentZIndex === zIndex) return;

        this.currentZIndex = zIndex;

        const style = HrzApi.VectorTilesLayerPathBuilder.create(this.handle).style();
        style.representations(POLYGON_REPR).flatOverlayPolygon().zIndex().set(api, zIndex);
        style.representations(POLYLINE_REPR).flatOverlayPolyline().zIndex().set(api, zIndex);
        style.representations(POINT_REPR).flatOverlayPoint().zIndex().set(api, zIndex);
    }

    private loadedAttribute: string | null = null;
    private currentClampMode = clampModeFor(this.state);

    // Switching representations rewrites the whole style, and reloads the data when the
    // attribute to load changes. Both are rare, deliberate actions, so the cost is fine.
    private async applyRepresentation(api: HrzApi.AsyncApi): Promise<void> {
        const attribute = usedAttribute(this.state);
        const style = buildStyle(this.state, Math.max(this.currentZIndex, 0));
        const setStyle = () =>
            HrzApi.VectorTilesLayerPathBuilder.create(this.handle).style().set(api, style);
        const setData = () =>
            HrzApi.VectorDataLayerPathBuilder.create(this.dataHandle).set(
                api,
                buildDataLayer(this.source, attribute),
            );

        const clampMode = clampModeFor(this.state);
        if (clampMode !== this.currentClampMode) {
            this.currentClampMode = clampMode;
            await HrzApi.VectorTilesLayerPathBuilder.create(this.handle)
                .clamping()
                .method()
                .set(api, clampMode);
        }

        if (attribute === this.loadedAttribute) {
            await setStyle();
            return;
        }

        this.loadedAttribute = attribute;
        // The style must never reference an attribute the data layer doesn't declare.
        if (attribute !== null) {
            await setData();
            await setStyle();
        } else {
            await setStyle();
            await setData();
        }
    }

    private applyColors(api: HrzApi.AsyncApi): void {
        const style = HrzApi.VectorTilesLayerPathBuilder.create(this.handle).style();
        const stroke = strokeColor(this.state);
        const extruded = extrudedColors(this.state);
        style
            .representations(POLYGON_REPR)
            .flatOverlayPolygon()
            .color()
            .defaultValue()
            .set(api, fillColor(this.state));
        style
            .representations(POLYLINE_REPR)
            .flatOverlayPolyline()
            .color()
            .defaultValue()
            .set(api, stroke);
        style
            .representations(POINT_REPR)
            .flatOverlayPoint()
            .color()
            .defaultValue()
            .set(api, stroke);

        const extrudedGeometry = style.representations(EXTRUDED_REPR).extrudedGeometry();
        extrudedGeometry.upperColor().defaultValue().set(api, extruded.upper);
        extrudedGeometry.lowerColor().defaultValue().set(api, extruded.lower);
        extrudedGeometry.roofColor().defaultValue().set(api, extruded.roof);
    }

    override cleanup(api: HrzApi.AsyncApi): void {
        api.LayerService.destroyLayer(this.handle);
        api.LayerService.destroyLayer(this.dataHandle);
    }
}

let nextVectorDataLayerId = 1;
let nextPaletteIndex = 0;

export async function createVectorLayer(
    api: HrzApi.AsyncApi,
    name: string,
    metadataUrl: string,
    sourceLayerName: string,
    fields: VectorField[],
    attribution: string,
): Promise<VectorLayer> {
    const source: VectorSource = {
        dataLayerId: nextVectorDataLayerId++,
        metadataUrl,
        sourceLayerName,
        attribution,
    };
    const state: VectorLayerState = {
        visible: true,
        opacity: VECTOR_FILL_OPACITY_RATIO,
        color: VECTOR_PALETTE[nextPaletteIndex++ % VECTOR_PALETTE.length]!,
        representation: "flat",
        extrusion: { attribute: null, height: DEFAULT_EXTRUSION_HEIGHT },
    };

    const tilesLayerModel = new HrzProtocol.VectorTilesLayer({
        source: { vectorDataLayerId: source.dataLayerId },
        style: buildStyle(state, 0),
        clamping: { method: clampModeFor(state) },
        resolution: { maxScreenSpaceError: 4 },
        visible: true,
        clipId: -1,
        lighting: { enableLighting: true, castShadows: true, receiveShadows: true },
        staticTiles: true,
        sceneViews: { bits: 1 },
    });

    const dataHandle = await api.LayerService.createLayer({
        name: `${name} (data)`,
        type: HrzProtocol.LayerType.VECTOR_DATA,
    });
    const handle = await api.LayerService.createLayer({
        name,
        type: HrzProtocol.LayerType.VECTOR_TILES,
    });

    await HrzApi.VectorDataLayerPathBuilder.create(dataHandle).set(
        api,
        new HrzProtocol.VectorDataLayer(buildDataLayer(source, usedAttribute(state))),
    );
    await HrzApi.VectorTilesLayerPathBuilder.create(handle).set(api, tilesLayerModel);

    return new VectorLayer(name, handle, dataHandle, source, fields, state);
}
