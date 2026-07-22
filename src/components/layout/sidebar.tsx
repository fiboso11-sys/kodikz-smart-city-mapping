"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Car,
  Compass,
  FileText,
  LayoutDashboard,
  MapPin,
  Navigation,
  Radio,
  Route,
  Settings,
  Shapes,
  Upload,
  FileBadge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_SUBTITLE } from "@/lib/config";
import { useGisStore } from "@/store/gis-store";
import { useLocaleStore } from "@/lib/i18n";

const phase1Nav = [
  { href: "/dashboard", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/live-monitoring", key: "liveMonitoring" as const, icon: Radio },
  { href: "/vehicles", key: "vehicles" as const, icon: Car },
  { href: "/permits", key: "permits" as const, icon: FileBadge },
  { href: "/geo-upload", key: "geoUpload" as const, icon: Upload },
  { href: "/settings", key: "settings" as const, icon: Settings },
];

const phase2Nav = [
  { href: "/survey-copilot", key: "surveyCopilot" as const, icon: Navigation },
  { href: "/survey-guidance", key: "commandCenter" as const, icon: Compass },
  { href: "/route-management", key: "routeManagement" as const, icon: Route },
  { href: "/area-management", key: "areaManagement" as const, icon: Shapes },
  { href: "/violations", key: "violations" as const, icon: AlertTriangle },
  { href: "/analytics", key: "analytics" as const, icon: BarChart3 },
  { href: "/reports", key: "reports" as const, icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const connectionStatus = useGisStore((s) => s.connectionStatus);
  const gpsError = useGisStore((s) => s.gpsError);
  const connected = connectionStatus === "CONNECTED";
  const messages = useLocaleStore((s) => s.messages);
  const nav = messages.nav;
  const chrome = messages.chrome;

  const gpsLabel =
    connected
      ? chrome.gpsConnected
      : connectionStatus === "RECONNECTING"
        ? chrome.gpsReconnecting
        : chrome.gpsDisconnected;

  return (
    <aside className="fixed start-0 top-0 z-50 flex h-screen w-64 flex-col border-e border-gold/10 bg-navy-950/95 backdrop-blur-xl">
      <Link href="/dashboard">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-gold/10 p-5 transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-gold" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gis-blue-light">
              {chrome.dubaiMunicipality}
            </p>
          </div>
          <h1 className="mt-2 text-sm font-bold leading-snug text-white">{APP_NAME}</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{APP_SUBTITLE}</p>
        </motion.div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          {chrome.phase1}
        </p>
        <div className="space-y-0.5">
          {phase1Nav.map(({ href, key, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    active
                      ? "bg-gis-blue/20 text-gis-blue-light ring-1 ring-gis-blue/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {nav[key]}
                </motion.div>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          {chrome.phase2}
        </p>
        <div className="space-y-0.5">
          {phase2Nav.map(({ href, key, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const live = href === "/survey-copilot" || href === "/survey-guidance";
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    active
                      ? "bg-gis-blue/20 text-gis-blue-light ring-1 ring-gis-blue/30"
                      : live
                        ? "text-slate-300 hover:bg-white/5 hover:text-white"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-400"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", !live && !active && "opacity-60")} />
                  {nav[key]}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gold/10 p-4">
        <div className="command-panel rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                connected ? "animate-pulse bg-emerald-400" : connectionStatus === "RECONNECTING" ? "animate-pulse bg-gold" : "bg-dm-red"
              )}
            />
            <span className={connected ? "text-emerald-400" : connectionStatus === "RECONNECTING" ? "text-gold" : "text-dm-red-light"}>
              {gpsLabel}
            </span>
          </div>
          {gpsError && <p className="mt-1 text-slate-500">{gpsError}</p>}
        </div>
      </div>
    </aside>
  );
}
