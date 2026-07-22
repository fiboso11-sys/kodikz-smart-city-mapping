/**
 * Authenticated request context — always server-derived, never from browser trust.
 */

import type { Permission, RoleCode } from "./permissions";
import { permissionsForRoles } from "./permissions";

export interface AuthContext {
  userId: string;
  tenantId: string;
  roles: RoleCode[];
  permissions: Permission[];
  sessionId: string;
  requestId: string;
  email?: string;
  displayName?: string;
  driverId?: string | null;
  vehicleIds?: string[];
}

export function buildAuthContext(input: {
  userId: string;
  tenantId: string;
  roles: RoleCode[];
  sessionId: string;
  requestId: string;
  email?: string;
  displayName?: string;
  driverId?: string | null;
  vehicleIds?: string[];
}): AuthContext {
  const perms = [...permissionsForRoles(input.roles)];
  return {
    ...input,
    permissions: perms,
  };
}

export function authHas(ctx: AuthContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission);
}

export function assertSameTenant(ctx: AuthContext, tenantId: string): void {
  if (ctx.roles.includes("SUPER_ADMIN")) return;
  if (ctx.tenantId !== tenantId) {
    const err = new Error("TENANT_ISOLATION_VIOLATION");
    (err as Error & { code: string }).code = "FORBIDDEN";
    throw err;
  }
}
