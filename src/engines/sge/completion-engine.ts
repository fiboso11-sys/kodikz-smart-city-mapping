/**
 * Survey Guidance Engine — Completion Engine
 *
 * Computes route completion percentage and status from segment data.
 */

import { getSgeConfig } from "./config";
import type { CompletionStatus } from "./types";

export interface CompletionResult {
  completionPct: number;
  status: CompletionStatus;
  completedLengthMetres: number;
  remainingLengthMetres: number;
  totalLengthMetres: number;
}

export function computeCompletion(
  completedLengthMetres: number,
  totalLengthMetres: number
): CompletionResult {
  const cfg = getSgeConfig().completion;

  if (totalLengthMetres <= 0) {
    return {
      completionPct: 0,
      status: "NOT_STARTED",
      completedLengthMetres: 0,
      remainingLengthMetres: 0,
      totalLengthMetres: 0,
    };
  }

  const pct = Math.min(100, (completedLengthMetres / totalLengthMetres) * 100);
  const remainingLengthMetres = totalLengthMetres - completedLengthMetres;

  let status: CompletionStatus;
  if (pct <= cfg.notStartedPct) {
    status = "NOT_STARTED";
  } else if (pct <= cfg.inProgressMaxPct) {
    status = "IN_PROGRESS";
  } else if (pct <= cfg.nearlyCompleteMaxPct) {
    status = "NEARLY_COMPLETE";
  } else if (pct < cfg.completedPct) {
    status = "COMPLETION_CANDIDATE";
  } else {
    status = "COMPLETED";
  }

  return {
    completionPct: Math.round(pct * 10) / 10,
    status,
    completedLengthMetres,
    remainingLengthMetres,
    totalLengthMetres,
  };
}
