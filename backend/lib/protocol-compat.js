/**
 * Teltonika protocol compatibility — shared by startup logs and GET /health.
 * Codec 8 Extended (8E) is not implemented on this server.
 */

const COMPATIBILITY = {
  supported: ["Codec 8 (codec ID 0x08)"],
  notSupported: ["Codec 8 Extended / 8E (codec ID 0x8E)", "Codec JSON"],
  fmm130Parameter113: 0,
  tcpPort: 5000,
  docPath: "docs/FMM130-CONFIGURATION.md",
};

/**
 * @param {boolean} simulationMode
 * @returns {string[]}
 */
function getCompatibilityWarnings(simulationMode) {
  if (simulationMode) return [];

  return [
    "Teltonika Codec 8 Extended (0x8E) and Codec JSON are NOT supported.",
    "FMM130 factory default is Codec 8 Extended — set Parameter 113 = 0 (Codec 8) in Configurator before connecting.",
    "After save: Server IP = VPS public IP, TCP port = 5000, protocol = TCP.",
    "Verify first AVL packet codec ID is 0x08 (not 0x8E).",
  ];
}

function logStartupCompatibilityWarnings(simulationMode) {
  if (simulationMode) {
    console.log("[protocol] SIMULATION_MODE — TCP device requirements skipped");
    return;
  }

  console.warn("[protocol] ═══ Kodikz GPS — FMM130 compatibility requirement ═══");
  console.warn("[protocol] BEFORE connecting devices:");
  console.warn("[protocol]   1. Teltonika Configurator → System → Data Protocol");
  console.warn("[protocol]   2. Parameter 113 = 0  →  select Codec 8");
  console.warn("[protocol]   DO NOT use Codec 8 Extended (8E) or Codec JSON");
  console.warn(`[protocol] Supported: ${COMPATIBILITY.supported.join(", ")}`);
  console.warn(`[protocol] Not supported: ${COMPATIBILITY.notSupported.join(", ")}`);
  console.warn("[protocol] After save: VPS IP, TCP port 5000, verify AVL codec ID 0x08");
  console.warn(`[protocol] Full guide: ${COMPATIBILITY.docPath}`);
  console.warn("[protocol] ═══════════════════════════════════════════════════");
}

module.exports = {
  COMPATIBILITY,
  getCompatibilityWarnings,
  logStartupCompatibilityWarnings,
};
