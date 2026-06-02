/**
 * Sends sample IMEI + Codec8 AVL packet to local TCP server (for testing without hardware).
 * Usage: node scripts/simulate-device.js [host] [port]
 */

const net = require("net");

const host = process.argv[2] ?? "127.0.0.1";
const port = Number(process.argv[3] ?? 5000);

const imeiPacket = Buffer.from("000F333532303933303836343033363535", "hex");
const avlPacket = Buffer.from(
  "000000000000003608010000016B40A5888000010AEF0B00000000000000000000000000000105021503010101425E1FB0000001000104024208000000000000016B40A5889000010AEF0B00000000000000000000000000000105021503010101425E208000000100010402420800000000000001",
  "hex"
);

const client = net.connect({ host, port }, () => {
  console.log(`Connected to ${host}:${port}`);
  client.write(imeiPacket);
});

client.on("data", (data) => {
  console.log("RX", data.toString("hex"));
  if (data.length === 1 && data[0] === 1) {
    client.write(avlPacket);
    setTimeout(() => client.end(), 500);
  }
});

client.on("error", (e) => console.error(e.message));
client.on("close", () => console.log("Done"));
