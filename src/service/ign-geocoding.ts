import { HrzProtocol } from "@siradel-oss/horizon-protocol";

export interface CompletionResult {
    label: string;
    type: "poi" | "address";
}

export interface SearchResult {
    bbox: HrzProtocol.GeographicBounds.$Properties;
}

function parseCompletionResult(data: any): CompletionResult[] {
    if (!data || !Array.isArray(data.results)) {
        return [];
    }

    return data.results.map((item: any) => {
        let type = item.poiType !== undefined ? "poi" : "address";
        let label = item.fulltext;
        if (item.names && Array.isArray(item.names) && item.names.length > 0) {
            label = item.names[0];
        }
        return { label, type };
    });
}

export async function doCompletion(
    text: string,
    maximumResponses: number = 3,
): Promise<CompletionResult[]> {
    text = encodeURIComponent(text);
    try {
        const response = await fetch(
            `https://data.geopf.fr/geocodage/completion?text=${text}&maximumResponses=${maximumResponses}`,
        );
        const data = await response.json();
        return parseCompletionResult(data);
    } catch {
        return [];
    }
}

function parseSearchResult(data: any): SearchResult | null {
    if (!data || !Array.isArray(data.features) || data.features.length === 0) {
        return null;
    }

    let shapeGeojson = data.features[0].properties?.truegeometry;
    if (!shapeGeojson || !(typeof shapeGeojson === "string")) {
        return null;
    }

    // Accumulate coordinates to compute bounding box
    let shape = JSON.parse(shapeGeojson);
    if (!Array.isArray(shape.coordinates)) {
        return null;
    }

    let bbox = new HrzProtocol.GeographicBounds({
        south: 90,
        west: 180,
        north: -90,
        east: -180,
    });

    function accumulateCoords(coords: any) {
        if (typeof coords[0] === "number" && typeof coords[1] === "number") {
            let lon = coords[0];
            let lat = coords[1];
            bbox.south = Math.min(bbox.south!, lat);
            bbox.north = Math.max(bbox.north!, lat);
            bbox.west = Math.min(bbox.west!, lon);
            bbox.east = Math.max(bbox.east!, lon);
        }
    }

    function traverseCoordinates(coords: any) {
        if (Array.isArray(coords) && coords.length > 0) {
            if (typeof coords[0] === "number") {
                accumulateCoords(coords);
            } else {
                for (let i = 0; i < coords.length; i++) {
                    traverseCoordinates(coords[i]);
                }
            }
        }
    }

    traverseCoordinates(shape.coordinates);
    return { bbox };
}

export async function doSearch(completionResult: CompletionResult): Promise<SearchResult | null> {
    const text = encodeURIComponent(completionResult.label);
    const index = completionResult.type === "poi" ? "poi" : "address";
    try {
        const response = await fetch(
            `https://data.geopf.fr/geocodage/search?q=${text}&autocomplete=false&index=${index}&limit=1&returntruegeometry=true`,
        );
        const data = await response.json();
        return parseSearchResult(data);
    } catch {
        return null;
    }
}
