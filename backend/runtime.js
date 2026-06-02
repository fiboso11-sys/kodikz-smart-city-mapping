/**
 * Runtime flags for health checks and observability.
 */

let tcpListening = false;
let httpListening = false;

function setTcpListening(value) {
  tcpListening = Boolean(value);
}

function setHttpListening(value) {
  httpListening = Boolean(value);
}

function getHealthChecks() {
  return {
    tcp: tcpListening ? "up" : "down",
    http: httpListening ? "up" : "down",
  };
}

function isReady() {
  return tcpListening && httpListening;
}

module.exports = { setTcpListening, setHttpListening, getHealthChecks, isReady };
