import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../../config/logger.config";

class SocketService {
  private io: SocketIOServer | null = null;

  init(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // allow all or configure via env
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      logger.info({ socketId: socket.id }, "Client connected to socket");

      socket.on("joinRoom", (roomId: string) => {
        socket.join(roomId);
        logger.info({ socketId: socket.id, roomId }, "Client joined room");
      });

      socket.on("leaveRoom", (roomId: string) => {
        socket.leave(roomId);
        logger.info({ socketId: socket.id, roomId }, "Client left room");
      });

      socket.on("disconnect", () => {
        logger.info({ socketId: socket.id }, "Client disconnected from socket");
      });
    });

    logger.info("Socket.IO initialized");
  }

  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error("Socket.IO has not been initialized!");
    }
    return this.io;
  }

  emitToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }
}

export const socketService = new SocketService();
