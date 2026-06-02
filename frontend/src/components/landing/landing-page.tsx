"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Car,
  CheckCircle2,
  History,
  Map,
  Radio,
  Route,
  ScanLine,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const highlights = [
  { value: "24/7", label: "Live project visibility for Dubai Municipality" },
  { value: "GIS", label: "Street-mapping fleet on city map layers" },
  { value: "Full stack", label: "Trackers, app & maintenance by Kodikz" },
  { value: "One desk", label: "Seven modules — one monitoring platform" },
];

const kodikzScope = [
  "Install GPS tracking hardware on every vehicle that collects mapping data for the municipality",
  "Deliver and operate this monitoring application for Dubai Municipality project control",
  "Maintain field hardware, connectivity, and application uptime for the Smart City GIS program",
  "Give project managers continuous visibility into where mapping work is happening across Dubai",
];

const appModules = [
  {
    href: "/command",
    label: "Live Map",
    icon: Map,
    title: "Real-time mapping fleet command",
    desc: "The operations heart of the project. See every survey vehicle on Dubai GIS layers, filter by contractor, check speed and last update, and confirm crews are on street collecting mapping data — any time of day.",
  },
  {
    href: "/routes",
    label: "Routes",
    icon: Route,
    title: "Approved survey corridors",
    desc: "Define and manage the paths mapping vehicles should follow. Tie routes to operators and permits so project leads can see planned coverage versus where units are actually driving.",
  },
  {
    href: "/violations",
    label: "Violations",
    icon: AlertTriangle,
    title: "Alerts when work goes off-plan",
    desc: "Automatic flags for out-of-route movement, lost GPS signal, excessive idle time, and overspeed — so municipality supervisors can act before survey gaps slow the Smart City GIS build.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    title: "Program progress dashboards",
    desc: "Summaries for leadership: fleet activity, violation trends, and mapping effort over time — supporting monthly reviews and stakeholder reporting without digging through raw logs.",
  },
  {
    href: "/companies",
    label: "Companies",
    icon: Building2,
    title: "Licensed operator registry",
    desc: "Register the contractors and fleet operators running mapping vehicles for Dubai Municipality — trade licenses, contacts, and status in one place linked to vehicles and permits.",
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    icon: Car,
    title: "Mapping unit registry",
    desc: "Each survey vehicle’s plate, driver, assigned route, permit, and live telemetry status. The master list of who is authorized to collect GIS street data on behalf of the project.",
  },
  {
    href: "/playback",
    label: "Playback",
    icon: History,
    title: "Historical route replay",
    desc: "Rewind any unit’s movement along its assigned corridor for audits, dispute resolution, and proof that mapping runs were completed — evidence the municipality can trust.",
  },
];

const steps = [
  {
    n: "01",
    title: "Kodikz equips the mapping fleet",
    text: "GPS tracking units are installed on vehicles that collect street and GIS mapping data for Dubai Municipality.",
  },
  {
    n: "02",
    title: "Crews capture city mapping data",
    text: "Field teams drive approved corridors while sensors and survey gear build the Smart City spatial database.",
  },
  {
    n: "03",
    title: "Municipality uses this app 24/7",
    text: "Project leads move between Live Map, Routes, Violations, and the other modules to oversee coverage and keep the program transparent.",
  },
];

export function LandingPage() {
  return (
    <div className="landing-mesh relative overflow-hidden text-slate-200">
      <header className="relative z-20 border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
              K
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                Kodikz for Dubai Municipality
              </p>
              <p className="text-sm font-semibold text-white transition-colors group-hover:text-blue-200">
                Kodikz Dubai Mapping
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#app-modules" className="transition-colors hover:text-white">
              App modules
            </a>
            <a href="#workflow" className="transition-colors hover:text-white">
              Workflow
            </a>
            <a href="#kodikz" className="transition-colors hover:text-white">
              Kodikz delivers
            </a>
          </nav>
          <Button size="sm" asChild>
            <Link href="/command" className="gap-2">
              Live Map
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-24 pt-16 md:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="landing-badge mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Dubai Municipality · Smart City GIS mapping program
            </span>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              24/7 eyes on every
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                mapping vehicle
              </span>
              <br />
              across Dubai.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Vehicles across the emirate collect street and GIS data for Dubai Municipality&apos;s Smart
              City initiative. <strong className="font-medium text-slate-200">Kodikz</strong> installs
              tracking hardware, runs this monitoring platform, and maintains both — so project teams always
              know where mapping work is happening.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="default" className="h-12 px-6 text-base" asChild>
                <Link href="/command" className="gap-2">
                  Open Live Map
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="default" className="h-12 px-6 text-base" asChild>
                <a href="#app-modules">How the app works</a>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {kodikzScope.slice(0, 2).map((t) => (
                <li key={t} className="flex max-w-md items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="landing-hero-card glass-panel overflow-hidden rounded-2xl p-1">
              <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/80 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Mapping fleet · Live monitor</p>
                    <p className="text-lg font-semibold text-white">Dubai GIS survey control</p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                    <Radio className="h-3 w-3" />
                    24/7 online
                  </span>
                </div>
                <div className="landing-map-preview relative mb-4 aspect-[4/3] overflow-hidden rounded-lg border border-white/10">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <div className="absolute left-[18%] top-[32%] h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                  <div className="absolute left-[45%] top-[48%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  <div className="absolute left-[62%] top-[28%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  <div className="absolute left-[72%] top-[58%] h-3 w-3 rounded-full bg-blue-500 ring-2 ring-cyan-300/50" />
                  <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 400 300">
                    <path
                      d="M 60 120 Q 140 80 200 140 T 320 100"
                      fill="none"
                      stroke="url(#routeGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-[10px] text-cyan-200 backdrop-blur-sm">
                    <ScanLine className="mr-1 inline h-3 w-3" />
                    Street mapping in progress
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appModules.map((m) => (
                    <span
                      key={m.label}
                      className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/5 bg-slate-950/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {highlights.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center md:text-left"
            >
              <p className="text-2xl font-bold text-white md:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="app-modules" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-14 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              How this app supports the project
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Seven modules — one platform for GIS mapping oversight
            </h2>
            <p className="mt-4 text-slate-400">
              Dubai Municipality uses each section of the Kodikz monitor for a specific part of the Smart
              City street-mapping program. Together they deliver the 24/7 visibility the project requires.
            </p>
          </motion.div>
          <div className="space-y-4">
            {appModules.map((m, i) => (
              <motion.div
                key={m.label}
                {...fadeUp}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={m.href}
                  className="glass-panel group flex flex-col gap-4 rounded-2xl p-6 transition-colors hover:border-blue-500/40 sm:flex-row sm:items-start"
                >
                  <div className="flex shrink-0 items-center gap-4 sm:w-48">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-colors group-hover:bg-blue-500/25">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400/90">
                      {m.label}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-200">
                      {m.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.desc}</p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-400 sm:block" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="relative z-10 border-t border-white/5 bg-slate-950/40 px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Program workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              From Kodikz install to municipality oversight
            </h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-8"
              >
                <span className="text-4xl font-black text-white/10">{s.n}</span>
                <h3 className="mt-2 text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="kodikz" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="glass-panel overflow-hidden rounded-3xl p-10 md:p-14">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Wrench className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Kodikz delivers the full monitoring stack
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">
              Dubai Municipality engaged Kodikz for end-to-end visibility on the GIS mapping program:
              tracking hardware on every survey vehicle, this web application with Live Map, Routes,
              Violations, Analytics, Companies, Vehicles, and Playback — plus ongoing maintenance for the
              Smart City deployment.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {kodikzScope.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-32 pt-8">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-14 text-center shadow-2xl shadow-blue-900/40"
        >
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Dubai Municipality deserves non-stop visibility
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Mapping vehicles build the city&apos;s GIS foundation street by street. Kodikz keeps trackers
            installed, every app module running, and project leaders informed — around the clock.
          </p>
          <Button
            size="default"
            className="mt-8 h-12 bg-white px-8 text-base text-blue-700 hover:bg-blue-50"
            asChild
          >
            <Link href="/command" className="gap-2">
              Start with Live Map
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-slate-500 md:flex-row md:text-left">
          <p>
            © {new Date().getFullYear()} Kodikz · Dubai Municipality Smart City GIS Mapping Program
            <span className="mx-2 hidden md:inline">·</span>
            <span className="block md:inline">
              Vehicle monitoring · hardware &amp; application maintained by Kodikz
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:justify-end">
            {appModules.map((m) => (
              <Link key={m.href} href={m.href} className="hover:text-slate-300">
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
