/**
 * Teltonika Codec 8 AVL IO element IDs (FMM130 / common).
 * @see https://wiki.teltonika-gps.com/view/AVL_ID
 */

const IO = {
  IGNITION: 239,
  BATTERY_VOLTAGE_MV: 67,
  EXTERNAL_VOLTAGE_MV: 66,
  GSM_SIGNAL: 21,
};

const EXTERNAL_POWER_MV_THRESHOLD = 9000;

/**
 * @param {Array<{ id: number, value: number }>} ioElements
 * @returns {Record<number, number>}
 */
function ioMap(ioElements) {
  const map = new Map();
  for (const el of ioElements ?? []) {
    if (el && typeof el.id === "number") map.set(el.id, el.value);
  }
  return map;
}

/**
 * @param {object} rec — teltonika-parser AVL record
 * @returns {{
 *   ignition: boolean | null,
 *   batteryVoltage: number | null,
 *   externalPower: boolean | null,
 *   gsmSignal: number | null,
 *   satellites: number | null,
 * }}
 */
function extractTelemetryFromRecord(rec) {
  const io = ioMap(rec.ioElements);

  let ignition = null;
  if (io.has(IO.IGNITION)) {
    ignition = io.get(IO.IGNITION) === 1;
  }

  let batteryVoltage = null;
  if (io.has(IO.BATTERY_VOLTAGE_MV)) {
    batteryVoltage = Math.round((io.get(IO.BATTERY_VOLTAGE_MV) / 1000) * 100) / 100;
  }

  let externalPower = null;
  if (io.has(IO.EXTERNAL_VOLTAGE_MV)) {
    externalPower = io.get(IO.EXTERNAL_VOLTAGE_MV) >= EXTERNAL_POWER_MV_THRESHOLD;
  }

  let gsmSignal = null;
  if (io.has(IO.GSM_SIGNAL)) {
    gsmSignal = io.get(IO.GSM_SIGNAL);
  }

  let satellites = null;
  if (rec.gps && rec.gps.satellites !== undefined && rec.gps.satellites !== null) {
    satellites = Number(rec.gps.satellites);
  }

  return { ignition, batteryVoltage, externalPower, gsmSignal, satellites };
}

module.exports = { extractTelemetryFromRecord, IO };
