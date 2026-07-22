"use client";

import { cn } from "@/lib/utils";

export function CopilotActionButton({
  label,
  onClick,
  variant = "default",
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warn" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-[56px] w-full rounded-2xl px-4 py-4 text-base font-bold tracking-wide transition active:scale-[0.98] disabled:opacity-40",
        variant === "default" && "bg-gis-blue/30 text-gis-blue-light ring-1 ring-gis-blue/40",
        variant === "danger" && "bg-red-700 text-white ring-1 ring-red-400/50",
        variant === "success" && "bg-emerald-700 text-white ring-1 ring-emerald-400/40",
        variant === "warn" && "bg-amber-600 text-white ring-1 ring-amber-300/40",
        variant === "ghost" && "bg-white/10 text-white ring-1 ring-white/15"
      )}
    >
      {label}
    </button>
  );
}
