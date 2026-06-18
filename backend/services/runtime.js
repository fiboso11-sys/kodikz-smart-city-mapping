let tcpListening = false;
let httpListening = false;
let mongoConnected = false;

module.exports = {
  setTcpListening(v) {
    tcpListening = Boolean(v);
  },
  setHttpListening(v) {
    httpListening = Boolean(v);
  },
  setMongoConnected(v) {
    mongoConnected = Boolean(v);
  },
  getHealthChecks(mongoEnabled = false) {
    return {
      tcp: tcpListening ? "up" : "down",
      http: httpListening ? "up" : "down",
      mongodb: !mongoEnabled ? "disabled" : mongoConnected ? "up" : "down",
    };
  },
  isReady() {
    return tcpListening && httpListening;
  },
};
