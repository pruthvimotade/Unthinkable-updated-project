import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Package, Truck, CheckCircle2, ListTodo, MapPin, Clock, DollarSign } from "lucide-react";
import type { OrderWithTracking } from "../../tracking/api/trackingApi";

interface AgentStatsCardsProps {
  orders: OrderWithTracking[];
  onTabChange?: (tab: "assigned" | "active" | "completed") => void;
}

export function AgentStatsCards({ orders, onTabChange }: AgentStatsCardsProps) {
  // Aggregate stats from the detailed orders
  const activeAssignments = orders.length;
  const pendingPickup = orders.filter(o => o.status === "ASSIGNED" || o.status === "PENDING").length;
  const inTransit = orders.filter(o => o.status === "PICKED_UP" || o.status === "IN_TRANSIT" || o.status === "OUT_FOR_DELIVERY").length;
  
  // Checking if completed today
  const today = new Date().toDateString();
  const completedToday = orders.filter(o => {
    if (o.status !== "DELIVERED") return false;
    const updatedAt = new Date(o.updatedAt).toDateString();
    return updatedAt === today;
  }).length;

  // Calculate additional operational metrics
  const remainingStops = orders.filter(o => !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length;
  const totalDistance = orders.reduce((sum, o) => sum + (typeof o.distanceKm === 'number' ? o.distanceKm : 0), 0);
  const totalEarnings = orders.reduce((sum, o) => sum + (typeof o.calculatedPrice === 'number' ? o.calculatedPrice : 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="glass-card cursor-pointer"
        onClick={() => onTabChange?.("assigned")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Assignments</CardTitle>
          <ListTodo className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-white tracking-tight">{activeAssignments}</div>
        </CardContent>
      </Card>
      
      <Card 
        className="glass-card cursor-pointer"
        onClick={() => onTabChange?.("active")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pending Pickup</CardTitle>
          <Package className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">{pendingPickup}</div>
        </CardContent>
      </Card>

      <Card 
        className="glass-card cursor-pointer"
        onClick={() => onTabChange?.("active")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">In Transit</CardTitle>
          <Truck className="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">{inTransit}</div>
        </CardContent>
      </Card>

      <Card 
        className="glass-card cursor-pointer"
        onClick={() => onTabChange?.("completed")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Completed Today</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{completedToday}</div>
        </CardContent>
      </Card>

      {/* Additional operational metrics */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Remaining Stops</CardTitle>
          <MapPin className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-purple-400 tracking-tight">{remainingStops}</div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Distance</CardTitle>
          <Clock className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-blue-400 tracking-tight">{totalDistance.toFixed(1)} km</div>
        </CardContent>
      </Card>

      <Card className="glass-card col-span-1 md:col-span-2 border-emerald-500/25 glow-emerald">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400">Daily Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-white tracking-tight">₹{totalEarnings.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
