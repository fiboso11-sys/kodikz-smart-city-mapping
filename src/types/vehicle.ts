export type VehicleType = "SUV" | "4x4" | "Sedan" | "Hatchback" | "Van";

export type VehicleMasterStatus = "Active" | "Inactive" | "Maintenance";

export type VehicleLiveStatus = "moving" | "idle" | "offline";

export interface VehicleMaster {
  id: string;
  imei: string;
  plateNumber: string;
  vehicleName: string;
  vehicleType: VehicleType;
  companyName: string;
  driverName: string;
  driverMobile: string;
  simNumber: string;
  permitNumber: string;
  installationDate: string;
  status: VehicleMasterStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleLivePosition {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: boolean | null;
  timestamp: string;
  receivedAt?: string;
  batteryVoltage?: number | null;
  externalPower?: boolean | null;
  gsmSignal?: number | null;
  satellites?: number | null;
}

export interface VehicleWithLive extends VehicleMaster {
  live?: VehicleLivePosition;
  liveStatus: VehicleLiveStatus;
}

export interface CreateVehicleInput {
  imei: string;
  plateNumber: string;
  vehicleName: string;
  vehicleType: VehicleType;
  companyName: string;
  driverName: string;
  driverMobile?: string;
  simNumber?: string;
  permitNumber: string;
  installationDate?: string;
  status?: VehicleMasterStatus;
  notes?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;
