import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export function DashboardLayout() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { success, info } = useToast();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (notif: any) => {
      info(notif.title);
      // Invalidate queries so that dashboards refresh
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["agentNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
      // Depending on user role, invalidate appropriate queries
    };

    const handleOrderUpdate = (data: { orderId: string, status: string }) => {
      success(`Order ${data.orderId} is now ${data.status.replace(/_/g, " ")}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["agentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dispatcher"] });
      queryClient.invalidateQueries({ queryKey: ["adminData"] });
    };

    socket.on("notification", handleNotification);
    socket.on("orderUpdate", handleOrderUpdate);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("orderUpdate", handleOrderUpdate);
    };
  }, [socket, queryClient, user, success, info]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
