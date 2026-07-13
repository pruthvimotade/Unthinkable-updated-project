import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Package, Truck, AlertTriangle, Users, Banknote, ClipboardList, Clock, UserCheck } from "lucide-react";
import type { AggregatedAdminData } from "../api/adminApi";
import { formatINR } from "../../../utils/currency";
import { useNavigate } from "react-router-dom";

interface DashboardStatsProps {
  stats: AggregatedAdminData["stats"];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders?status=PENDING")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingOrders}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders?status=ASSIGNED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Orders</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.assignedOrders}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders?status=OUT_FOR_DELIVERY")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out For Delivery</CardTitle>
          <Truck className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.outForDelivery}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders?status=DELIVERED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          <Package className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.delivered}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          <Users className="h-4 w-4 text-teal-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAgents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
          <Users className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.availableAgents}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/orders?status=FAILED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.failedDeliveries}</div>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Banknote className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatINR(stats.revenue)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
