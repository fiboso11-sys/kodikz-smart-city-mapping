"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LiveMap } from "@/components/map/live-map";
import { Button } from "@/components/ui/button";
import { SEVERITY_COLORS } from "@/lib/utils";
import { useAppStore } from "@/store";

export default function ViolationsPage() {
  const violations = useAppStore((s) => s.violations);
  const resolveViolation = useAppStore((s) => s.resolveViolation);
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(
    () =>
      violations.filter((v) => {
        if (severity && v.severity !== severity) return false;
        if (type && v.type !== type) return false;
        return !v.resolvedAt;
      }),
    [violations, severity, type]
  );

  return (
    <section className="flex h-screen flex-col p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <article>
          <h1 className="text-2xl font-semibold text-white">Violation Command</h1>
          <p className="text-sm text-slate-500">OUT_OF_ROUTE · NO_SIGNAL · OVERSPEED · IDLE</p>
        </article>
        <nav className="flex flex-wrap gap-2">
          {["", "Low", "Medium", "High", "Critical"].map((s) => (
            <Button key={s || "all"} size="sm" variant={severity === s ? "default" : "outline"} onClick={() => setSeverity(s)}>
              {s || "All"}
            </Button>
          ))}
        </nav>
      </header>
      <nav className="mb-4 flex flex-wrap gap-2">
        {["OUT_OF_ROUTE", "NO_SIGNAL", "OVERSPEED", "IDLE"].map((t) => (
          <Button key={t} size="sm" variant={type === t ? "default" : "ghost"} onClick={() => setType(type === t ? "" : t)}>
            {t}
          </Button>
        ))}
      </nav>
      <section className="flex min-h-0 flex-1 gap-4">
        <aside className="w-96 space-y-2 overflow-y-auto">
          {filtered.map((v, i) => (
            <motion.article
              key={v.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel rounded-xl border-l-4 p-4"
              style={{ borderLeftColor: SEVERITY_COLORS[v.severity] }}
            >
              <header className="flex justify-between">
                <span className="font-mono text-xs text-blue-400">{v.type}</span>
                <span className="text-xs font-semibold" style={{ color: SEVERITY_COLORS[v.severity] }}>
                  {v.severity}
                </span>
              </header>
              <p className="mt-2 text-sm text-white">{v.message}</p>
              <footer className="mt-3 flex items-center justify-between">
                <time className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleString("en-AE")}</time>
                <Button size="sm" variant="outline" onClick={() => resolveViolation(v.id)}>
                  Resolve
                </Button>
              </footer>
            </motion.article>
          ))}
        </aside>
        <main className="glass-panel min-h-0 flex-1 rounded-xl p-1">
          <LiveMap />
        </main>
      </section>
    </section>
  );
}
