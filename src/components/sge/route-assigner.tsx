"use client";

import { useState, useEffect } from "react";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import { useSgeStore } from "@/store/sge-store";
import { useGeoUploads } from "@/hooks/use-permits";

interface RouteAssignerProps {
  vehicleId: string;
  vehicleName: string;
}

export function RouteAssigner({ vehicleId }: RouteAssignerProps) {
  const { data: geoUploads = [] } = useGeoUploads();
  const createAndStart = useRouteAssignmentStore((s) => s.createAndStart);
  const cancelAssignment = useRouteAssignmentStore((s) => s.cancelAssignment);
  const refresh = useRouteAssignmentStore((s) => s.refresh);
  const getAssignmentForVehicle = useRouteAssignmentStore((s) => s.getAssignmentForVehicle);

  const byVehicle = useSgeStore((s) => s.byVehicle);
  const setFocusedVehicle = useSgeStore((s) => s.setFocusedVehicle);

  const [selectedRouteId, setSelectedRouteId] = useState("");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const routeUploads = geoUploads.filter((u) => u.type === "route");
  const assignment = getAssignmentForVehicle(vehicleId);
  const isThisVehicleActive = Boolean(byVehicle[vehicleId] || assignment);

  const handleAssign = () => {
    const route = routeUploads.find((r) => r.id === selectedRouteId);
    if (!route) return;

    const geometry = route.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
    if (geometry.type !== "LineString" && geometry.type !== "MultiLineString") return;

    createAndStart({
      tenantId: "dubai-giscd",
      vehicleId,
      routeId: route.id,
      routeName: route.name,
      permitId: route.permitId || null,
      createdBy: "supervisor",
      geometry,
    });
    setFocusedVehicle(vehicleId);
    setSelectedRouteId("");
  };

  const handleCancel = () => {
    if (assignment) {
      cancelAssignment(assignment.id);
    }
  };

  if (isThisVehicleActive && assignment) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Active Survey
          </span>
          <span className="text-xs font-medium text-emerald-400">{assignment.routeName}</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Status: {assignment.status} · {assignment.id.slice(0, 12)}…
        </p>
        <button
          onClick={handleCancel}
          className="w-full rounded-md bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50 transition-colors"
        >
          Cancel Survey
        </button>
      </div>
    );
  }

  if (routeUploads.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        No routes uploaded. Upload a route GeoJSON in Geo Upload first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">Assign Survey Route</p>
      <select
        value={selectedRouteId}
        onChange={(e) => setSelectedRouteId(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-white"
      >
        <option value="">Select a route…</option>
        {routeUploads.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!selectedRouteId}
        className="w-full rounded-md bg-gis-blue/20 px-3 py-1.5 text-xs font-medium text-gis-blue-light hover:bg-gis-blue/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Start Survey
      </button>
    </div>
  );
}
