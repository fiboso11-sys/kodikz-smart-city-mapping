const COMPATIBILITY = {
  supported: ["Codec 8 (codec ID 0x08)"],
  notSupported: ["Codec 8 Extended / 8E (codec ID 0x8E)", "Codec JSON"],
  fmm130Parameter113: 0,
  tcpPort: 5000,
};

function getCompatibilityWarnings(simulationMode) {
  if (simulationMode) return [];
  return [
    "Teltonika Codec 8 Extended (0x8E) and Codec JSON are NOT supported.",
    "FMM130: Parameter 113 = 0, Codec 8, TCP port 5000.",
    "Verify first AVL packet codec ID is 0x08 (not 0x8E).",
  ];
}

function logStartupCompatibilityWarnings(simulationMode) {
  if (simulationMode) {
    console.log("[protocol] SIMULATION_MODE — TCP skipped");
    return;
  }
  console.warn("[protocol] FMM130 must use Codec 8 (Parameter 113 = 0), TCP :5000");
}

module.exports = { COMPATIBILITY, getCompatibilityWarnings, logStartupCompatibilityWarnings };
