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
    <section className="flex h-[100dvh] flex-col gap-3 overflow-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-4 md:p-4">
      <header className="shrink-0 space-y-3">
        <article>
          <h1 className="text-xl font-semibold text-white md:text-2xl">Violation Command</h1>
          <p className="text-xs text-slate-500 md:text-sm">OUT_OF_ROUTE · NO_SIGNAL · OVERSPEED · IDLE</p>
        </article>
        <nav className="flex flex-wrap gap-2">
          {["", "Low", "Medium", "High", "Critical"].map((s) => (
            <Button key={s || "all"} size="sm" variant={severity === s ? "default" : "outline"} onClick={() => setSeverity(s)}>
              {s || "All"}
            </Button>
          ))}
        </nav>
      </header>
      <nav className="flex flex-wrap gap-2">
        {["OUT_OF_ROUTE", "NO_SIGNAL", "OVERSPEED", "IDLE"].map((t) => (
          <Button key={t} size="sm" variant={type === t ? "default" : "ghost"} onClick={() => setType(type === t ? "" : t)}>
            {t}
          </Button>
        ))}
      </nav>
      <section className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4">
        <main className="glass-panel order-1 shrink-0 overflow-hidden rounded-xl p-1 md:order-2 md:min-h-0 md:flex-1">
          <LiveMap />
        </main>
        <aside className="order-2 max-h-[38dvh] w-full space-y-2 overflow-y-auto md:order-1 md:max-h-none md:w-96">
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
      </section>
    </section>
  );
}
