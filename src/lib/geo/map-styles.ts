import type { BasemapId } from "@/types";
import type { StyleSpecification } from "maplibre-gl";

const CARTO_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

export const DEFAULT_BASEMAP: BasemapId = "english-street";

const CARTO_TILES: Record<BasemapId, string[]> = {
  "english-street": ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
  "dark-english": ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
  "light-english": ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
};

const LEGACY_BASEMAP_IDS: Record<string, BasemapId> = {
  "osm-street": "english-street",
  "osm-humanitarian": "dark-english",
};

export function normalizeBasemapId(basemap: string | undefined): BasemapId {
  if (basemap && basemap in CARTO_TILES) return basemap as BasemapId;
  if (basemap && basemap in LEGACY_BASEMAP_IDS) return LEGACY_BASEMAP_IDS[basemap];
  return DEFAULT_BASEMAP;
}

function rasterStyle(tiles: string[], attribution: string): StyleSpecification {
  return {
    version: 8,
    // Required for symbol layers (cluster-count / vehicle labels) that use text-field.
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: "basemap",
        type: "raster",
        source: "basemap",
      },
    ],
  };
}

export function buildOsmStyle(basemap: BasemapId | string): StyleSpecification {
  const id = normalizeBasemapId(basemap);
  return rasterStyle(CARTO_TILES[id], CARTO_ATTRIBUTION);
}
