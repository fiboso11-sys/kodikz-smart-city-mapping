"use client";

import { motion } from "framer-motion";
import { Activity, Car, PauseCircle, Radio, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFleetMetrics } from "@/hooks/use-fleet-metrics";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel min-w-[9.5rem] shrink-0 rounded-xl p-3 md:min-w-0 md:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white md:text-2xl">{value}</p>
        </div>
        <div className={cn("shrink-0 rounded-lg bg-white/5 p-2 ring-1 ring-white/10", accent)}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function FleetOverviewKpis() {
  const metrics = useFleetMetrics();

  const cards = [
    {
      label: "Total vehicles",
      value: metrics.total,
      icon: Car,
      accent: "text-municipality-light",
    },
    {
      label: "Active",
      value: metrics.active,
      icon: Radio,
      accent: "text-emerald-400",
    },
    {
      label: "Idle",
      value: metrics.idle,
      icon: PauseCircle,
      accent: "text-amber-400",
    },
    {
      label: "Offline",
      value: metrics.offline,
      icon: WifiOff,
      accent: "text-slate-400",
    },
    {
      label: "Reporting < 15s",
      value: metrics.reporting,
      icon: Activity,
      accent: "text-cyan-400",
    },
  ] as const;

  return (
    <section aria-label="Fleet overview" className="shrink-0">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fleet overview
        </h2>
        <span className="hidden text-[10px] text-slate-600 md:inline">
          Updates with each GPS poll
        </span>
      </div>
      <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:pb-0">
        {cards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}
