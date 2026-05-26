"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "text-municipality-light",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      <motion.div
        className="flex items-start justify-between"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </motion.div>
        <div className={cn("rounded-lg bg-white/5 p-2.5 ring-1 ring-white/10", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </motion.div>
    </motion.div>
  );
}
