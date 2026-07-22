"use client";

export function CopilotMetricGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
