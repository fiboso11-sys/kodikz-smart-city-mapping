import type {
  Company,
  Permit,
  Route,
  Vehicle,
  Violation,
  GpsHistoryPoint,
  MapLayers,
  GPSProviderKind,
} from "@/types";
import type { HealthResponse } from "@/lib/gps-api";
import { withFleetImeis } from "@/lib/fleet-gps";
import { normalizeVehicle } from "@/lib/normalize-vehicle";
import { evaluateViolations } from "@/lib/violations";

const STORAGE_KEY = "kodikz-city-state";

function defaultProviderKind(): GPSProviderKind {
  return process.env.NEXT_PUBLIC_GPS_PROVIDER === "teltonika" ? "teltonika" : "simulator";
}

const DEFAULT_LAYERS: MapLayers = {
  vehicles: true,
  routes: false,
  violations: true,
  heatmap: false,
};

export interface GpsApiStatus {
  connected: boolean;
  message: string;
}

export interface AppState {
  initialized: boolean;
  providerKind: GPSProviderKind;
  gpsApiStatus: GpsApiStatus;
  fleetHealth: HealthResponse | null;
  fleetHealthError: string | null;
  companies: Company[];
  permits: Permit[];
  routes: Route[];
  vehicles: Vehicle[];
  violations: Violation[];
  history: GpsHistoryPoint[];
  signalTicks: Record<string, number>;
  layers: MapLayers;
  selectedVehicleId: string | null;
  companyFilter: string | null;
  permitFilter: string | null;
  statusFilter: string | null;
  searchQuery: string;
  replayMode: boolean;
  replayIndex: number;
  replayPlaying: boolean;
  replayTrail: GeoJSON.LineString | null;
  replayFocus: { lng: number; lat: number } | null;
  replayVehicleId: string | null;

  initialize: () => Promise<void>;
  setProviderKind: (kind: GPSProviderKind) => void;
  setGpsApiStatus: (status: GpsApiStatus) => void;
  setFleetHealth: (health: HealthResponse | null) => void;
  setFleetHealthError: (message: string | null) => void;
  applyTelemetry: (
    updates: Vehicle[],
    options?: { skipViolations?: boolean; skipPersist?: boolean }
  ) => void;
  addRoute: (route: Route) => void;
  updateRoute: (route: Route) => void;
  deleteRoute: (id: string) => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  resolveViolation: (id: string) => void;
  toggleLayer: (layer: keyof MapLayers) => void;
  setSelectedVehicle: (id: string | null) => void;
  setCompanyFilter: (id: string | null) => void;
  setPermitFilter: (id: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  setSearchQuery: (q: string) => void;
  setReplayMode: (on: boolean) => void;
  setReplayIndex: (i: number) => void;
  setReplayPlaying: (p: boolean) => void;
  applyPlaybackFrame: (
    point: GpsHistoryPoint,
    trail: GeoJSON.LineString,
    vehicleId: string
  ) => void;
  resetFromSeed: () => Promise<void>;
  persist: () => void;
  filteredVehicles: () => Vehicle[];
  getCompany: (id: string) => Company | undefined;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}

function loadPersisted(): Partial<AppState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type SetState = (
  partial: Partial<AppState> | AppState | ((state: AppState) => Partial<AppState> | AppState)
) => void;

export const createAppStore = (set: SetState, get: () => AppState): AppState => ({
  initialized: false,
  providerKind: defaultProviderKind(),
  gpsApiStatus: { connected: false, message: "GPS idle" },
  fleetHealth: null,
  fleetHealthError: null,
  companies: [],
  permits: [],
  routes: [],
  vehicles: [],
  violations: [],
  history: [],
  signalTicks: {},
  layers: DEFAULT_LAYERS,
  selectedVehicleId: null,
  companyFilter: null,
  permitFilter: null,
  statusFilter: null,
  searchQuery: "",
  replayMode: false,
  replayIndex: 0,
  replayPlaying: false,
  replayTrail: null,
  replayFocus: null,
  replayVehicleId: null,

  initialize: async () => {
    const persisted = loadPersisted();
    const staleData =
      persisted &&
      ((persisted.history?.length ?? 0) < 1500 ||
        (persisted.routes?.length ?? 0) > 80);

    if (persisted?.vehicles?.length && !staleData) {
      set(() => ({
        ...persisted,
        vehicles: persisted.vehicles.map(normalizeVehicle),
        layers: { ...DEFAULT_LAYERS, ...(persisted.layers as MapLayers | undefined) },
        initialized: true,
        signalTicks: persisted.signalTicks ?? {},
      }) as AppState);
      return;
    }
    if (staleData && typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    const [companies, permits, routes, vehiclesRaw, violations, history] = await Promise.all([
      fetchJson<Company[]>("/data/companies.json"),
      fetchJson<Permit[]>("/data/permits.json"),
      fetchJson<Route[]>("/data/routes.json"),
      fetchJson<Vehicle[]>("/data/vehicles.json"),
      fetchJson<Violation[]>("/data/violations.json"),
      fetchJson<GpsHistoryPoint[]>("/data/history.json"),
    ]);
    const vehicles = withFleetImeis(
      vehiclesRaw.map(normalizeVehicle),
      defaultProviderKind() === "teltonika"
    );
    set(() => ({
      companies,
      permits,
      routes,
      vehicles,
      violations,
      history,
      initialized: true,
      signalTicks: Object.fromEntries(vehicles.map((v) => [v.id, 0])),
    }));
    get().persist();
  },

  setProviderKind: (kind) => set(() => ({ providerKind: kind })),
  setGpsApiStatus: (status) => set(() => ({ gpsApiStatus: status })),
  setFleetHealth: (health) => set(() => ({ fleetHealth: health })),
  setFleetHealthError: (message) => set(() => ({ fleetHealthError: message })),

  applyTelemetry: (updates, options) => {
    const state = get();
    const updateMap = new Map(updates.map((v) => [v.id, v]));
    const vehicles = state.vehicles.map((v) => updateMap.get(v.id) ?? v);
    const signalTicks = { ...state.signalTicks };

    let violations = state.violations;

    if (!options?.skipViolations) {
      const routeMap = new Map(state.routes.map((r) => [r.id, r]));
      const newViolations: Violation[] = [];
      for (const v of updates) {
        signalTicks[v.id] = 0;
        const route = v.assignedRouteId ? routeMap.get(v.assignedRouteId) : undefined;
        newViolations.push(
          ...evaluateViolations(v, route, signalTicks[v.id] ?? 0, violations)
        );
      }
      violations = [...violations, ...newViolations].slice(-500);
    } else {
      for (const v of updates) signalTicks[v.id] = 0;
    }

    if (!options?.skipViolations) {
      for (const id of Object.keys(signalTicks)) {
        if (!updates.some((v) => v.id === id)) signalTicks[id] = (signalTicks[id] ?? 0) + 1;
      }
    }

    set({ vehicles, violations, signalTicks });
    if (!options?.skipPersist) get().persist();
  },

  addRoute: (route) => {
    set((s) => ({ routes: [...s.routes, route] }));
    get().persist();
  },
  updateRoute: (route) => {
    set((s) => ({ routes: s.routes.map((r) => (r.id === route.id ? route : r)) }));
    get().persist();
  },
  deleteRoute: (id) => {
    set((s) => ({ routes: s.routes.filter((r) => r.id !== id) }));
    get().persist();
  },

  addCompany: (company) => {
    set((s) => ({ companies: [...s.companies, company] }));
    get().persist();
  },
  updateCompany: (company) => {
    set((s) => ({ companies: s.companies.map((c) => (c.id === company.id ? company : c)) }));
    get().persist();
  },

  addVehicle: (vehicle) => {
    set((s) => ({ vehicles: [...s.vehicles, vehicle] }));
    get().persist();
  },
  updateVehicle: (vehicle) => {
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)) }));
    get().persist();
  },
  deleteVehicle: (id) => {
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
    get().persist();
  },

  resolveViolation: (id) => {
    set((s) => ({
      violations: s.violations.map((v) =>
        v.id === id ? { ...v, resolvedAt: new Date().toISOString() } : v
      ),
    }));
    get().persist();
  },

  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setSelectedVehicle: (id) => set(() => ({ selectedVehicleId: id })),
  setCompanyFilter: (id) => set(() => ({ companyFilter: id })),
  setPermitFilter: (id) => set(() => ({ permitFilter: id })),
  setStatusFilter: (status) => set(() => ({ statusFilter: status })),
  setSearchQuery: (q) => set(() => ({ searchQuery: q })),
  setReplayMode: (on) =>
    set({
      replayMode: on,
      replayPlaying: false,
      ...(on ? {} : { replayTrail: null, replayFocus: null, replayVehicleId: null }),
    }),
  setReplayIndex: (i) => set({ replayIndex: i }),
  setReplayPlaying: (p) => set({ replayPlaying: p }),

  applyPlaybackFrame: (point, trail, vehicleId) => {
    const state = get();
    const vehicle = state.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    const updated: Vehicle = {
      ...vehicle,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      heading: point.heading,
      ignition: point.ignition,
      lastUpdate: point.timestamp,
      routeProgress:
        (point as GpsHistoryPoint & { routeProgress?: number }).routeProgress ??
        vehicle.routeProgress,
      status: point.speed > 2 ? "active" : "idle",
    };
    set({
      vehicles: state.vehicles.map((v) => (v.id === vehicleId ? updated : v)),
      replayTrail: trail,
      replayFocus: { lng: point.longitude, lat: point.latitude },
      replayVehicleId: vehicleId,
      selectedVehicleId: vehicleId,
    });
  },

  resetFromSeed: async () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ initialized: false });
    await get().initialize();
  },

  persist: () => {
    if (typeof window === "undefined") return;
    const s = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        companies: s.companies,
        permits: s.permits,
        routes: s.routes,
        vehicles: s.vehicles,
        violations: s.violations,
        history: s.history,
        signalTicks: s.signalTicks,
        providerKind: s.providerKind,
      })
    );
  },

  filteredVehicles: () => {
    const { vehicles, companyFilter, permitFilter, statusFilter, searchQuery } = get();
    return vehicles.filter((v) => {
      if (companyFilter && v.companyId !== companyFilter) return false;
      if (permitFilter && v.permitId !== permitFilter) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!v.plateNumber.toLowerCase().includes(q) && !v.driverName.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  },

  getCompany: (id) => get().companies.find((c) => c.id === id),
});
