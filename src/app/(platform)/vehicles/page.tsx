"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableControls, SortableTh } from "@/components/shared/data-table-controls";
import { useVehicles } from "@/hooks/use-vehicles";
import { filterRows, paginate, sortRows } from "@/lib/table-utils";
import type { CreateVehicleInput, VehicleMasterStatus, VehicleType } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";

const VEHICLE_TYPES: VehicleType[] = ["SUV", "4x4", "Sedan", "Hatchback", "Van"];
const STATUSES: VehicleMasterStatus[] = ["Active", "Inactive", "Maintenance"];

const emptyForm: CreateVehicleInput = {
  imei: "",
  plateNumber: "",
  vehicleName: "",
  vehicleType: "SUV",
  companyName: "",
  driverName: "",
  driverMobile: "",
  simNumber: "",
  permitNumber: "",
  installationDate: new Date().toISOString().slice(0, 10),
  status: "Active",
  notes: "",
};

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("vehicleName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [form, setForm] = useState<CreateVehicleInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const tableData = useMemo(() => {
    const filtered = filterRows(vehicles, filter, [
      "imei",
      "plateNumber",
      "vehicleName",
      "companyName",
      "permitNumber",
    ]);
    const sorted = sortRows(filtered, sortKey, sortDir);
    return paginate(sorted, page, pageSize);
  }, [vehicles, filter, sortKey, sortDir, page, pageSize]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const save = async () => {
    if (!form) return;
    const url = editId ? `/api/vehicles/${editId}` : "/api/vehicles";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(null);
      setEditId(null);
      await qc.invalidateQueries({ queryKey: ["vehicles"] });
      await qc.invalidateQueries({ queryKey: ["vehicles-live"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this vehicle from master registry?")) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const startEdit = (v: (typeof vehicles)[0]) => {
    setEditId(v.id);
    setForm({
      imei: v.imei,
      plateNumber: v.plateNumber,
      vehicleName: v.vehicleName,
      vehicleType: v.vehicleType,
      companyName: v.companyName,
      driverName: v.driverName,
      driverMobile: v.driverMobile,
      simNumber: v.simNumber,
      permitNumber: v.permitNumber,
      installationDate: v.installationDate,
      status: v.status,
      notes: v.notes,
    });
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Vehicle Master" subtitle="Fleet registry — IMEI, permit linkage, operator details">
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ ...emptyForm });
          }}
          className="flex items-center gap-2 rounded-lg bg-gis-blue px-3 py-2 text-sm font-medium text-white hover:bg-gis-blue/90"
        >
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </PageHeader>

      <div className="p-4">
        <DataTableControls
          filter={filter}
          onFilterChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          filterPlaceholder="Filter by IMEI, plate, company…"
          page={tableData.page}
          totalPages={tableData.totalPages}
          total={tableData.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />

        <div className="command-panel overflow-x-auto rounded-xl">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <SortableTh label="IMEI" sortKey="imei" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Plate" sortKey="plateNumber" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Name" sortKey="vehicleName" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Type" sortKey="vehicleType" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Company" sortKey="companyName" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Driver" sortKey="driverName" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Permit" sortKey="permitNumber" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                tableData.items.map((v) => (
                  <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs">{v.imei}</td>
                    <td className="px-4 py-3">{v.plateNumber}</td>
                    <td className="px-4 py-3 font-medium text-white">{v.vehicleName}</td>
                    <td className="px-4 py-3">{v.vehicleType}</td>
                    <td className="px-4 py-3">{v.companyName}</td>
                    <td className="px-4 py-3">{v.driverName}</td>
                    <td className="px-4 py-3">{v.permitNumber}</td>
                    <td className="px-4 py-3">{v.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(v)}
                          className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(v.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-dm-red/20 hover:text-dm-red-light"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="command-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white">
              {editId ? "Edit Vehicle" : "New Vehicle"}
            </h2>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["imei", "IMEI"],
                  ["plateNumber", "Plate Number"],
                  ["vehicleName", "Vehicle Name"],
                  ["companyName", "Company Name"],
                  ["driverName", "Driver Name"],
                  ["driverMobile", "Driver Mobile"],
                  ["simNumber", "SIM Number"],
                  ["permitNumber", "Permit Number"],
                  ["installationDate", "Installation Date"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs text-slate-400">
                  {label}
                  <input
                    type={key === "installationDate" ? "date" : "text"}
                    value={form[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                  />
                </label>
              ))}
              <label className="block text-xs text-slate-400">
                Vehicle Type
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-400">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as VehicleMasterStatus })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-400">
                Notes
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                  rows={2}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(null);
                  setEditId(null);
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy-950"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
