const http = require("http");
const { createApiApp } = require("./api/routes");
const { attachSocket } = require("./socket/socket");
const locationStore = require("./services/locationStore");

function createHttpServer() {
  const app = createApiApp();
  const server = http.createServer(app);
  const io = attachSocket(server);
  locationStore.setSocketServer(io);
  return server;
}

module.exports = { createHttpServer };
