"use client";

import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/table-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableControlsProps {
  filter: string;
  onFilterChange: (v: string) => void;
  filterPlaceholder?: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
}

export function DataTableControls({
  filter,
  onFilterChange,
  filterPlaceholder = "Filter…",
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataTableControlsProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <input
        type="search"
        placeholder={filterPlaceholder}
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full max-w-md rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white sm:w-80"
      />
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-white/10 bg-navy-900 px-2 py-1 text-white"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
        <span>
          {total} record{total === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function SortableTh({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "text-left text-xs uppercase tracking-wide",
          active ? "text-gis-blue-light" : "text-slate-500 hover:text-slate-300"
        )}
      >
        {label}
        {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}
