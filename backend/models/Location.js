const mongoose = require("mongoose");

const locationFields = {
  imei: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  timestamp: { type: String, required: true, index: true },
  ignition: { type: mongoose.Schema.Types.Mixed, default: null },
  batteryVoltage: { type: mongoose.Schema.Types.Mixed, default: null },
  externalPower: { type: mongoose.Schema.Types.Mixed, default: null },
  gsmSignal: { type: mongoose.Schema.Types.Mixed, default: null },
  satellites: { type: mongoose.Schema.Types.Mixed, default: null },
  receivedAt: { type: String, default: () => new Date().toISOString() },
};

const LocationLatestSchema = new mongoose.Schema(locationFields, {
  collection: "location_latest",
});

LocationLatestSchema.index({ imei: 1 }, { unique: true });

const LocationHistorySchema = new mongoose.Schema(locationFields, {
  collection: "location_history",
});

LocationHistorySchema.index({ imei: 1, timestamp: -1 });

const LocationLatest =
  mongoose.models.LocationLatest ||
  mongoose.model("LocationLatest", LocationLatestSchema);

const LocationHistory =
  mongoose.models.LocationHistory ||
  mongoose.model("LocationHistory", LocationHistorySchema);

module.exports = { LocationLatest, LocationHistory };
