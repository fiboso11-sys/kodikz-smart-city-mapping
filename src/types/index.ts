export * from "./vehicle";
export * from "./permit";
export * from "./geo";
export * from "./legacy";

export type BasemapId = "english-street" | "dark-english" | "light-english";

export interface MapLayerVisibility {
  vehicles: boolean;
  routes: boolean;
  areas: boolean;
}

export interface DashboardKpis {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  activePermits: number;
  companiesMonitored: number;
  routesUploaded: number;
  areasUploaded: number;
}
