import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6 lg:h-[60px]">
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-2 text-sm ml-2 border-l pl-4 dark:border-slate-800">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.name || "User"}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors ml-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
