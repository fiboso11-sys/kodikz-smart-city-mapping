"use client";

import { DUBAI_CENTER, DEFAULT_ZOOM } from "@/lib/config";
import { buildOsmStyle } from "@/lib/geo/map-styles";
import { liveStatusColor } from "@/lib/vehicle-status";
import { useGisStore } from "@/store/gis-store";
import type { VehicleWithLive } from "@/types";
import type { GeoUploadRecord } from "@/types/geo";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapToolbar } from "./map-toolbar";

export interface MapViewProps {
  vehicles: VehicleWithLive[];
  geoUploadRecords?: GeoUploadRecord[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (id: string | null) => void;
  showHistoryPath?: boolean;
  className?: string;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function setLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function addOperationalLayers(map: MapLibreMap) {
  if (!map.getSource("vehicles")) {
    map.addSource("vehicles", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
  }

  if (!map.getLayer("clusters")) {
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "vehicles",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#1e40af",
        "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#c9a227",
      },
    });
  }

  if (!map.getLayer("cluster-count")) {
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "vehicles",
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
      paint: { "text-color": "#ffffff" },
    });
  }

  if (!map.getLayer("vehicle-points")) {
    map.addLayer({
      id: "vehicle-points",
      type: "circle",
      source: "vehicles",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  if (!map.getLayer("vehicle-selected-ring")) {
    map.addLayer({
      id: "vehicle-selected-ring",
      type: "circle",
      source: "vehicles",
      filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], ""]],
      paint: {
        "circle-radius": 16,
        "circle-color": "rgba(34, 211, 238, 0.12)",
        "circle-stroke-width": 3,
        "circle-stroke-color": "#22d3ee",
        "circle-stroke-opacity": 0.95,
      },
    });
  }

  if (!map.getSource("history-path")) {
    map.addSource("history-path", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "history-line",
      type: "line",
      source: "history-path",
      paint: { "line-color": "#22d3ee", "line-width": 3, "line-opacity": 0.85 },
    });
  }

  if (!map.getSource("measure-line")) {
    map.addSource("measure-line", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "measure-line-layer",
      type: "line",
      source: "measure-line",
      paint: { "line-color": "#c9a227", "line-width": 2, "line-dasharray": [2, 2] },
    });
  }
}

export function MapView({
  vehicles,
  geoUploadRecords = [],
  selectedVehicleId,
  onSelectVehicle,
  showHistoryPath = false,
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const measurePoints = useRef<[number, number][]>([]);
  const pulseRef = useRef<number | null>(null);
  const basemapBootstrapped = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [measureLabel, setMeasureLabel] = useState<string | null>(null);

  const basemap = useGisStore((s) => s.basemap);
  const layers = useGisStore((s) => s.layers);
  const measureMode = useGisStore((s) => s.measureMode);
  const identifyMode = useGisStore((s) => s.identifyMode);
  const setCursorCoords = useGisStore((s) => s.setCursorCoords);
  const historyPath = useGisStore((s) => s.historyPath);

  const vehiclesToGeoJson = useCallback((list: VehicleWithLive[]): GeoJSON.FeatureCollection => {
    return {
      type: "FeatureCollection",
      features: list
        .filter((v) => v.live?.latitude != null && v.live?.longitude != null)
        .map((v) => ({
          type: "Feature",
          properties: {
            id: v.id,
            imei: v.imei,
            name: v.vehicleName,
            plate: v.plateNumber,
            status: v.liveStatus,
            color: liveStatusColor(v.liveStatus),
            speed: v.live?.speed ?? 0,
          },
          geometry: {
            type: "Point",
            coordinates: [v.live!.longitude, v.live!.latitude],
          },
        })),
    };
  }, []);

  const refreshGeoLayers = useCallback(
    (map: MapLibreMap, uploads: GeoUploadRecord[]) => {
      const style = map.getStyle();
      style?.layers
        ?.filter((l) => l.id.startsWith("geo-route-") || l.id.startsWith("geo-area-"))
        .forEach((l) => {
          if (map.getLayer(l.id)) map.removeLayer(l.id);
        });
      Object.keys(style?.sources ?? {}).forEach((srcId) => {
        if (srcId.startsWith("geo-src-") && map.getSource(srcId)) map.removeSource(srcId);
      });

      uploads.forEach((upload, idx) => {
        const srcId = `geo-src-${upload.id}`;
        const visible = upload.type === "route" ? layers.routes : layers.areas;
        if (!visible) return;

        map.addSource(srcId, { type: "geojson", data: upload.featureCollection });

        if (upload.type === "route") {
          map.addLayer({
            id: `geo-route-${idx}`,
            type: "line",
            source: srcId,
            paint: { "line-color": "#22d3ee", "line-width": 4, "line-opacity": 0.9 },
          });
        } else {
          map.addLayer({
            id: `geo-area-fill-${idx}`,
            type: "fill",
            source: srcId,
            paint: { "fill-color": "#c9a227", "fill-opacity": 0.22 },
          });
          map.addLayer({
            id: `geo-area-${idx}`,
            type: "line",
            source: srcId,
            paint: { "line-color": "#c9a227", "line-width": 2 },
          });
        }
      });
    },
    [layers.routes, layers.areas]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildOsmStyle(basemap),
      center: DUBAI_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      addOperationalLayers(map);
      setMapReady(true);
    });
    map.on("mousemove", (e) => setCursorCoords([e.lngLat.lng, e.lngLat.lat]));

    mapRef.current = map;
    return () => {
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
      basemapBootstrapped.current = false;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [setCursorCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!basemapBootstrapped.current) {
      basemapBootstrapped.current = true;
      return;
    }

    const onStyleReady = () => {
      addOperationalLayers(map);
      refreshGeoLayers(map, geoUploadRecords);
      const src = map.getSource("vehicles") as GeoJSONSource | undefined;
      src?.setData(vehiclesToGeoJson(vehicles));
    };

    map.setStyle(buildOsmStyle(basemap));
    map.once("style.load", onStyleReady);
  }, [basemap, mapReady, geoUploadRecords, vehicles, vehiclesToGeoJson, refreshGeoLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    addOperationalLayers(map);

    const src = map.getSource("vehicles") as GeoJSONSource | undefined;
    if (src) src.setData(vehiclesToGeoJson(vehicles));

    setLayerVisibility(map, "clusters", layers.vehicles);
    setLayerVisibility(map, "cluster-count", layers.vehicles);
    setLayerVisibility(map, "vehicle-points", layers.vehicles);
    setLayerVisibility(map, "vehicle-selected-ring", layers.vehicles);
  }, [vehicles, layers.vehicles, vehiclesToGeoJson, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer("vehicle-selected-ring")) return;
    const filter: maplibregl.FilterSpecification = selectedVehicleId
      ? ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], selectedVehicleId]]
      : ["==", ["get", "id"], ""];
    map.setFilter("vehicle-selected-ring", filter);
  }, [selectedVehicleId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer("vehicle-selected-ring")) return;

    let growing = true;
    const tick = () => {
      if (!map.getLayer("vehicle-selected-ring")) return;
      const current = (map.getPaintProperty("vehicle-selected-ring", "circle-radius") as number) ?? 16;
      const next = growing ? current + 0.15 : current - 0.15;
      if (next >= 18) growing = false;
      if (next <= 14) growing = true;
      map.setPaintProperty("vehicle-selected-ring", "circle-radius", next);
      pulseRef.current = requestAnimationFrame(tick);
    };

    if (selectedVehicleId) {
      pulseRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
      pulseRef.current = null;
    };
  }, [selectedVehicleId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !showHistoryPath) return;
    const src = map.getSource("history-path") as GeoJSONSource | undefined;
    if (!src) return;
    if (historyPath.length < 2) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    src.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: historyPath.map((p) => [p.longitude, p.latitude]),
      },
    });
  }, [historyPath, showHistoryPath, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    refreshGeoLayers(map, geoUploadRecords);
  }, [geoUploadRecords, refreshGeoLayers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: MapMouseEvent) => {
      if (measureMode) {
        measurePoints.current.push([e.lngLat.lng, e.lngLat.lat]);
        const pts = measurePoints.current;
        const src = map.getSource("measure-line") as GeoJSONSource | undefined;
        if (src) {
          src.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: pts },
          });
        }
        if (pts.length >= 2) {
          let total = 0;
          for (let i = 1; i < pts.length; i++) total += haversineKm(pts[i - 1], pts[i]);
          setMeasureLabel(`${total.toFixed(2)} km`);
        }
        return;
      }

      if (identifyMode) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["vehicle-points", "clusters"],
      });
      if (features[0]?.properties?.id && onSelectVehicle) {
        onSelectVehicle(String(features[0].properties.id));
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [measureMode, identifyMode, onSelectVehicle, mapReady]);

  useEffect(() => {
    if (!measureMode) {
      measurePoints.current = [];
      setMeasureLabel(null);
      const map = mapRef.current;
      const src = map?.getSource("measure-line") as GeoJSONSource | undefined;
      src?.setData({ type: "FeatureCollection", features: [] });
    }
  }, [measureMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedVehicleId) return;
    const v = vehicles.find((x) => x.id === selectedVehicleId);
    if (v?.live) {
      map.flyTo({ center: [v.live.longitude, v.live.latitude], zoom: 14, duration: 800 });
    }
  }, [selectedVehicleId, vehicles]);

  const zoomToDubai = () => mapRef.current?.flyTo({ center: DUBAI_CENTER, zoom: DEFAULT_ZOOM });
  const fullscreen = () => containerRef.current?.requestFullscreen?.();

  return (
    <div className={`relative h-full min-h-[320px] overflow-hidden rounded-xl ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      <MapToolbar onFullscreen={fullscreen} onZoomToDubai={zoomToDubai} />
      {measureLabel && (
        <div className="absolute bottom-14 left-3 z-20 command-panel rounded-lg px-3 py-2 text-sm text-gold">
          Distance: {measureLabel}
        </div>
      )}
    </div>
  );
}

/** @deprecated Use MapView */
export const GisMap = MapView;
