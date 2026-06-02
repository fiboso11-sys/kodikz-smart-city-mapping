"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Car,
  History,
  Map,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

const nav = [
  { href: "/command", label: "Live Map", icon: Map },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/violations", label: "Violations", icon: AlertTriangle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/playback", label: "Playback", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const providerKind = useAppStore((s) => s.providerKind);
  const gpsApiStatus = useAppStore((s) => s.gpsApiStatus);

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <Link href="/">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 p-6 transition-colors hover:bg-white/[0.02]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-municipality-light">
            Dubai Municipality
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">Kodikz Dubai Mapping</h1>
          <p className="text-xs text-slate-500">GIS fleet command</p>
        </motion.div>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 3 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  active
                    ? "bg-municipality/20 text-municipality-light ring-1 ring-municipality/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t border-white/10 p-4"
      >
        <div className="glass-panel rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {providerKind === "simulator" ? "Simulator Active" : "Teltonika (stub)"}
          </div>
          <p className="mt-1 text-slate-500">{gpsApiStatus.message}</p>
        </div>
      </motion.div>
    </aside>
  );
}
