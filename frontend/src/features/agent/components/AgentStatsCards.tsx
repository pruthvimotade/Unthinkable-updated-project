import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Package, Truck, CheckCircle2, ListTodo } from "lucide-react";
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onTabChange?.("assigned")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAssignments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total active assignments in your queue
          </p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onTabChange?.("active")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Pickup</CardTitle>
          <Package className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPickup}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Orders waiting to be picked up
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onTabChange?.("active")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          <Truck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inTransit}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Orders currently on the road
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onTabChange?.("completed")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedToday}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Successfully delivered today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
