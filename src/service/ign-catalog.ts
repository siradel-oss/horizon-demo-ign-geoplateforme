export interface Catalog {
    name: string;
    wmtsUrl?: string;
    wmsrUrl?: string;
    wmsvUrl?: string;
    tmsUrl?: string;
    /** A single TileJSON document whose vector layers each become a catalog entry. */
    tileJsonUrl?: string;
}

export const CATALOGS: Catalog[] = [
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/administratif.xml",
        name: "Administratif",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/agriculture.xml",
        name: "Agriculture",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/altimetrie.xml",
        name: "Altimétrie",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/cartes.xml",
        name: "Cartes",
    },
    {
        wmsrUrl: "https://data.geopf.fr/annexes/ressources/wms-r/cartovecto.xml",
        wmsvUrl: "https://data.geopf.fr/annexes/ressources/wms-v/cartovecto.xml",
        name: "Cartographie vectorielle",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/clc.xml",
        name: "Corine Land Cover",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/economie.xml",
        name: "Économie et statistique",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/enr.xml",
        wmsrUrl: "https://data.geopf.fr/annexes/ressources/wms-r/enr.xml",
        wmsvUrl: "https://data.geopf.fr/annexes/ressources/wms-v/enr.xml",
        name: "Énergies renouvelables",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/environnement.xml",
        name: "Environnement",
    },
    {
        wmsvUrl: "https://data.geopf.fr/annexes/ressources/wms-v/geodesie.xml",
        name: "Géodésie",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/ortho.xml",
        name: "Image aérienne",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/orthohisto.xml",
        name: "Image aérienne historique",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/satellite.xml",
        name: "Image satellitaire",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/sol.xml",
        name: "Occupation du sol",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/ocsge-ng.xml",
        name: "OCS GE",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/parcellaire.xml",
        name: "Parcellaire",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/topographie.xml",
        name: "Topographie",
    },
    {
        wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/transports.xml",
        name: "Transports",
    },
    {
        tmsUrl: "https://data.geopf.fr/tms/1.0.0/",
        name: "Tuiles vectorielles",
    },
    {
        tileJsonUrl: "https://openmaptiles.geo.data.gouv.fr/data/planet-vector.json",
        // Not a Géoplateforme service: OpenStreetMap tiles served by the DINUM.
        name: "OpenMapTiles (data.gouv.fr)",
    },
];

export type LayerType = "WMTS" | "TMS" | "TILEJSON";
export enum TileType {
    IMAGERY = "imagery",
    ELEVATION = "elevation",
    VECTOR = "vector",
}

export interface Layer {
    title: string;
    identifier: string;
    layerType: LayerType;
    tileType: TileType;
    /** Vector only: the TileJSON document describing the tileset. */
    metadataUrl?: string;
    /** Vector only: the source layer inside the tileset, e.g. "cimetiere". */
    sourceLayerName?: string;
    /** Vector only: the attributes the source layer declares. */
    fields?: VectorField[];
    /** TMS only: the tileset the source layer belongs to, e.g. "BDTOPO". */
    tilesetId?: string;
    /** TileJSON only: the tileset's attribution, known from the catalog itself. */
    attribution?: string;
}

export type VectorFieldType = "number" | "string" | "boolean";

export interface VectorField {
    name: string;
    type: VectorFieldType;
}

function parseVectorFieldType(type: string): VectorFieldType {
    let normalized = type.toLowerCase();
    if (
        normalized === "number" ||
        normalized === "integer" ||
        normalized === "bigint" ||
        normalized === "smallint" ||
        normalized === "real" ||
        normalized === "double precision" ||
        normalized.startsWith("numeric")
    ) {
        return "number";
    }
    if (normalized === "boolean") return "boolean";
    return "string";
}

type RawVectorFields = Record<string, string | { type?: string }>;

// Localized names ("name:fr", "name_en"...) are skipped: OpenMapTiles has around ninety of
// them per layer and they would drown the useful attributes.
export function parseVectorFields(fields: RawVectorFields | undefined): VectorField[] {
    return Object.entries(fields ?? {})
        .filter(([name]) => !name.startsWith("name:") && !name.startsWith("name_"))
        .map(([name, value]) => ({
            name,
            type: parseVectorFieldType(typeof value === "string" ? value : (value.type ?? "")),
        }));
}

export const IGN_ATTRIBUTION = "IGN – Géoplateforme";

export const DEFAULT_IMAGERY_LAYER = {
    title: "Photographies aériennes",
    wmtsUrl: "https://data.geopf.fr/annexes/ressources/wmts/ortho.xml",
    identifier: "ORTHOIMAGERY.ORTHOPHOTOS",
};

function parseWmtsCatalog(dom: Document): Layer[] {
    let layers: Layer[] = [];
    let layerElements = dom.querySelectorAll("Contents > Layer");
    for (let i = 0; i < layerElements.length; i++) {
        let layerElement = layerElements[i]!;
        let title = layerElement.getElementsByTagName("ows:Title")[0]!.textContent!.trim();
        let identifier = layerElement
            .getElementsByTagName("ows:Identifier")[0]!
            .textContent!.trim();

        let format = layerElement.getElementsByTagName("Format")[0]!.textContent!.trim();
        let tileType: TileType;
        if (format == "image/png" || format == "image/jpeg") {
            tileType = TileType.IMAGERY;
        } else if (format == "image/x-bil;bits=32") {
            tileType = TileType.ELEVATION;
        } else {
            throw new Error(`Unsupported layer format: ${format}`);
        }

        layers.push({
            title,
            identifier,
            layerType: "WMTS",
            tileType,
        });
    }

    return layers;
}

interface Tileset {
    id: string;
    title: string;
}

// The TMS service lists raster pyramids and vector tilesets side by side; only the latter
// carry `extension="pbf"`.
function parseTmsCatalog(dom: Document): Tileset[] {
    let tilesets: Tileset[] = [];
    let tileMapElements = dom.querySelectorAll("TileMaps > TileMap");
    for (let i = 0; i < tileMapElements.length; i++) {
        let tileMapElement = tileMapElements[i]!;
        if (tileMapElement.getAttribute("extension") !== "pbf") continue;

        let href = tileMapElement.getAttribute("href") ?? "";
        let id = href.substring(href.lastIndexOf("/") + 1);
        if (id === "") continue;

        tilesets.push({ id, title: tileMapElement.getAttribute("title") ?? id });
    }

    return tilesets;
}

function humanizeSourceLayerName(name: string): string {
    let spaced = name.replace(/_/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface TileJson {
    attribution?: string;
    vector_layers?: { id: string; fields?: RawVectorFields }[];
}

// A tileset bundles several source layers (BD TOPO alone has around fifty) and Horizon draws
// one source layer per layer, so each one becomes its own catalog entry.
function tileJsonLayers(
    metadataUrl: string,
    metadata: TileJson,
    titlePrefix: string,
    entry: Pick<Layer, "layerType" | "tilesetId" | "attribution">,
): Layer[] {
    return (metadata.vector_layers ?? []).map((sourceLayer): Layer => ({
        ...entry,
        title: `${titlePrefix} — ${humanizeSourceLayerName(sourceLayer.id)}`,
        identifier: `${entry.tilesetId ?? titlePrefix}.${sourceLayer.id}`,
        tileType: TileType.VECTOR,
        metadataUrl,
        sourceLayerName: sourceLayer.id,
        fields: parseVectorFields(sourceLayer.fields),
    }));
}

async function fetchTilesetLayers(tmsUrl: string, tileset: Tileset): Promise<Layer[]> {
    let metadataUrl = `${tmsUrl}${tileset.id}/metadata.json`;
    let metadata: TileJson = await fetch(metadataUrl).then((res) => res.json());

    return tileJsonLayers(metadataUrl, metadata, tileset.title, {
        layerType: "TMS",
        tilesetId: tileset.id,
    });
}

function htmlToText(html: string): string {
    return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? "";
}

async function fetchTileJsonCatalog(catalog: Catalog): Promise<Layer[]> {
    let metadataUrl = catalog.tileJsonUrl!;
    let metadata: TileJson = await fetch(metadataUrl).then((res) => res.json());

    return tileJsonLayers(metadataUrl, metadata, catalog.name, {
        layerType: "TILEJSON",
        attribution: htmlToText(metadata.attribution ?? ""),
    });
}

async function fetchTmsCatalog(tmsUrl: string): Promise<Layer[]> {
    let tilesets = await fetch(tmsUrl)
        .then((res) => res.text())
        .then((text) => new DOMParser().parseFromString(text, "application/xml"))
        .then((xml) => parseTmsCatalog(xml));

    // One tileset failing to describe itself shouldn't take the whole catalog down.
    let layerLists = await Promise.all(
        tilesets.map((tileset) => fetchTilesetLayers(tmsUrl, tileset).catch(() => [] as Layer[])),
    );

    return layerLists.flat();
}

let tilesetAttributions: Map<string, Promise<string>> = new Map();

// Only a handful of tilesets name a third-party owner (ONF, Gis Sol...); the rest are IGN's
// own. The lookup is memoized because a tileset usually contributes several layers.
export function fetchTilesetAttribution(tmsUrl: string, tilesetId: string): Promise<string> {
    let cached = tilesetAttributions.get(tilesetId);
    if (cached) return cached;

    let attribution = fetch(`${tmsUrl}${tilesetId}`)
        .then((res) => res.text())
        .then((text) => new DOMParser().parseFromString(text, "application/xml"))
        .then((xml) => xml.querySelector("Attribution > Title")?.textContent?.trim())
        .then((title) => title || IGN_ATTRIBUTION)
        .catch(() => IGN_ATTRIBUTION);

    tilesetAttributions.set(tilesetId, attribution);
    return attribution;
}

export async function fetchCatalog(catalog: Catalog): Promise<Layer[]> {
    if (catalog.tmsUrl) {
        return await fetchTmsCatalog(catalog.tmsUrl);
    }
    if (catalog.tileJsonUrl) {
        return await fetchTileJsonCatalog(catalog);
    }

    return await fetch(catalog.wmtsUrl ?? "")
        .then((res) => res.text())
        .then((text) => new DOMParser().parseFromString(text, "application/xml"))
        .then((xml) => parseWmtsCatalog(xml));
}
