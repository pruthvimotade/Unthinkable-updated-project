import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useLocation } from "react-router-dom";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Dynamic header title helper
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/admin/orders")) return "Orders Queue";
    if (path.startsWith("/admin/zones")) return "Zones Coverage";
    if (path.startsWith("/admin/areas")) return "Territory Areas";
    if (path.startsWith("/admin/rate-cards")) return "Rate Cards Manager";
    if (path.startsWith("/admin")) return "Control Center";
    if (path.startsWith("/agent")) return "Agent Workspace";
    if (path.startsWith("/orders/create")) return "New Logistics Order";
    if (path.startsWith("/orders")) return "My Deliveries";
    if (path.startsWith("/tracking")) return "Real-Time Tracking";
    if (path.startsWith("/settings")) return "System Settings";
    if (path.startsWith("/users")) return "Staff Management";
    return "Operations Hub";
  };

  return (
    <header className="flex h-20 items-center gap-4 border-b border-white/5 bg-zinc-950/40 px-8 backdrop-blur-xl">
      <div className="flex-1">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          {getHeaderTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <NotificationBell />
        <div className="flex items-center gap-3 text-sm border-l border-white/10 pl-6">
          <UserIcon className="h-4 w-4 text-zinc-500" />
          <span className="font-semibold text-zinc-200">{user?.name || "User"}</span>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

