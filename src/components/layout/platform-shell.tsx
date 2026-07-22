"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ConnectionHeader, GpsWarningBanner } from "@/components/shared/connection-header";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/lib/i18n";

const mobileLinks = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/live-monitoring", key: "liveMonitoring" as const },
  { href: "/survey-copilot", key: "surveyCopilot" as const },
  { href: "/survey-guidance", key: "commandCenter" as const },
  { href: "/vehicles", key: "vehicles" as const },
  { href: "/permits", key: "permits" as const },
  { href: "/geo-upload", key: "geoUpload" as const },
  { href: "/settings", key: "settings" as const },
  { href: "/settings/system-health", key: "systemHealth" as const },
  { href: "/settings/about", key: "about" as const },
] as const;

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = useLocaleStore((s) => s.messages.nav);

  return (
    <>
      <header className="fixed start-0 end-0 top-0 z-[60] flex items-center justify-between border-b border-gold/10 bg-navy-950/95 px-4 py-3 backdrop-blur-md md:hidden">
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
          "fixed end-0 top-0 z-[58] flex h-full w-72 flex-col border-s border-gold/10 bg-navy-950 p-4 pt-16 transition-transform md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {mobileLinks.map(({ href, key }) => (
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
            {nav[key]}
          </Link>
        ))}
      </nav>

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="fixed end-4 top-4 z-[55] hidden md:block">
        <ConnectionHeader />
      </div>

      <main className="min-h-[100dvh] bg-navy-950 pt-14 md:ms-64 md:min-h-screen md:pt-0">
        <GpsWarningBanner />
        {children}
      </main>
    </>
  );
}
