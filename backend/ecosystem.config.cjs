/**
 * PM2 process definition — Kodikz GPS backend (Ubuntu VPS)
 *
 * Prerequisites on server:
 *   cd /opt/kodikz-gps/backend
 *   cp .env.example .env && nano .env
 *   npm ci --omit=dev
 *   mkdir -p logs
 *
 * Start:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup
 */
const path = require("path");

const appDir = __dirname;

module.exports = {
  apps: [
    {
      name: "kodikz-gps",
      script: "server.js",
      cwd: appDir,

      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,

      max_restarts: 15,
      min_uptime: "10s",
      restart_delay: 3000,
      kill_timeout: 10000,
      listen_timeout: 8000,
      max_memory_restart: "512M",

      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },

      error_file: path.join(appDir, "logs", "pm2-error.log"),
      out_file: path.join(appDir, "logs", "pm2-out.log"),
      merge_logs: true,
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
