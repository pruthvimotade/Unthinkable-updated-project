import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Map, Users, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "Tracking", href: "/tracking", icon: Map },
  ];

  if (user?.role === "ADMIN") {
    // Override default dashboard/orders with Admin views if needed
    // Actually we keep dashboard -> /admin, orders -> /admin/orders
    const baseItems = [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Orders", href: "/admin/orders", icon: Package },
    ];
    navItems.length = 0;
    navItems.push(
      ...baseItems,
      { name: "Zones", href: "/admin/zones", icon: Map },
      { name: "Areas", href: "/admin/areas", icon: Map },
      { name: "Rate Cards", href: "/admin/rate-cards", icon: Settings },
      { name: "Users", href: "/users", icon: Users },
      { name: "Settings", href: "/settings", icon: Settings }
    );
  } else if (user?.role === "AGENT") {
    navItems.length = 0;
    navItems.push({ name: "Dashboard", href: "/agent", icon: LayoutDashboard });
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-14 items-center px-4 border-b">
        <span className="text-lg font-semibold text-primary">Logistics Pro</span>
      </div>
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
