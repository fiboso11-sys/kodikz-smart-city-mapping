import type { BasemapId } from "@/types";
import type { StyleSpecification } from "maplibre-gl";

const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

function rasterStyle(tiles: string[], attribution: string): StyleSpecification {
  return {
    version: 8,
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

export function buildOsmStyle(basemap: BasemapId): StyleSpecification {
  if (basemap === "osm-humanitarian") {
    return rasterStyle(
      [
        "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      ],
      OSM_ATTRIBUTION
    );
  }
  return rasterStyle(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], OSM_ATTRIBUTION);
}
