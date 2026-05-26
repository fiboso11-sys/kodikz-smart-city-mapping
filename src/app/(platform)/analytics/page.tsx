"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Car, Gauge, Route, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { useAppStore } from "@/store";
import { getAnalytics } from "@/lib/violations";

export default function AnalyticsPage() {
  const vehicles = useAppStore((s) => s.vehicles);
  const violations = useAppStore((s) => s.violations);
  const history = useAppStore((s) => s.history);
  const companies = useAppStore((s) => s.companies);
  const stats = getAnalytics(vehicles, violations, history.length);

  const daily = useMemo(() => {
    const days = new Map<string, number>();
    for (const h of history) {
      const d = h.timestamp.slice(0, 10);
      days.set(d, (days.get(d) ?? 0) + 1);
    }
    return [...days.entries()].map(([day, points]) => ({ day, points }));
  }, [history]);

  const byCompany = useMemo(
    () =>
      companies.slice(0, 10).map((c) => ({
        name: c.name.replace("Dubai Fleet Co ", "Co "),
        vehicles: vehicles.filter((v) => v.companyId === c.id).length,
      })),
    [companies, vehicles]
  );

  const vTrends = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of violations) {
      const d = v.createdAt.slice(0, 10);
      m.set(d, (m.get(d) ?? 0) + 1);
    }
    return [...m.entries()].map(([day, count]) => ({ day, count }));
  }, [violations]);

  return (
    <section className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics Center</h1>
        <p className="text-sm text-slate-500">Fleet intelligence & compliance metrics</p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total Vehicles" value={stats.totalVehicles} icon={Car} />
        <StatCard label="Active" value={stats.activeVehicles} icon={TrendingUp} accent="text-emerald-400" />
        <StatCard label="Offline" value={stats.offlineVehicles} icon={Car} />
        <StatCard label="Violations Today" value={stats.violationsToday} icon={AlertTriangle} accent="text-red-400" />
        <StatCard label="Distance" value={`${stats.distanceCoveredKm} km`} icon={Route} />
        <StatCard label="Compliance" value={`${stats.complianceScore}%`} icon={Gauge} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase text-slate-400">Daily Tracking</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="points" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.article>

        <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase text-slate-400">Company Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCompany}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={8} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="vehicles" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.article>

        <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel col-span-full rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase text-slate-400">Violation Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vTrends}>
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </motion.article>
      </section>
    </section>
  );
}
