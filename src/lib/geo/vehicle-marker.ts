/**
 * MapLibre vehicle marker images — 42px top-down car SVG (SDF for status tinting).
 * Clusters remain circle layers; only unclustered points use these icons.
 */

import type { Map as MapLibreMap } from "maplibre-gl";

export const VEHICLE_MARKER_PX = 42;

const IMAGE_IDS = ["vehicle-car", "vehicle-car-selected"] as const;

/** Draw a top-down car silhouette for SDF tinting (black = icon body). */
function drawCarSilhouette(
  ctx: CanvasRenderingContext2D,
  size: number,
  selected: boolean
): void {
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  if (selected) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
  }

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(cx - 7, cy - 12, 14, 24, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.roundRect(cx - 5, cy - 8, 10, 7, 2);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.roundRect(cx - 9, cy - 4, 4, 8, 1.5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx + 5, cy - 4, 4, 8, 1.5);
  ctx.fill();
}

function canvasToImageData(selected: boolean): ImageData {
  const size = VEHICLE_MARKER_PX;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  drawCarSilhouette(ctx, size, selected);
  return ctx.getImageData(0, 0, size, size);
}

const loadedMaps = new WeakSet<MapLibreMap>();

export function ensureVehicleMarkerImages(map: MapLibreMap): void {
  if (loadedMaps.has(map)) return;
  if (!map.hasImage("vehicle-car")) {
    map.addImage("vehicle-car", canvasToImageData(false), { sdf: true });
  }
  if (!map.hasImage("vehicle-car-selected")) {
    map.addImage("vehicle-car-selected", canvasToImageData(true), { sdf: true });
  }
  loadedMaps.add(map);
}

/** Re-register images after basemap style swap (style.load wipes images). */
export function resetVehicleMarkerImages(map: MapLibreMap): void {
  for (const id of IMAGE_IDS) {
    if (map.hasImage(id)) map.removeImage(id);
  }
  loadedMaps.delete(map);
  ensureVehicleMarkerImages(map);
}

export function addVehicleMarkerLayers(map: MapLibreMap): void {
  ensureVehicleMarkerImages(map);

  if (!map.getLayer("vehicle-markers")) {
    map.addLayer({
      id: "vehicle-markers",
      type: "symbol",
      source: "vehicles",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": [
          "case",
          ["boolean", ["get", "selected"], false],
          "vehicle-car-selected",
          "vehicle-car",
        ],
        "icon-size": 1,
        "icon-rotate": ["coalesce", ["get", "heading"], 0],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-color": ["coalesce", ["get", "color"], "#94a3b8"],
        "icon-halo-color": "#ffffff",
        "icon-halo-width": 1,
      },
    });
  }
}
