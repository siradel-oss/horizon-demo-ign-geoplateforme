import { HrzApi } from "@siradel-oss/horizon-api";
import { HrzProtocol } from "@siradel-oss/horizon-protocol";
import { Layer, type BaseLayerState } from "./layer";

// IGN serves elevation as 32-bit BIL. The engine can't infer the tile layout from that
// media type, so the provider needs the source format plus a mimeTypeOverride spelling the
// raw layout out. Every tile matrix set in the IGN WMTS catalogs is 256x256.
const BIL32_SOURCE_FORMAT = "image/x-bil;bits=32";
const BIL32_MIME_TYPE_OVERRIDE =
    "image/x.raw;width=256;height=256;channels=1;bit_width=32;interleaving=line";
const BIL32_NODATA_VALUE = -99999;

export class DtmRasterLayer extends Layer<BaseLayerState> {
    public readonly type: HrzProtocol.LayerType = HrzProtocol.LayerType.DTM_RASTER;

    private currentSlot: number = -1;

    constructor(name: string, handle: HrzProtocol.LayerHandle) {
        super(name, handle, { visible: true });
    }

    protected setVisibility(api: HrzApi.AsyncApi, visible: boolean): void {
        HrzApi.DtmRasterLayerPathBuilder.create(this.handle).visible().set(api, visible);
    }

    setIndexOfType(api: HrzApi.AsyncApi, index: number, total: number): void {
        const slot = 999 - index;

        if (this.currentSlot === slot) return;

        this.currentSlot = slot;

        HrzApi.DtmRasterLayerPathBuilder.create(this.handle).slot().set(api, slot);
    }
}

export async function createDtmRasterLayer(
    api: HrzApi.AsyncApi,
    name: string,
    wmtsUrl: string,
    layerIdentifier: string,
    attribution: string,
): Promise<DtmRasterLayer> {
    const layerModel = new HrzProtocol.DtmRasterLayer({
        raster: {
            provider: {
                wmts: {
                    url: wmtsUrl,
                    attribution,
                    layerIdentifier,
                    sourceImageFormat: BIL32_SOURCE_FORMAT,
                    imageFormat: HrzProtocol.ImageFormat.R_F32,
                    mimeTypeOverride: BIL32_MIME_TYPE_OVERRIDE,
                    nodata: {
                        hasNodata: true,
                        value: {
                            floatValue: BIL32_NODATA_VALUE,
                        },
                    },
                },
            },
            sampling: {
                filtering: HrzProtocol.TextureFiltering.BILINEAR,
                nodataHandling: HrzProtocol.NodataHandling.DISCARD_NODATA_PIXELS,
            },
            displayBounds: {
                east: 180,
                north: 90,
                south: -90,
                west: -180,
            },
        },
        visible: true,
    });

    const handle = await api.LayerService.createLayer({
        name,
        type: HrzProtocol.LayerType.DTM_RASTER,
    });
    await HrzApi.DtmRasterLayerPathBuilder.create(handle).set(api, layerModel);

    return new DtmRasterLayer(name, handle);
}
