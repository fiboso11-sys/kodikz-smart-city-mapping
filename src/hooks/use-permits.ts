"use client";

import { useQuery } from "@tanstack/react-query";
import type { PermitMaster } from "@/types";

export function usePermits() {
  return useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const res = await fetch("/api/permits");
      if (!res.ok) throw new Error("Failed to load permits");
      const data = await res.json();
      return data.permits as PermitMaster[];
    },
  });
}

export function useGeoUploads() {
  return useQuery({
    queryKey: ["geo-uploads"],
    queryFn: async () => {
      const res = await fetch("/api/geo-uploads");
      if (!res.ok) throw new Error("Failed to load geo uploads");
      const data = await res.json();
      return data.uploads as import("@/types/geo").GeoUploadRecord[];
    },
  });
}
