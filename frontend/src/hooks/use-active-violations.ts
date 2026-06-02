"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store";
import type { Violation } from "@/types";

export function useActiveViolations(): Violation[] {
  const violations = useAppStore((s) => s.violations);

  return useMemo(
    () => violations.filter((v) => !v.resolvedAt),
    [violations]
  );
}
