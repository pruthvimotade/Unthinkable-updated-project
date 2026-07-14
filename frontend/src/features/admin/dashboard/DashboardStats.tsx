import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Package, Truck, AlertTriangle, Users, Banknote, ClipboardList, Clock, UserCheck, Activity, Zap, Target } from "lucide-react";
import type { AggregatedAdminData } from "../api/adminApi";
import { formatINR } from "../../../utils/currency";
import { useNavigate } from "react-router-dom";

interface DashboardStatsProps {
  stats: AggregatedAdminData["stats"];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const navigate = useNavigate();

  const agentUtilization = stats.activeAgents > 0 
    ? Math.round(((stats.activeAgents - stats.availableAgents) / stats.activeAgents) * 100) 
    : 0;

  const deliveryRate = stats.totalOrders > 0 
    ? Math.round((stats.delivered / stats.totalOrders) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card className="glass-card cursor-pointer" onClick={() => navigate("/admin/orders")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Bookings</CardTitle>
          <ClipboardList className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-white tracking-tight">{stats.totalOrders}</div>
        </CardContent>
      </Card>

      <Card className="glass-card cursor-pointer" onClick={() => navigate("/admin/orders?status=PENDING")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">{stats.pendingOrders}</div>
        </CardContent>
      </Card>

      <Card className="glass-card cursor-pointer" onClick={() => navigate("/admin/orders?status=ASSIGNED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Assigned</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-blue-400 tracking-tight">{stats.assignedOrders}</div>
        </CardContent>
      </Card>

      <Card className="glass-card cursor-pointer" onClick={() => navigate("/admin/orders?status=OUT_FOR_DELIVERY")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">In Transit</CardTitle>
          <Truck className="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">{stats.outForDelivery}</div>
        </CardContent>
      </Card>

      <Card className="glass-card cursor-pointer" onClick={() => navigate("/admin/orders?status=DELIVERED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Delivered</CardTitle>
          <Package className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{stats.delivered}</div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Agents</CardTitle>
          <Users className="h-4 w-4 text-teal-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-teal-400 tracking-tight">{stats.activeAgents}</div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Idle Agents</CardTitle>
          <Users className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-orange-400 tracking-tight">{stats.availableAgents}</div>
        </CardContent>
      </Card>

      <Card className="glass-card cursor-pointer border-red-500/10 hover:border-red-500/20" onClick={() => navigate("/admin/orders?status=FAILED")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-400/80">Failed Attempt</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-red-400 tracking-tight">{stats.failedDeliveries}</div>
        </CardContent>
      </Card>

      <Card className="glass-card col-span-1 md:col-span-2 border-indigo-500/25 glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400">Total Revenue</CardTitle>
          <Banknote className="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-white tracking-tight">{formatINR(stats.revenue)}</div>
        </CardContent>
      </Card>

      {/* Additional Operational Metrics */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Agent Utilization</CardTitle>
          < Zap className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-purple-400 tracking-tight">{agentUtilization}%</div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Delivery Rate</CardTitle>
          <Target className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{deliveryRate}%</div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fleet Availability</CardTitle>
          <Activity className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-black font-mono text-blue-400 tracking-tight">{stats.availableAgents}/{stats.activeAgents}</div>
        </CardContent>
      </Card>
    </div>
  );
}
