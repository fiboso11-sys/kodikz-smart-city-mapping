import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gold/10 bg-navy-950/80 px-6 py-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gis-blue">
          GISCD Operations
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  accent = "gis",
  className,
}: {
  label: string;
  value: string | number;
  accent?: "gis" | "gold" | "dm" | "success" | "danger";
  className?: string;
}) {
  const accents = {
    gis: "border-gis-blue/30 text-gis-blue",
    gold: "border-gold/30 text-gold",
    dm: "border-dm-red/30 text-dm-red-light",
    success: "border-emerald-500/30 text-emerald-400",
    danger: "border-red-500/30 text-red-400",
  };
  return (
    <div className={cn("command-panel rounded-xl p-4", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", accents[accent].split(" ").pop())}>
        {value}
      </p>
      <div className={cn("mt-3 h-0.5 w-10 rounded-full bg-gradient-to-r", accents[accent])} />
    </div>
  );
}
