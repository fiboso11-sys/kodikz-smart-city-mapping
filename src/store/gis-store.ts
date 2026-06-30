import { create } from "zustand";
import { normalizeBasemapId } from "@/lib/geo/map-styles";
import type { GpsConnectionStatus } from "@/services/gps-service";
import type { BasemapId, DashboardKpis, MapLayerVisibility } from "@/types";
import type { VehicleLivePosition } from "@/types/vehicle";
import type { GeoUploadRecord } from "@/types/geo";
import { isOnline } from "@/lib/vehicle-status";

export type LiveFilter = "all" | "online" | "moving" | "idle" | "offline";

interface GisState {
  selectedVehicleId: string | null;
  liveByImei: Record<string, VehicleLivePosition>;
  connectionStatus: GpsConnectionStatus;
  socketLive: boolean;
  gpsError: string | null;
  lastGpsUpdateAt: string | null;
  basemap: BasemapId;
  layers: MapLayerVisibility;
  geoUploads: GeoUploadRecord[];
  liveFilter: LiveFilter;
  companyFilter: string;
  permitFilter: string;
  searchQuery: string;
  measureMode: boolean;
  identifyMode: boolean;
  cursorCoords: [number, number] | null;
  historyPath: VehicleLivePosition[];
  setSelectedVehicleId: (id: string | null) => void;
  setLivePosition: (pos: VehicleLivePosition) => void;
  setLiveBatch: (positions: VehicleLivePosition[]) => void;
  setConnectionStatus: (status: GpsConnectionStatus, error?: string | null) => void;
  setSocketLive: (live: boolean) => void;
  setBasemap: (b: BasemapId) => void;
  setLayer: (key: keyof MapLayerVisibility, visible: boolean) => void;
  setGeoUploads: (uploads: GeoUploadRecord[]) => void;
  setLiveFilter: (f: LiveFilter) => void;
  setCompanyFilter: (c: string) => void;
  setPermitFilter: (p: string) => void;
  setSearchQuery: (q: string) => void;
  setMeasureMode: (v: boolean) => void;
  setIdentifyMode: (v: boolean) => void;
  setCursorCoords: (c: [number, number] | null) => void;
  setHistoryPath: (path: VehicleLivePosition[]) => void;
}

export const useGisStore = create<GisState>((set) => ({
  selectedVehicleId: null,
  liveByImei: {},
  connectionStatus: "DISCONNECTED",
  socketLive: false,
  gpsError: null,
  lastGpsUpdateAt: null,
  basemap: "english-street",
  layers: { vehicles: true, routes: true, areas: true },
  geoUploads: [],
  liveFilter: "all",
  companyFilter: "",
  permitFilter: "",
  searchQuery: "",
  measureMode: false,
  identifyMode: false,
  cursorCoords: null,
  historyPath: [],
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setLivePosition: (pos) =>
    set((s) => ({
      liveByImei: { ...s.liveByImei, [pos.imei]: pos },
      lastGpsUpdateAt: new Date().toISOString(),
      socketLive: true,
    })),
  setLiveBatch: (positions) =>
    set((s) => {
      const next = { ...s.liveByImei };
      for (const p of positions) next[p.imei] = p;
      return {
        liveByImei: next,
        lastGpsUpdateAt: positions.length ? new Date().toISOString() : s.lastGpsUpdateAt,
      };
    }),
  setConnectionStatus: (connectionStatus, error = null) =>
    set({ connectionStatus, gpsError: error }),
  setSocketLive: (socketLive) => set({ socketLive }),
  setBasemap: (basemap) => set({ basemap: normalizeBasemapId(basemap) }),
  setLayer: (key, visible) => set((s) => ({ layers: { ...s.layers, [key]: visible } })),
  setGeoUploads: (geoUploads) => set({ geoUploads }),
  setLiveFilter: (liveFilter) => set({ liveFilter }),
  setCompanyFilter: (companyFilter) => set({ companyFilter }),
  setPermitFilter: (permitFilter) => set({ permitFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMeasureMode: (measureMode) => set({ measureMode, identifyMode: false }),
  setIdentifyMode: (identifyMode) => set({ identifyMode, measureMode: false }),
  setCursorCoords: (cursorCoords) => set({ cursorCoords }),
  setHistoryPath: (historyPath) => set({ historyPath }),
}));

export function computeKpis(
  vehicles: { liveStatus: string; companyName: string }[],
  permits: { status: string; companyName: string }[],
  geoUploads: { type: string }[]
): DashboardKpis {
  const companies = new Set(vehicles.map((v) => v.companyName));
  const moving = vehicles.filter((v) => v.liveStatus === "moving").length;
  const idle = vehicles.filter((v) => v.liveStatus === "idle").length;
  const offline = vehicles.filter((v) => v.liveStatus === "offline").length;
  const online = vehicles.filter((v) => isOnline(v.liveStatus as "moving" | "idle" | "offline")).length;

  return {
    totalVehicles: vehicles.length,
    onlineVehicles: online,
    offlineVehicles: offline,
    movingVehicles: moving,
    idleVehicles: idle,
    activePermits: permits.filter((p) => p.status === "Ongoing").length,
    companiesMonitored: companies.size,
    routesUploaded: geoUploads.filter((g) => g.type === "route").length,
    areasUploaded: geoUploads.filter((g) => g.type === "area").length,
  };
}
