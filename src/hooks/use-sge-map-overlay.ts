"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import { useSgeStore } from "@/store/sge-store";
import { extractCoords } from "@/engines/sge";
import { sessionManager } from "@/platform/sge";

/**
 * Wire into MapView — updates SGE overlays in place.
 * Never recreates the map, sources, or layers after first ensure.
 */
export function useSgeMapOverlay(
  mapRef: React.RefObject<MapLibreMap | null>,
  mapReady: boolean
): void {
  const byVehicle = useSgeStore((s) => s.byVehicle);
  const focusedVehicleId = useSgeStore((s) => s.focusedVehicleId);
  const ensuredRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sync = () => {
      if (!map.isStyleLoaded()) return;
      ensureSgeSources(map);
      ensuredRef.current = true;

      const vehicleId =
        focusedVehicleId && byVehicle[focusedVehicleId]
          ? focusedVehicleId
          : Object.keys(byVehicle)[0];

      if (!vehicleId) {
        clearSource(map, "sge-route");
        clearSource(map, "sge-completed");
        clearSource(map, "sge-remaining");
        return;
      }

      const session =
        byVehicle[vehicleId]?.session ?? sessionManager.getSession(vehicleId) ?? null;
      if (!session) return;

      const coords = extractCoords(session.assignment.geometry);
      if (coords.length < 2) return;

      const routeSrc = map.getSource("sge-route") as GeoJSONSource | undefined;
      routeSrc?.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { vehicleId },
            geometry: { type: "LineString", coordinates: coords },
          },
        ],
      });

      const completedFeatures: GeoJSON.Feature[] = [];
      const remainingFeatures: GeoJSON.Feature[] = [];
      for (const seg of session.segments.segments) {
        const feature: GeoJSON.Feature = {
          type: "Feature",
          properties: { id: seg.id },
          geometry: {
            type: "LineString",
            coordinates: [seg.startCoord, seg.endCoord],
          },
        };
        if (seg.completed) completedFeatures.push(feature);
        else remainingFeatures.push(feature);
      }

      (map.getSource("sge-completed") as GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: completedFeatures,
      });
      (map.getSource("sge-remaining") as GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: remainingFeatures,
      });
    };

    sync();
    map.on("style.load", sync);
    return () => {
      map.off("style.load", sync);
    };
  }, [mapRef, mapReady, byVehicle, focusedVehicleId]);
}

function clearSource(map: MapLibreMap, id: string): void {
  const src = map.getSource(id) as GeoJSONSource | undefined;
  src?.setData({ type: "FeatureCollection", features: [] });
}

function ensureSgeSources(map: MapLibreMap): void {
  if (!map.getSource("sge-route")) {
    map.addSource("sge-route", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "sge-route-corridor",
      type: "line",
      source: "sge-route",
      paint: {
        "line-color": "#6366f1",
        "line-width": 20,
        "line-opacity": 0.12,
      },
    });
    map.addLayer({
      id: "sge-route-line",
      type: "line",
      source: "sge-route",
      paint: {
        "line-color": "#6366f1",
        "line-width": 3,
        "line-opacity": 0.7,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getSource("sge-completed")) {
    map.addSource("sge-completed", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "sge-completed-line",
      type: "line",
      source: "sge-completed",
      paint: {
        "line-color": "#10b981",
        "line-width": 5,
        "line-opacity": 0.85,
      },
    });
  }

  if (!map.getSource("sge-remaining")) {
    map.addSource("sge-remaining", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "sge-remaining-line",
      type: "line",
      source: "sge-remaining",
      paint: {
        "line-color": "#f59e0b",
        "line-width": 3,
        "line-opacity": 0.6,
        "line-dasharray": [4, 3],
      },
    });
  }
}
