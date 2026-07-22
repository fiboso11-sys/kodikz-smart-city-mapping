/**
 * Central deployment configuration — validated at startup.
 * Modes: local | pilot | municipality
 */

import { z } from "zod";

export type DeploymentMode = "local" | "pilot" | "municipality";

const DeploymentModeSchema = z.enum(["local", "pilot", "municipality"]);

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name]?.trim();
  if (v) return v;
  return fallback;
}

function envBool(name: string, fallback = false): boolean {
  const v = process.env[name]?.trim()?.toLowerCase();
  if (v == null || v === "") return fallback;
  return v === "1" || v === "true" || v === "yes";
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name]?.trim();
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export interface AppConfig {
  deploymentMode: DeploymentMode;
  nodeEnv: string;
  appUrl: string;
  auth: {
    provider: "local" | "oidc" | "mock";
    jwtSecret: string;
    sessionTtlSeconds: number;
    refreshTtlSeconds: number;
    cookieSecure: boolean;
    mockAuthEnabled: boolean;
    oidcIssuer?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
    loginMaxAttempts: number;
    loginLockoutSeconds: number;
  };
  database: {
    url: string | null;
    ssl: boolean;
    poolMax: number;
    allowSqlite: boolean;
  };
  storage: {
    provider: "local" | "s3" | "disabled";
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle: boolean;
    maxUploadBytes: number;
  };
  redis: {
    enabled: boolean;
    url: string | null;
  };
  gps: {
    apiUrl: string;
    socketUrl: string;
  };
  geocoding: {
    provider: "nominatim" | "municipality" | "placeholder";
    minIntervalMs: number;
    cacheRadiusM: number;
  };
  rateLimit: {
    loginPerMinute: number;
    uploadPerMinute: number;
    commandPerMinute: number;
    mutationPerMinute: number;
  };
  worker: {
    enabled: boolean;
    pollIntervalMs: number;
  };
  observability: {
    logLevel: string;
  };
}

let cached: AppConfig | null = null;

export function resolveDeploymentMode(): DeploymentMode {
  const raw = env("DEPLOYMENT_MODE") ?? "local";
  const parsed = DeploymentModeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ConfigError(
      `Invalid DEPLOYMENT_MODE="${raw}". Expected local|pilot|municipality.`
    );
  }
  return parsed.data;
}

export function loadAppConfig(force = false): AppConfig {
  if (cached && !force) return cached;

  const deploymentMode = resolveDeploymentMode();
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProdLike = deploymentMode === "pilot" || deploymentMode === "municipality";

  const databaseUrl = env("DATABASE_URL") ?? env("POSTGRES_URL") ?? null;
  const allowSqlite = deploymentMode === "local" && !envBool("FORCE_POSTGRES", false);

  if (isProdLike && !databaseUrl) {
    throw new ConfigError(
      `[${deploymentMode}] PostgreSQL is required. Set DATABASE_URL. ` +
        `SQLite is not permitted in pilot/municipality modes.`
    );
  }

  const authProviderRaw = env("AUTH_PROVIDER", deploymentMode === "local" ? "mock" : "local");
  const authProvider =
    authProviderRaw === "oidc" || authProviderRaw === "local" || authProviderRaw === "mock"
      ? authProviderRaw
      : "local";

  const jwtSecret = env("AUTH_JWT_SECRET") ?? env("SESSION_SECRET") ?? "";
  if (isProdLike && (!jwtSecret || jwtSecret.length < 32)) {
    throw new ConfigError(
      `[${deploymentMode}] AUTH_JWT_SECRET (min 32 chars) is required.`
    );
  }

  if (isProdLike && authProvider === "mock") {
    throw new ConfigError(`[${deploymentMode}] Mock authentication is not allowed.`);
  }

  const storageProviderRaw = env("STORAGE_PROVIDER", deploymentMode === "local" ? "local" : "s3");
  const storageProvider =
    storageProviderRaw === "s3" || storageProviderRaw === "local" || storageProviderRaw === "disabled"
      ? storageProviderRaw
      : "local";

  if (isProdLike && storageProvider === "local") {
    throw new ConfigError(
      `[${deploymentMode}] S3-compatible object storage is required. Set STORAGE_PROVIDER=s3 and credentials.`
    );
  }

  if (isProdLike && storageProvider === "s3") {
    if (!env("S3_BUCKET") || !env("S3_ACCESS_KEY_ID") || !env("S3_SECRET_ACCESS_KEY")) {
      throw new ConfigError(
        `[${deploymentMode}] S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY are required.`
      );
    }
  }

  if (authProvider === "oidc") {
    if (!env("OIDC_ISSUER") || !env("OIDC_CLIENT_ID")) {
      throw new ConfigError("OIDC_ISSUER and OIDC_CLIENT_ID are required when AUTH_PROVIDER=oidc.");
    }
  }

  const config: AppConfig = {
    deploymentMode,
    nodeEnv,
    appUrl: env("APP_URL", "http://localhost:3000")!,
    auth: {
      provider: authProvider,
      jwtSecret: jwtSecret || "local-dev-only-secret-change-me-32chars",
      sessionTtlSeconds: envInt("AUTH_SESSION_TTL", 3600),
      refreshTtlSeconds: envInt("AUTH_REFRESH_TTL", 60 * 60 * 24 * 7),
      cookieSecure: isProdLike || envBool("AUTH_COOKIE_SECURE", false),
      mockAuthEnabled: deploymentMode === "local" && envBool("MOCK_AUTH_ENABLED", true),
      oidcIssuer: env("OIDC_ISSUER"),
      oidcClientId: env("OIDC_CLIENT_ID"),
      oidcClientSecret: env("OIDC_CLIENT_SECRET"),
      loginMaxAttempts: envInt("AUTH_LOGIN_MAX_ATTEMPTS", 5),
      loginLockoutSeconds: envInt("AUTH_LOGIN_LOCKOUT_SECONDS", 300),
    },
    database: {
      url: databaseUrl,
      ssl: envBool("DATABASE_SSL", deploymentMode === "municipality"),
      poolMax: envInt("DATABASE_POOL_MAX", 20),
      allowSqlite,
    },
    storage: {
      provider: storageProvider,
      endpoint: env("S3_ENDPOINT"),
      region: env("S3_REGION", "me-central-1")!,
      bucket: env("S3_BUCKET", "kodikz-survey")!,
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
      forcePathStyle: envBool("S3_FORCE_PATH_STYLE", true),
      maxUploadBytes: envInt("UPLOAD_MAX_BYTES", 8 * 1024 * 1024),
    },
    redis: {
      enabled: envBool("REDIS_ENABLED", false),
      url: env("REDIS_URL") ?? null,
    },
    gps: {
      apiUrl: (env("NEXT_PUBLIC_API_URL") ?? env("GPS_API_URL") ?? "https://api-kodikz.giantphoenixllc.com")!.replace(
        /\/$/,
        ""
      ),
      socketUrl: (env("NEXT_PUBLIC_SOCKET_URL") ?? env("GPS_SOCKET_URL") ?? env("NEXT_PUBLIC_API_URL") ?? "https://api-kodikz.giantphoenixllc.com")!.replace(
        /\/$/,
        ""
      ),
    },
    geocoding: {
      provider: (env("GEOCODING_PROVIDER", "nominatim") as AppConfig["geocoding"]["provider"]) ?? "nominatim",
      minIntervalMs: envInt("GEOCODING_MIN_INTERVAL_MS", 1100),
      cacheRadiusM: envInt("GEOCODING_CACHE_RADIUS_M", 40),
    },
    rateLimit: {
      loginPerMinute: envInt("RATE_LIMIT_LOGIN", 10),
      uploadPerMinute: envInt("RATE_LIMIT_UPLOAD", 30),
      commandPerMinute: envInt("RATE_LIMIT_COMMAND", 60),
      mutationPerMinute: envInt("RATE_LIMIT_MUTATION", 120),
    },
    worker: {
      enabled: envBool("WORKER_ENABLED", isProdLike),
      pollIntervalMs: envInt("WORKER_POLL_MS", 2000),
    },
    observability: {
      logLevel: env("LOG_LEVEL", isProdLike ? "info" : "debug")!,
    },
  };

  if (config.redis.enabled && !config.redis.url && isProdLike) {
    throw new ConfigError(`[${deploymentMode}] REDIS_URL required when REDIS_ENABLED=true.`);
  }

  cached = config;
  return config;
}

export function getAppConfig(): AppConfig {
  return loadAppConfig();
}

export function assertProductionDatabaseReady(): void {
  const cfg = getAppConfig();
  if (
    (cfg.deploymentMode === "pilot" || cfg.deploymentMode === "municipality") &&
    !cfg.database.url
  ) {
    throw new ConfigError("PostgreSQL DATABASE_URL missing — refusing to start.");
  }
}
