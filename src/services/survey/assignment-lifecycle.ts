/**
 * Assignment lifecycle state machine — central transition rules + optimistic concurrency.
 */

import type { AssignmentStatus, SurveyAssignment } from "@/platform/sge";

const ALLOWED: Record<AssignmentStatus, AssignmentStatus[]> = {
  DRAFT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAUSED", "COMPLETED", "CANCELLED"],
  PAUSED: ["ACTIVE", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: AssignmentStatus, to: AssignmentStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  code = "INVALID_TRANSITION";
  constructor(from: AssignmentStatus, to: AssignmentStatus) {
    super(`Cannot transition assignment from ${from} to ${to}`);
  }
}

export class ConcurrencyConflictError extends Error {
  code = "CONCURRENCY_CONFLICT";
  constructor() {
    super("Assignment was modified by another operator. Refresh and retry.");
  }
}

export function applyTransition(
  assignment: SurveyAssignment & { version?: number },
  to: AssignmentStatus,
  actor: string,
  expectedVersion?: number
): SurveyAssignment & { version: number } {
  if (!canTransition(assignment.status, to)) {
    throw new InvalidTransitionError(assignment.status, to);
  }
  const version = assignment.version ?? 1;
  if (expectedVersion != null && expectedVersion !== version) {
    throw new ConcurrencyConflictError();
  }
  const now = Date.now();
  return {
    ...assignment,
    status: to,
    version: version + 1,
    updatedAt: now,
    approvedBy:
      to === "ASSIGNED" ? actor : assignment.approvedBy,
    actualStart:
      to === "ACTIVE" ? assignment.actualStart ?? now : assignment.actualStart,
    actualEnd:
      to === "COMPLETED" || to === "CANCELLED" ? now : assignment.actualEnd,
  };
}
