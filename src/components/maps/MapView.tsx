"use client";

import { DUBAI_CENTER, DEFAULT_ZOOM } from "@/lib/config";
import { buildOsmStyle } from "@/lib/geo/map-styles";
import {
  createVehicleMarkerElement,
  updateVehicleMarkerElement,
} from "@/lib/geo/vehicle-marker";
import { liveStatusColor } from "@/lib/vehicle-status";
import { useGisStore } from "@/store/gis-store";
import type { VehicleWithLive } from "@/types";
import type { GeoUploadRecord } from "@/types/geo";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
  type Marker,
} from "maplibre-gl";
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
        "circle-radius": 0,
        "circle-opacity": 0,
        "circle-stroke-width": 0,
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
  const markersRef = useRef(new globalThis.Map<string, Marker>());
  const measurePoints = useRef<[number, number][]>([]);
  const pulseRef = useRef<number | null>(null);
  const basemapRef = useRef<string | null>(null);
  const lastFlownVehicleRef = useRef<string | null>(null);
  const onSelectVehicleRef = useRef(onSelectVehicle);
  const [mapReady, setMapReady] = useState(false);
  const [measureLabel, setMeasureLabel] = useState<string | null>(null);

  onSelectVehicleRef.current = onSelectVehicle;

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
            heading: v.live?.heading ?? 0,
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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      basemapRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [setCursorCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (basemapRef.current === null) {
      basemapRef.current = basemap;
      return;
    }
    if (basemapRef.current === basemap) return;

    basemapRef.current = basemap;

    const onStyleReady = () => {
      addOperationalLayers(map);
      refreshGeoLayers(map, geoUploadRecords);
    };

    map.setStyle(buildOsmStyle(basemap));
    map.once("style.load", onStyleReady);
  }, [basemap, mapReady, geoUploadRecords, refreshGeoLayers]);

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

    if (!layers.vehicles) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      return;
    }

    const syncMarkers = () => {
      if (!mapRef.current || !map.isStyleLoaded()) return;

      const showAllMarkers = map.getZoom() >= 14;
      const unclustered = showAllMarkers
        ? new Set(vehicles.filter((v) => v.live?.latitude != null).map((v) => v.id))
        : new Set(
            map
              .querySourceFeatures("vehicles")
              .filter((f) => !f.properties?.point_count && f.properties?.id)
              .map((f) => String(f.properties!.id))
          );

      const nextIds = new Set<string>();

      for (const v of vehicles) {
        if (!v.live?.latitude || !v.live?.longitude) continue;
        if (!unclustered.has(v.id)) continue;

        nextIds.add(v.id);
        const heading = v.live.heading ?? 0;
        const selected = v.id === selectedVehicleId;
        const existing = markersRef.current.get(v.id);

        if (existing) {
          existing.setLngLat([v.live.longitude, v.live.latitude]);
          const el = existing.getElement() as HTMLDivElement;
          updateVehicleMarkerElement(el, v.liveStatus, heading, selected);
          continue;
        }

        const el = createVehicleMarkerElement(v.liveStatus, heading, selected);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectVehicleRef.current?.(v.id);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([v.live.longitude, v.live.latitude])
          .addTo(map);
        markersRef.current.set(v.id, marker);
      }

      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    };

    if (map.isSourceLoaded("vehicles")) {
      syncMarkers();
    } else {
      map.once("idle", syncMarkers);
    }

    map.on("zoomend", syncMarkers);
    map.on("moveend", syncMarkers);

    return () => {
      map.off("zoomend", syncMarkers);
      map.off("moveend", syncMarkers);
    };
  }, [vehicles, layers.vehicles, selectedVehicleId, vehiclesToGeoJson, mapReady]);

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
        layers: ["clusters"],
      });
      if (features[0]?.properties?.cluster_id != null) {
        const clusterId = features[0].properties.cluster_id as number;
        const source = map.getSource("vehicles") as GeoJSONSource;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometry = features[0].geometry;
          if (geometry.type !== "Point") return;
          map.easeTo({ center: geometry.coordinates as [number, number], zoom });
        });
        return;
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
    if (!selectedVehicleId) {
      lastFlownVehicleRef.current = null;
      return;
    }
    if (lastFlownVehicleRef.current === selectedVehicleId) return;

    const map = mapRef.current;
    if (!map) return;

    const v = vehicles.find((x) => x.id === selectedVehicleId);
    if (v?.live) {
      lastFlownVehicleRef.current = selectedVehicleId;
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
