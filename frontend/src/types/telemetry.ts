/** Device telemetry — null when not reported by the last GPS packet. */
export interface VehicleTelemetry {
  ignition: boolean | null;
  batteryVoltage: number | null;
  externalPower: boolean | null;
  gsmSignal: number | null;
  satellites: number | null;
}

export const EMPTY_TELEMETRY: VehicleTelemetry = {
  ignition: null,
  batteryVoltage: null,
  externalPower: null,
  gsmSignal: null,
  satellites: null,
};
