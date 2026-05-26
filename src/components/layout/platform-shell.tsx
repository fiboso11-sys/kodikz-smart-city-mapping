"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/command", label: "Live Map" },
  { href: "/routes", label: "Routes" },
  { href: "/violations", label: "Violations" },
  { href: "/analytics", label: "Analytics" },
  { href: "/companies", label: "Companies" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/playback", label: "Playback" },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/" className="text-sm font-semibold text-white">
          Kodikz Dubai Mapping
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <nav
        className={cn(
          "fixed right-0 top-0 z-[58] flex h-full w-72 flex-col border-l border-white/10 bg-slate-950 p-4 pt-16 transition-transform md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {mobileLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-3 text-sm",
              pathname === href
                ? "bg-municipality/20 text-municipality-light"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mt-4 rounded-lg border border-white/10 px-3 py-3 text-center text-sm text-slate-400"
        >
          Back to home
        </Link>
      </nav>

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="min-h-screen pt-14 md:ml-64 md:pt-0">{children}</main>
    </>
  );
}
