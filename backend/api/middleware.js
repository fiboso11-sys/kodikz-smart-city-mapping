const config = require("../config");

const rateBuckets = new Map();

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.removeHeader("X-Powered-By");
  next();
}

function rateLimit(req, res, next) {
  if (req.path === "/health") return next();

  const ip = clientIp(req);
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.rateLimitWindowMs };
    rateBuckets.set(ip, bucket);
  }

  bucket.count += 1;
  if (bucket.count > config.rateLimitMax) {
    return res.status(429).json({ error: "Too many requests" });
  }
  return next();
}

function apiKeyAuth(req, res, next) {
  if (!config.apiKey || req.path === "/health") return next();

  const headerKey = req.headers["x-api-key"];
  const queryKey = typeof req.query.api_key === "string" ? req.query.api_key : null;
  if ((headerKey || queryKey) === config.apiKey) return next();

  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = { securityHeaders, rateLimit, apiKeyAuth };
