"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import type { Vehicle, VehicleType } from "@/types";
import { DUBAI } from "@/lib/geo";

const TYPES: VehicleType[] = ["SUV", "Pickup", "Van", "Truck", "Municipality Vehicle"];

export default function VehiclesPage() {
  const vehicles = useAppStore((s) => s.vehicles);
  const companies = useAppStore((s) => s.companies);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const deleteVehicle = useAppStore((s) => s.deleteVehicle);
  const getCompany = useAppStore((s) => s.getCompany);
  const [plate, setPlate] = useState("");

  const create = () => {
    if (!plate.trim() || !companies.length) return;
    const co = companies[0];
    const v: Vehicle = {
      id: `vh-${Date.now()}`,
      plateNumber: plate.trim().toUpperCase(),
      companyId: co.id,
      vehicleType: "SUV",
      driverName: "New Driver",
      permitId: null,
      assignedRouteId: null,
      status: "active",
      imei: null,
      latitude: DUBAI.center.lat,
      longitude: DUBAI.center.lng,
      speed: 0,
      heading: 0,
      ignition: true,
      lastUpdate: new Date().toISOString(),
      routeProgress: 0,
      waypointIndex: 0,
      targetLat: DUBAI.center.lat,
      targetLng: DUBAI.center.lng,
    };
    addVehicle(v);
    setPlate("");
  };

  return (
    <section className="min-h-screen p-4">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <article>
          <h1 className="text-2xl font-semibold text-white">Vehicle Management</h1>
          <p className="text-sm text-slate-500">{vehicles.length} tracked vehicles</p>
        </article>
        <fieldset className="flex gap-2 border-0 p-0">
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Plate e.g. DXB-12345"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <Button onClick={create} className="gap-2">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        </fieldset>
      </header>

      <section className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Plate</th>
              <th className="p-4">Type</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Company</th>
              <th className="p-4">Status</th>
              <th className="p-4">Speed</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className="border-t border-white/5 hover:bg-white/5"
              >
                <td className="p-4 font-medium text-blue-400">{v.plateNumber}</td>
                <td className="p-4 text-slate-300">{v.vehicleType}</td>
                <td className="p-4 text-slate-300">{v.driverName}</td>
                <td className="p-4 text-slate-400">{getCompany(v.companyId)?.name}</td>
                <td className="p-4">
                  <span
                    className={
                      v.status === "active"
                        ? "text-emerald-400"
                        : v.status === "violation"
                          ? "text-red-400"
                          : "text-slate-400"
                    }
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-4 tabular-nums text-slate-300">{Math.round(v.speed)} km/h</td>
                <td className="p-4">
                  <Button size="icon" variant="ghost" onClick={() => deleteVehicle(v.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
