import { getGeoRepository, getPermitRepository, getVehicleRepository } from "./sqlite-repository";
import { isDatabaseReady } from "@/lib/db/sqlite";
import {
  getGeoRepository as getMockGeo,
  getPermitRepository as getMockPermit,
  getVehicleRepository as getMockVehicle,
} from "./mock-repository";

export type StorageBackend = "sqlite" | "memory";

export function storageBackend(): StorageBackend {
  return isDatabaseReady() ? "sqlite" : "memory";
}

export function vehicleRepository() {
  try {
    return getVehicleRepository();
  } catch {
    return getMockVehicle();
  }
}

export function permitRepository() {
  try {
    return getPermitRepository();
  } catch {
    return getMockPermit();
  }
}

export function geoRepository() {
  try {
    return getGeoRepository();
  } catch {
    return getMockGeo();
  }
}
