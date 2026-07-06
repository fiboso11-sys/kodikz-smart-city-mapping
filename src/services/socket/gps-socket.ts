import { io, type Socket } from "socket.io-client";
import { getSocketUrl } from "@/services/gps-service";

let socketInstance: Socket | null = null;

/** One shared Socket.IO client for the platform shell lifetime. */
export function getGpsSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      autoConnect: true,
    });
  }
  return socketInstance;
}

export function teardownGpsSocket(): void {
  socketInstance?.disconnect();
  socketInstance = null;
}
