import type { VehicleLiveStatus } from "@/types";

const MARKER_SIZE_PX = 40;

const RING_COLOR: Record<VehicleLiveStatus, string> = {
  moving: "#22c55e",
  idle: "#eab308",
  offline: "#ef4444",
};

function carSvg(heading: number): string {
  const deg = Number.isFinite(heading) ? heading : 0;
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="transform:rotate(${deg}deg);transform-origin:center center">
    <path fill="#1e3a5f" stroke="#ffffff" stroke-width="1.25" stroke-linejoin="round"
      d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2m12 0H5m12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm-14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/>
  </svg>`;
}

export function createVehicleMarkerElement(
  status: VehicleLiveStatus,
  heading: number,
  selected: boolean
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "vehicle-map-marker";
  el.style.width = `${MARKER_SIZE_PX}px`;
  el.style.height = `${MARKER_SIZE_PX}px`;
  el.style.cursor = "pointer";
  el.dataset.status = status;
  el.dataset.selected = selected ? "1" : "0";
  el.innerHTML = `
    <div style="position:relative;width:${MARKER_SIZE_PX}px;height:${MARKER_SIZE_PX}px;display:flex;align-items:center;justify-content:center;pointer-events:auto">
      <div class="vehicle-marker-ring" style="position:absolute;inset:2px;border-radius:50%;border:3px solid ${RING_COLOR[status]};${selected ? "box-shadow:0 0 0 2px rgba(34,211,238,0.85);" : ""}"></div>
      <div class="vehicle-marker-car" style="position:relative;z-index:1;filter:drop-shadow(0 1px 2px rgba(15,23,42,0.45))">
        ${carSvg(heading)}
      </div>
    </div>`;
  return el;
}

export function updateVehicleMarkerElement(
  el: HTMLDivElement,
  status: VehicleLiveStatus,
  heading: number,
  selected: boolean
): void {
  const ring = el.querySelector<HTMLElement>(".vehicle-marker-ring");
  const car = el.querySelector<HTMLElement>(".vehicle-marker-car");
  if (ring) {
    ring.style.borderColor = RING_COLOR[status];
    ring.style.boxShadow = selected ? "0 0 0 2px rgba(34,211,238,0.85)" : "none";
  }
  if (car) car.innerHTML = carSvg(heading);
  el.dataset.status = status;
  el.dataset.selected = selected ? "1" : "0";
}
