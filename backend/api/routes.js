const express = require("express");
const cors = require("cors");
const config = require("../config");
const locationStore = require("../services/locationStore");
const runtime = require("../services/runtime");
const { isMongoConnected } = require("../config/db");
const { securityHeaders, rateLimit, apiKeyAuth } = require("./middleware");

const IMEI_PATTERN = /^\d{8,20}$/;

function parseCorsOrigins() {
  const raw = config.corsOrigin.trim();
  if (raw === "*" || raw === "") return true;
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

function buildHealthPayload() {
  return {
    status: runtime.isReady() ? "ok" : "starting",
    service: config.serviceName,
    version: config.appVersion,
    domain: config.domain,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    checks: runtime.getHealthChecks(config.mongoEnabled),
    storage: isMongoConnected() ? "mongodb" : "memory",
    devices: locationStore.count(),
    reportingDevices: locationStore.countReporting(15_000),
    lastPacketReceivedAt: locationStore.getLastPacketReceivedAt(),
    publicUrl: config.publicApiUrl,
    ports: { tcp: config.tcpPort, api: config.apiPort },
    realtime: { socketIo: true, event: "location_update" },
  };
}

function createRouter() {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.status(runtime.isReady() ? 200 : 503).json(buildHealthPayload());
  });

  /** Latest per device — all vehicles when no ?imei= */
  router.get("/vehicle", (req, res) => {
    const imei = typeof req.query.imei === "string" ? req.query.imei.trim() : undefined;

    if (imei) {
      if (!IMEI_PATTERN.test(imei)) {
        return res.status(400).json({ error: "Invalid IMEI", imei });
      }
      const vehicle = locationStore.getLatest(imei);
      if (!vehicle) {
        return res.status(404).json({ error: "No GPS data yet", imei });
      }
      return res.json(vehicle);
    }

    const vehicles = locationStore.getAll();
    if (!vehicles.length) {
      return res.status(404).json({ error: "No GPS data received yet", vehicles: [] });
    }
    return res.json({ vehicles, count: vehicles.length });
  });

  router.get("/vehicle/:imei", (req, res) => {
    const imei = req.params.imei;
    if (!IMEI_PATTERN.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI", imei });
    }
    const vehicle = locationStore.getLatest(imei);
    if (!vehicle) {
      return res.status(404).json({ error: "No GPS data yet", imei });
    }
    return res.json(vehicle);
  });

  router.get("/vehicles", (_req, res) => {
    res.json({ vehicles: locationStore.getAll(), count: locationStore.count() });
  });

  /** Last 50 points by default */
  router.get("/history/:imei", async (req, res) => {
    const imei = req.params.imei;
    if (!IMEI_PATTERN.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI", imei });
    }

    try {
      const limit = Number(req.query.limit) || config.historyDefaultLimit;
      const points = await locationStore.getHistory(imei, { limit });
      return res.json({
        imei,
        count: points.length,
        points,
        storage: isMongoConnected() ? "mongodb" : "memory",
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to load history", imei });
    }
  });

  return router;
}

function createApiApp() {
  const app = express();

  if (config.trustProxy) app.set("trust proxy", 1);

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
  app.use(createRouter());

  return app;
}

module.exports = { createApiApp, buildHealthPayload };
