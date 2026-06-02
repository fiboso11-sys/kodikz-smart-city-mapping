"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";
import { GPSProviderRunner } from "@/providers/gps-provider-runner";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialized = useAppStore((s) => s.initialized);
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <>
      <GPSProviderRunner />
      {children}
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-municipality border-t-transparent" />
      <p className="ml-4 text-sm text-slate-400">Loading Dubai Fleet Command...</p>
    </div>
  );
}
