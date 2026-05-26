"use client";

import { DUBAI, clusterPoints } from "@/lib/geo";
import { FREE_MAP_STYLE, MAP_VIEW } from "@/lib/map-config";
import { formatSpeed, formatTime } from "@/lib/utils";
import { useVisibleRoutes } from "@/hooks/use-visible-routes";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import { useFilteredVehicles } from "@/hooks/use-filtered-vehicles";
import { useActiveViolations } from "@/hooks/use-active-violations";

export function LiveMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new globalThis.Map<string, Marker>());
  const [zoom, setZoom] = useState<number>(MAP_VIEW.zoom);
  const [mapReady, setMapReady] = useState(false);

  const vehicles = useFilteredVehicles();
  const visibleRoutes = useVisibleRoutes();
  const violations = useActiveViolations();
  const layers = useAppStore((s) => s.layers);
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId);
  const setSelectedVehicle = useAppStore((s) => s.setSelectedVehicle);
  const companies = useAppStore((s) => s.companies);
  const replayMode = useAppStore((s) => s.replayMode);
  const replayTrail = useAppStore((s) => s.replayTrail);
  const replayFocus = useAppStore((s) => s.replayFocus);
  const replayVehicleId = useAppStore((s) => s.replayVehicleId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: FREE_MAP_STYLE,
      center: MAP_VIEW.center,
      zoom: MAP_VIEW.zoom,
      pitch: MAP_VIEW.pitch,
      bearing: MAP_VIEW.bearing,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.on("zoom", () => setZoom(map.getZoom()));
    map.on("load", () => {
      setZoom(map.getZoom());
      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const upsertLine = (
      sourceId: string,
      layerId: string,
      fc: GeoJSON.FeatureCollection,
      paint: maplibregl.LineLayerSpecification["paint"]
    ) => {
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as GeoJSONSource).setData(fc);
      } else {
        map.addSource(sourceId, { type: "geojson", data: fc });
        map.addLayer({ id: layerId, type: "line", source: sourceId, paint });
      }
    };

    if (visibleRoutes.length > 0) {
      upsertLine(
        "routes-src",
        "routes-line",
        {
          type: "FeatureCollection",
          features: visibleRoutes.map((r) => ({
            type: "Feature",
            properties: {},
            geometry: r.geometry,
          })),
        },
        {
          "line-color": "#2563eb",
          "line-width": 3,
          "line-opacity": 0.55,
        }
      );
    } else if (map.getLayer("routes-line")) {
      map.removeLayer("routes-line");
      map.removeSource("routes-src");
    }

    if (layers.violations && violations.length > 0 && !replayMode) {
      const fc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: violations.slice(0, 80).map((v) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
        })),
      };
      if (map.getSource("violations-src")) {
        (map.getSource("violations-src") as GeoJSONSource).setData(fc);
      } else {
        map.addSource("violations-src", { type: "geojson", data: fc });
        map.addLayer({
          id: "violations-pt",
          type: "circle",
          source: "violations-src",
          paint: {
            "circle-radius": 7,
            "circle-color": "#ef4444",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.85,
          },
        });
      }
    } else if (map.getLayer("violations-pt")) {
      map.removeLayer("violations-pt");
      map.removeSource("violations-src");
    }

    if (replayTrail && replayTrail.coordinates.length > 1) {
      upsertLine(
        "replay-trail-src",
        "replay-trail-line",
        {
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: replayTrail }],
        },
        {
          "line-color": "#0891b2",
          "line-width": 5,
          "line-opacity": 0.95,
        }
      );
    } else if (map.getLayer("replay-trail-line")) {
      map.removeLayer("replay-trail-line");
      map.removeSource("replay-trail-src");
    }
  }, [visibleRoutes, violations, layers.violations, replayTrail, replayMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !replayFocus) return;
    if (replayMode) {
      map.jumpTo({
        center: [replayFocus.lng, replayFocus.lat],
        zoom: Math.max(map.getZoom(), 13),
      });
    } else {
      map.easeTo({
        center: [replayFocus.lng, replayFocus.lat],
        zoom: Math.max(map.getZoom(), 13),
        duration: 0,
      });
    }
  }, [replayFocus, replayMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !layers.vehicles) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const visibleVehicles =
      replayMode && replayVehicleId
        ? vehicles.filter((v) => v.id === replayVehicleId)
        : vehicles;

    const points = visibleVehicles.map((v) => ({
      id: v.id,
      lat: v.latitude,
      lng: v.longitude,
    }));
    const { clusters, singles } = clusterPoints(points, zoom);

    for (const c of clusters) {
      const el = document.createElement("div");
      el.className =
        "flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md";
      el.textContent = String(c.count);
      markersRef.current.set(
        `c-${c.lng}`,
        new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map)
      );
    }

    const singleIds = new Set(singles.map((s) => s.id));
    for (const v of visibleVehicles) {
      if (points.length >= 4 && !singleIds.has(v.id)) continue;
      const el = document.createElement("div");
      const sel = v.id === selectedVehicleId;
      el.className = sel
        ? "h-3.5 w-3.5 rounded-full bg-cyan-500 ring-2 ring-cyan-300 shadow-lg"
        : "h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-md";
      el.style.transform = `rotate(${v.heading}deg)`;

      const co = companies.find((c) => c.id === v.companyId);
      const popup = new maplibregl.Popup({ offset: 12, maxWidth: "260px" }).setHTML(
        `<div style="font:13px/1.4 system-ui">
          <b style="color:#1d4ed8">${v.plateNumber}</b><br/>
          <span style="color:#64748b">${v.vehicleType}</span><br/>
          ${co?.name ?? ""}<br/>
          ${formatSpeed(v.speed)} · ${formatTime(v.lastUpdate)}
        </div>`
      );
      el.addEventListener("click", () => setSelectedVehicle(v.id));
      markersRef.current.set(
        v.id,
        new maplibregl.Marker({ element: el }).setLngLat([v.longitude, v.latitude]).setPopup(popup).addTo(map)
      );
    }
  }, [
    vehicles,
    zoom,
    layers.vehicles,
    selectedVehicleId,
    setSelectedVehicle,
    companies,
    replayMode,
    replayVehicleId,
    mapReady,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-200">
      <div ref={containerRef} className="h-full w-full" />
      <p className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/80 px-1.5 text-[10px] text-slate-600">
        © OpenFreeMap · OpenStreetMap
      </p>
    </div>
  );
}
