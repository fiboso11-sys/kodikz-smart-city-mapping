/**
 * Authentication provider abstraction.
 * Pilot: local password accounts. Municipality: OIDC adapter.
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getAppConfig } from "@/lib/config/app-config";
import { buildAuthContext, type AuthContext } from "./context";
import type { RoleCode } from "./permissions";

export interface AuthUserRecord {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  status: "ACTIVE" | "DISABLED" | "LOCKED";
  roles: RoleCode[];
  driverId?: string | null;
  vehicleIds?: string[];
  failedLoginCount: number;
  lockedUntil: number | null;
}

export interface AuthProvider {
  authenticate(email: string, password: string, tenantId?: string): Promise<AuthUserRecord | null>;
  issueSession(user: AuthUserRecord): Promise<{ accessToken: string; refreshToken: string; sessionId: string; expiresAt: number }>;
  verifyAccessToken(token: string): Promise<AuthContext | null>;
  revokeSession(sessionId: string): Promise<void>;
  health(): Promise<boolean>;
}

/** In-memory user store for local/mock and unit tests */
const memoryUsers = new Map<string, AuthUserRecord>();
const memorySessions = new Map<string, { userId: string; tenantId: string; refreshHash: string; expiresAt: number; revoked: boolean }>();
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function secretKey() {
  return new TextEncoder().encode(getAppConfig().auth.jwtSecret);
}

export function seedLocalAuthUsers(): void {
  if (memoryUsers.size > 0) return;
  const hash = bcrypt.hashSync("ChangeMe!Pilot1", 10);
  const users: AuthUserRecord[] = [
    {
      id: "usr-admin",
      tenantId: "dubai-giscd",
      email: "admin@dubai-giscd.local",
      displayName: "Tenant Admin",
      passwordHash: hash,
      status: "ACTIVE",
      roles: ["TENANT_ADMIN"],
      failedLoginCount: 0,
      lockedUntil: null,
    },
    {
      id: "usr-supervisor",
      tenantId: "dubai-giscd",
      email: "supervisor@dubai-giscd.local",
      displayName: "Supervisor",
      passwordHash: hash,
      status: "ACTIVE",
      roles: ["SUPERVISOR"],
      failedLoginCount: 0,
      lockedUntil: null,
    },
    {
      id: "usr-driver",
      tenantId: "dubai-giscd",
      email: "driver@dubai-giscd.local",
      displayName: "Driver",
      passwordHash: hash,
      status: "ACTIVE",
      roles: ["DRIVER"],
      driverId: "drv-1",
      vehicleIds: [],
      failedLoginCount: 0,
      lockedUntil: null,
    },
    {
      id: "usr-viewer",
      tenantId: "dubai-giscd",
      email: "viewer@dubai-giscd.local",
      displayName: "Viewer",
      passwordHash: hash,
      status: "ACTIVE",
      roles: ["VIEWER"],
      failedLoginCount: 0,
      lockedUntil: null,
    },
  ];
  for (const u of users) memoryUsers.set(u.email.toLowerCase(), u);
}

export class LocalAuthProvider implements AuthProvider {
  constructor() {
    seedLocalAuthUsers();
  }

  async authenticate(email: string, password: string, tenantId?: string): Promise<AuthUserRecord | null> {
    const cfg = getAppConfig().auth;
    const key = email.toLowerCase();
    const attempt = loginAttempts.get(key);
    if (attempt && attempt.lockedUntil > Date.now()) {
      return null;
    }

    const user = memoryUsers.get(key);
    if (!user || (tenantId && user.tenantId !== tenantId)) {
      this.recordFailure(key, cfg);
      return null;
    }
    if (user.status !== "ACTIVE") return null;
    if (!user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      this.recordFailure(key, cfg);
      return null;
    }
    loginAttempts.delete(key);
    return user;
  }

  private recordFailure(key: string, cfg: { loginMaxAttempts: number; loginLockoutSeconds: number }) {
    const prev = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
    const count = prev.count + 1;
    const lockedUntil =
      count >= cfg.loginMaxAttempts ? Date.now() + cfg.loginLockoutSeconds * 1000 : 0;
    loginAttempts.set(key, { count, lockedUntil });
  }

  async issueSession(user: AuthUserRecord) {
    const cfg = getAppConfig().auth;
    const sessionId = `ses-${uuidv4()}`;
    const expiresAt = Date.now() + cfg.sessionTtlSeconds * 1000;
    const refreshToken = `ref-${uuidv4()}`;
    const refreshHash = bcrypt.hashSync(refreshToken, 8);
    memorySessions.set(sessionId, {
      userId: user.id,
      tenantId: user.tenantId,
      refreshHash,
      expiresAt: Date.now() + cfg.refreshTtlSeconds * 1000,
      revoked: false,
    });

    const accessToken = await new SignJWT({
      sub: user.id,
      tid: user.tenantId,
      roles: user.roles,
      sid: sessionId,
      email: user.email,
      name: user.displayName,
      driverId: user.driverId ?? null,
      vehicleIds: user.vehicleIds ?? [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${cfg.sessionTtlSeconds}s`)
      .sign(secretKey());

    return { accessToken, refreshToken, sessionId, expiresAt };
  }

  async verifyAccessToken(token: string): Promise<AuthContext | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      const sessionId = String(payload.sid ?? "");
      const session = memorySessions.get(sessionId);
      if (!session || session.revoked || session.expiresAt < Date.now()) return null;
      return buildAuthContext({
        userId: String(payload.sub),
        tenantId: String(payload.tid),
        roles: (payload.roles as RoleCode[]) ?? [],
        sessionId,
        requestId: "",
        email: payload.email ? String(payload.email) : undefined,
        displayName: payload.name ? String(payload.name) : undefined,
        driverId: (payload.driverId as string | null) ?? null,
        vehicleIds: (payload.vehicleIds as string[]) ?? [],
      });
    } catch {
      return null;
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const s = memorySessions.get(sessionId);
    if (s) memorySessions.set(sessionId, { ...s, revoked: true });
  }

  async health(): Promise<boolean> {
    return true;
  }
}

/** OIDC stub — Municipality wires issuer/client; token validation via JWKS later */
export class OidcAuthProvider implements AuthProvider {
  async authenticate(): Promise<AuthUserRecord | null> {
    throw new Error("OIDC password login not supported — use SSO redirect flow");
  }
  async issueSession(): Promise<never> {
    throw new Error("OIDC sessions issued by IdP");
  }
  async verifyAccessToken(_token: string): Promise<AuthContext | null> {
    // Placeholder: Municipality deployment replaces with JWKS verification + role mapping
    return null;
  }
  async revokeSession(): Promise<void> {}
  async health(): Promise<boolean> {
    return Boolean(getAppConfig().auth.oidcIssuer);
  }
}

export class MockAuthProvider extends LocalAuthProvider {
  async authenticate(email: string, password: string, tenantId?: string) {
    if (!getAppConfig().auth.mockAuthEnabled) return null;
    return super.authenticate(email, password, tenantId);
  }
}

let provider: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (provider) return provider;
  const mode = getAppConfig().auth.provider;
  if (mode === "oidc") provider = new OidcAuthProvider();
  else if (mode === "mock") provider = new MockAuthProvider();
  else provider = new LocalAuthProvider();
  return provider;
}

export function resetAuthProviderForTests(): void {
  provider = null;
  memoryUsers.clear();
  memorySessions.clear();
  loginAttempts.clear();
}
