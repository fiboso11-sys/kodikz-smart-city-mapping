"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ConnectionHeader, GpsWarningBanner } from "@/components/shared/connection-header";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/live-monitoring", label: "Live Monitoring" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/permits", label: "Permits" },
  { href: "/geo-upload", label: "Geo Upload" },
  { href: "/settings", label: "Settings" },
  { href: "/settings/system-health", label: "System Health" },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between border-b border-gold/10 bg-navy-950/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="text-xs font-semibold text-white">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <ConnectionHeader />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
          "fixed right-0 top-0 z-[58] flex h-full w-72 flex-col border-l border-gold/10 bg-navy-950 p-4 pt-16 transition-transform md:hidden",
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
                ? "bg-gis-blue/20 text-gis-blue-light"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="fixed right-4 top-4 z-[55] hidden md:block">
        <ConnectionHeader />
      </div>

      <main className="min-h-[100dvh] bg-navy-950 pt-14 md:ml-64 md:min-h-screen md:pt-0">
        <GpsWarningBanner />
        {children}
      </main>
    </>
  );
}
