import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types";

const STYLES: Record<VehicleStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  idle: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  offline: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
  violation: "bg-red-500/15 text-red-400 ring-red-500/30",
};

const LABELS: Record<VehicleStatus, string> = {
  active: "Active",
  idle: "Idle",
  offline: "Offline",
  violation: "Violation",
};

export function VehicleStatusBadge({
  status,
  className,
  live = false,
}: {
  status: VehicleStatus;
  className?: string;
  live?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        STYLES[status],
        className
      )}
    >
      {live && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-90" />
      )}
      {LABELS[status]}
    </span>
  );
}
