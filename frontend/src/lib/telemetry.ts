/** Display helpers for nullable telemetry fields. */

export function formatIgnition(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "ON" : "OFF";
}

export function formatVoltage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)} V`;
}

export function formatExternalPower(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Connected" : "Disconnected";
}

export function formatGsmSignal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value} / 5`;
}

export function formatSatellites(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function ignitionClass(value: boolean | null | undefined): string {
  if (value === true) return "text-emerald-400";
  if (value === false) return "text-slate-500";
  return "text-slate-600";
}
