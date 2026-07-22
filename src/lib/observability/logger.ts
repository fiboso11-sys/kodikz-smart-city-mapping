/**
 * Structured logger — never logs secrets.
 */

import { getAppConfig } from "@/lib/config/app-config";

type Level = "debug" | "info" | "warn" | "error";

const SECRET_KEYS = /(password|secret|token|authorization|cookie|signedUrl)/i;

function scrub(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SECRET_KEYS.test(k)) out[k] = "[REDACTED]";
    else out[k] = v;
  }
  return out;
}

export function log(level: Level, message: string, fields: Record<string, unknown> = {}): void {
  let cfgLevel = "info";
  try {
    cfgLevel = getAppConfig().observability.logLevel;
  } catch {
    /* config may not be ready */
  }
  const order: Level[] = ["debug", "info", "warn", "error"];
  if (order.indexOf(level) < order.indexOf((cfgLevel as Level) || "info")) return;

  const line = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...scrub(fields),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.log(text);
}
