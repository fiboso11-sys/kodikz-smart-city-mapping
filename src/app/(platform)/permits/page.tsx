"use client";

import { useMemo, useState, Fragment } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableControls, SortableTh } from "@/components/shared/data-table-controls";
import { usePermits } from "@/hooks/use-permits";
import { useVehicles } from "@/hooks/use-vehicles";
import { filterRows, paginate, sortRows } from "@/lib/table-utils";
import type { CreatePermitInput, PermitMaster, PermitStatus } from "@/types";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

const STATUSES: PermitStatus[] = ["Ongoing", "Completed", "On Hold", "Expired"];

const emptyForm: CreatePermitInput = {
  permitNumber: "",
  projectName: "",
  companyName: "",
  contactPerson: "",
  contactNumber: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  status: "Ongoing",
  approvedAreaName: "",
  assignedVehicleIds: [],
  comments: "",
};

export default function PermitsPage() {
  const { data: permits = [], isLoading } = usePermits();
  const { data: vehicles = [] } = useVehicles();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("permitNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [form, setForm] = useState<CreatePermitInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );

  const tableData = useMemo(() => {
    const filtered = filterRows(permits, filter, [
      "permitNumber",
      "projectName",
      "companyName",
      "contactPerson",
    ]);
    const sorted = sortRows(filtered, sortKey, sortDir);
    return paginate(sorted, page, pageSize);
  }, [permits, filter, sortKey, sortDir, page, pageSize]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleVehicle = (vehicleId: string) => {
    if (!form) return;
    const ids = form.assignedVehicleIds ?? [];
    const next = ids.includes(vehicleId)
      ? ids.filter((id) => id !== vehicleId)
      : [...ids, vehicleId];
    setForm({ ...form, assignedVehicleIds: next });
  };

  const save = async () => {
    if (!form) return;
    const url = editId ? `/api/permits/${editId}` : "/api/permits";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(null);
      setEditId(null);
      await qc.invalidateQueries({ queryKey: ["permits"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this permit record?")) return;
    await fetch(`/api/permits/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["permits"] });
  };

  const startEdit = (p: PermitMaster) => {
    setEditId(p.id);
    setForm({
      permitNumber: p.permitNumber,
      projectName: p.projectName,
      companyName: p.companyName,
      contactPerson: p.contactPerson,
      contactNumber: p.contactNumber,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      approvedAreaName: p.approvedAreaName,
      assignedVehicleIds: [...p.assignedVehicleIds],
      comments: p.comments,
    });
  };

  const assignedLabels = (p: PermitMaster) =>
    p.assignedVehicleIds
      .map((id) => vehicleMap.get(id))
      .filter(Boolean)
      .map((v) => `${v!.vehicleName} (${v!.plateNumber})`);

  return (
    <div className="min-h-screen">
      <PageHeader title="Permit Master" subtitle="Official street mapping permits — GISCD compliance registry">
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ ...emptyForm });
          }}
          className="flex items-center gap-2 rounded-lg bg-gis-blue px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add Permit
        </button>
      </PageHeader>

      <div className="p-4">
        <DataTableControls
          filter={filter}
          onFilterChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          filterPlaceholder="Filter permits…"
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
          <table className="w-full min-w-[1024px] text-left text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <SortableTh label="Permit #" sortKey="permitNumber" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Project" sortKey="projectName" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Company" sortKey="companyName" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-xs uppercase text-slate-500">Vehicles</th>
                <SortableTh label="Period" sortKey="startDate" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                tableData.items.map((p) => (
                  <Fragment key={p.id}>
                    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs text-gold">{p.permitNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">{p.projectName}</td>
                      <td className="px-4 py-3">{p.companyName}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                          className="flex items-center gap-1 text-gis-blue-light hover:underline"
                        >
                          {p.assignedVehicleIds.length} assigned
                          {expandedId === p.id ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {p.startDate} → {p.endDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            p.status === "Ongoing"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : p.status === "Expired"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="rounded p-1.5 text-slate-400 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(p.id)}
                            className="rounded p-1.5 text-slate-400 hover:text-dm-red-light"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr key={`${p.id}-detail`} className="border-t border-white/5 bg-white/[0.02]">
                        <td colSpan={7} className="px-4 py-3 text-xs text-slate-400">
                          <p className="font-medium text-slate-300">Assigned vehicles</p>
                          {assignedLabels(p).length ? (
                            <ul className="mt-1 list-inside list-disc">
                              {assignedLabels(p).map((label) => (
                                <li key={label}>{label}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1">No vehicles assigned</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
              {editId ? "Edit Permit" : "New Permit"}
            </h2>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["permitNumber", "Permit Number"],
                  ["projectName", "Project Name"],
                  ["companyName", "Company Name"],
                  ["contactPerson", "Contact Person"],
                  ["contactNumber", "Contact Number"],
                  ["approvedAreaName", "Approved Area Name"],
                  ["startDate", "Start Date"],
                  ["endDate", "End Date"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs text-slate-400">
                  {label}
                  <input
                    type={key.includes("Date") ? "date" : "text"}
                    value={form[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                  />
                </label>
              ))}
              <label className="block text-xs text-slate-400">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PermitStatus })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="block text-xs text-slate-400">
                <span>Assigned Vehicles ({form.assignedVehicleIds?.length ?? 0})</span>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-navy-900 p-2">
                  {vehicles.length === 0 ? (
                    <p className="text-slate-500">No vehicles in registry</p>
                  ) : (
                    vehicles.map((v) => (
                      <label
                        key={v.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={form.assignedVehicleIds?.includes(v.id) ?? false}
                          onChange={() => toggleVehicle(v.id)}
                        />
                        <span className="text-sm text-white">
                          {v.vehicleName} — {v.plateNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">{v.imei}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <label className="block text-xs text-slate-400">
                Comments
                <textarea
                  value={form.comments ?? ""}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
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
                className="rounded-lg px-4 py-2 text-sm text-slate-400"
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
