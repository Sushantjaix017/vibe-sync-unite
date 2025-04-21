
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("https://your-socket-server-url", {
      autoConnect: true
    });
  }
  return socket;
}
