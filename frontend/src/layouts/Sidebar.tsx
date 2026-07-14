import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Map, Users, Settings, Truck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: "Operations Hub", href: "/dashboard", icon: LayoutDashboard },
    { name: "Shipments", href: "/orders", icon: Package },
    { name: "Live Tracking", href: "/tracking", icon: Map },
  ];

  if (user?.role === "ADMIN") {
    const baseItems = [
      { name: "Operations Hub", href: "/admin", icon: LayoutDashboard },
      { name: "Shipments", href: "/admin/orders", icon: Package },
    ];
    navItems.length = 0;
    navItems.push(
      ...baseItems,
      { name: "Service Zones", href: "/admin/zones", icon: Map },
      { name: "Coverage Areas", href: "/admin/areas", icon: Map },
      { name: "Rate Engine", href: "/admin/rate-cards", icon: Settings },
      { name: "Workforce", href: "/users", icon: Users },
      { name: "Platform Config", href: "/settings", icon: Settings }
    );
  } else if (user?.role === "AGENT") {
    navItems.length = 0;
    navItems.push({ name: "Agent Console", href: "/agent", icon: LayoutDashboard });
  }

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950/70 border-r border-white/5 backdrop-blur-xl">
      <div className="flex h-20 items-center px-6 border-b border-white/5 gap-3">
        <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/10">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Last Mile
          </span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">
            Enterprise
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative group ${
                isActive
                  ? "bg-white/[0.04] text-white border-l-2 border-indigo-500 shadow-lg shadow-indigo-500/5"
                  : "text-zinc-400 hover:bg-white/[0.02] hover:text-white"
              }`}
            >
              <item.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-black text-white shadow-md shadow-indigo-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-200 truncate">{user.name}</span>
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider leading-none">{user.role}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

