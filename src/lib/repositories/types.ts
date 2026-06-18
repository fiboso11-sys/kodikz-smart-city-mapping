import type { CreatePermitInput, PermitMaster, UpdatePermitInput } from "@/types/permit";
import type { CreateVehicleInput, UpdateVehicleInput, VehicleMaster } from "@/types/vehicle";
import type { GeoUploadRecord } from "@/types/geo";

export interface VehicleRepository {
  findAll(): Promise<VehicleMaster[]>;
  findById(id: string): Promise<VehicleMaster | null>;
  findByImei(imei: string): Promise<VehicleMaster | null>;
  create(input: CreateVehicleInput): Promise<VehicleMaster>;
  update(id: string, input: UpdateVehicleInput): Promise<VehicleMaster | null>;
  delete(id: string): Promise<boolean>;
}

export interface PermitRepository {
  findAll(): Promise<PermitMaster[]>;
  findById(id: string): Promise<PermitMaster | null>;
  create(input: CreatePermitInput): Promise<PermitMaster>;
  update(id: string, input: UpdatePermitInput): Promise<PermitMaster | null>;
  delete(id: string): Promise<boolean>;
}

export interface GeoRepository {
  findAll(): Promise<GeoUploadRecord[]>;
  findByPermitId(permitId: string): Promise<GeoUploadRecord[]>;
  create(record: Omit<GeoUploadRecord, "id" | "uploadedAt">): Promise<GeoUploadRecord>;
  delete(id: string): Promise<boolean>;
}
