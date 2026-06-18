/**
 * Structured console logging for production operations.
 */

function ts() {
  return new Date().toISOString();
}

function info(scope, message, meta) {
  const extra = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[${ts()}] [${scope}] ${message}${extra}`);
}

function warn(scope, message, meta) {
  const extra = meta ? ` ${JSON.stringify(meta)}` : "";
  console.warn(`[${ts()}] [${scope}] ${message}${extra}`);
}

function error(scope, message, meta) {
  const extra = meta ? ` ${JSON.stringify(meta)}` : "";
  console.error(`[${ts()}] [${scope}] ${message}${extra}`);
}

module.exports = { info, warn, error };
