/**
 * Express HTTP API — consumed by the Next.js frontend on Vercel.
 * Bind to API_HOST:API_PORT (default 127.0.0.1:3000); put Nginx in front for HTTPS.
 */

const express = require("express");
const cors = require("cors");
const config = require("./config");
const store = require("./store");
const runtime = require("./runtime");
const {
  COMPATIBILITY,
  getCompatibilityWarnings,
} = require("./lib/protocol-compat");
const { securityHeaders, rateLimit, apiKeyAuth } = require("./lib/http-middleware");

const IMEI_PATTERN = /^\d{8,20}$/;

function parseCorsOrigins() {
  const raw = config.corsOrigin.trim();
  if (raw === "*" || raw === "") return true;
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

function buildHealthPayload() {
  const checks = runtime.getHealthChecks();
  const ready = runtime.isReady();
  const warnings = getCompatibilityWarnings(config.simulationMode);

  return {
    status: ready ? "ok" : "starting",
    service: config.serviceName,
    version: config.appVersion,
    environment: config.nodeEnv,
    dataMode: config.simulationMode ? "simulation" : "live",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    checks,
    devices: store.count(),
    connectedDevices: store.count(),
    reportingDevices: store.countReporting(15_000),
    lastPacketReceivedAt: store.getLastPacketReceivedAt(),
    ports: {
      tcp: config.tcpPort,
      api: config.apiPort,
    },
    protocol: {
      supported: COMPATIBILITY.supported,
      notSupported: COMPATIBILITY.notSupported,
      fmm130Parameter113Required: COMPATIBILITY.fmm130Parameter113,
      verifyAvlCodecId: "0x08",
    },
    warnings,
  };
}

/**
 * @param {string | undefined} imei
 * @param {import('express').Response} res
 */
function respondVehicle(imei, res) {
  const vehicle = store.getLatest(imei);
  if (!vehicle) {
    return res.status(404).json({ error: "No GPS data received yet", imei: imei ?? null });
  }
  return res.json(vehicle);
}

function createApiApp() {
  const app = express();

  if (config.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(securityHeaders);
  app.use(rateLimit);

  app.use(
    cors({
      origin: parseCorsOrigins(),
      methods: ["GET", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Api-Key"],
    })
  );
  app.use(express.json());

  app.use(apiKeyAuth);

  app.get("/health", (_req, res) => {
    const body = buildHealthPayload();
    const code = runtime.isReady() ? 200 : 503;
    res.status(code).json(body);
  });

  /** Fleet — latest position per IMEI. */
  app.get("/vehicles", (_req, res) => {
    res.json({ vehicles: store.getAll(), count: store.count() });
  });

  /** Single device by IMEI (path). */
  app.get("/vehicle/:imei", (req, res) => {
    const imei = req.params.imei;
    if (!IMEI_PATTERN.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI", imei });
    }
    return respondVehicle(imei, res);
  });

  /**
   * Latest location — backward compatible query form.
   * GET /vehicle?imei=… (optional — most recent device if omitted)
   */
  app.get("/vehicle", (req, res) => {
    const imei = typeof req.query.imei === "string" ? req.query.imei : undefined;
    if (imei && !IMEI_PATTERN.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI", imei });
    }
    return respondVehicle(imei, res);
  });

  return app;
}

function startApiServer() {
  const app = createApiApp();
  const server = app.listen(config.apiPort, config.apiHost, () => {
    runtime.setHttpListening(true);
    console.log(`[API] HTTP listening on http://${config.apiHost}:${config.apiPort}`);
    console.log(
      "[API] Routes: GET /health  GET /vehicles  GET /vehicle/:imei  GET /vehicle?imei="
    );
    if (config.apiKey) {
      console.log("[API] API_KEY enabled for /vehicle and /vehicles");
    }
    console.log(
      `[API] Rate limit: ${config.rateLimitMax} requests / ${config.rateLimitWindowMs}ms per IP`
    );
  });
  return server;
}

module.exports = { createApiApp, startApiServer, buildHealthPayload };
