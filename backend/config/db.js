const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: process.env.DOTENV_PATH || path.join(__dirname, "..", ".env"),
});

const MONGO_URI = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

let connected = false;

async function connectMongo() {
  if (!MONGO_URI) {
    return false;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
  });

  connected = true;
  return true;
}

async function disconnectMongo() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

function isMongoConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = {
  MONGO_URI,
  connectMongo,
  disconnectMongo,
  isMongoConnected,
};
