import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to the backend
    const socketInstance = io(import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:8000", {
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Join user specific room
      socketInstance.emit("joinRoom", `user_${user.id}`);
      
      // If admin, join admin room
      if (user.role === "ADMIN") {
        socketInstance.emit("joinRoom", "admin");
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
