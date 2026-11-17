import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import ImageryRasterProperties from "@/layout/layers/ImageryRasterProperties.vue";
import { Layer, type BaseLayerState } from "./layer";

export interface ImageryRasterLayerState extends BaseLayerState {
    opacity: number;
}

export class ImageryRasterLayer extends Layer<ImageryRasterLayerState> {
    public readonly type: HrzProtocol.LayerType = HrzProtocol.LayerType.IMAGERY_RASTER;

    public readonly properties = ImageryRasterProperties;

    private static readonly GROUPS = [
        HrzProtocol.RasterGroup.TOP_RASTER_GROUP,
        HrzProtocol.RasterGroup.MIDDLE_RASTER_GROUP,
        HrzProtocol.RasterGroup.BOTTOM_RASTER_GROUP,
    ];

    private currentGroup: HrzProtocol.RasterGroup = HrzProtocol.RasterGroup.BOTTOM_RASTER_GROUP;
    private currentSlot: number = 0;

    constructor(name: string, handle: HrzProtocol.LayerHandle) {
        super(name, handle, { visible: true, opacity: 1 });
    }

    override watchState(): void {
        super.watchState();
        this.watchProperty(
            () => this.state.opacity,
            (api, opacity) =>
                HrzApi.ImageryRasterLayerPathBuilder.create(this.handle)
                    .raster()
                    .blending()
                    .opacity()
                    .set(api, opacity),
        );
    }

    protected setVisibility(api: HrzApi.AsyncApi, visible: boolean): void {
        HrzApi.ImageryRasterLayerPathBuilder.create(this.handle).visible().set(api, visible);
    }

    setIndexOfType(api: HrzApi.AsyncApi, index: number, total: number): void {
        const groupCount = ImageryRasterLayer.GROUPS.length;
        const groupIndex = Math.min(Math.floor((index * groupCount) / total), groupCount - 1);
        const group = ImageryRasterLayer.GROUPS[groupIndex]!;
        const slot = 999 - index;

        if (this.currentSlot === slot && this.currentGroup === group) return;

        this.currentSlot = slot;
        this.currentGroup = group;

        const pathBuilder = HrzApi.ImageryRasterLayerPathBuilder.create(this.handle);
        pathBuilder.slot().set(api, slot);
        pathBuilder.group().set(api, group);
    }
}

export async function createImageryRasterLayer(
    api: HrzApi.AsyncApi,
    name: string,
    wmtsUrl: string,
    layerIdentifier: string,
    attribution: string,
): Promise<ImageryRasterLayer> {
    const layerModel = new HrzProtocol.ImageryRasterLayer({
        raster: {
            provider: {
                wmts: {
                    url: wmtsUrl,
                    attribution,
                    layerIdentifier,
                    imageFormat: HrzProtocol.ImageFormat.SRGBA_8,
                    missingTilePolicy: HrzProtocol.MissingTilePolicy.USE_LOWER_RESOLUTION,
                },
            },
            sampling: {
                filtering: HrzProtocol.TextureFiltering.BILINEAR,
                alphaChannelUsage: HrzProtocol.AlphaChannelUsage.USE_ALPHA_CHANNEL,
                nodataHandling: HrzProtocol.NodataHandling.IGNORE_NODATA,
            },
            blending: {
                opacity: 1,
            },
            displayBounds: {
                east: 180,
                north: 90,
                south: -90,
                west: -180,
            },
        },
        visible: true,
        sceneViews: {
            bits: 1,
        },
    });

    const handle = await api.LayerService.createLayer({
        name,
        type: HrzProtocol.LayerType.IMAGERY_RASTER,
    });
    await HrzApi.ImageryRasterLayerPathBuilder.create(handle).set(api, layerModel);

    return new ImageryRasterLayer(name, handle);
}
