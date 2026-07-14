import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../orders/api/orderApi";
import { useAuth } from "../../../contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Badge } from "../../../components/ui/badge";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  DollarSign,
  TrendingUp
} from "lucide-react";

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "dashboard", user?.id],
    queryFn: () => orderApi.getOrders({ limit: 50 }),
  });

  const orders = data?.data?.orders || [];
  
  const stats = {
    total: data?.data?.total || 0,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    inTransit: orders.filter(o => ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)).length,
    failed: orders.filter(o => o.status === "FAILED").length,
  };

  const recentOrders = orders.slice(0, 5);
  
  const activeShipment = orders.find(o => ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status));
  const upcomingDelivery = orders.find(o => o.status === "ASSIGNED");
  const totalSpent = orders.reduce((sum, o) => sum + (typeof o.calculatedPrice === 'number' ? o.calculatedPrice : 0), 0);
  const monthlyOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Logistics operational overview and live shipping queues.
          </p>
        </div>
        <Button onClick={() => navigate("/orders/create")} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 px-4 shadow-lg shadow-indigo-500/10 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="glass-card cursor-pointer"
          onClick={() => navigate("/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Bookings</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-black font-mono text-white tracking-tight">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        
        <Card 
          className="glass-card cursor-pointer"
          onClick={() => navigate("/orders?status=DELIVERED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{stats.delivered}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="glass-card cursor-pointer"
          onClick={() => navigate("/orders?status=IN_TRANSIT")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Cargo</CardTitle>
            <Truck className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">{stats.inTransit}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="glass-card cursor-pointer border-red-500/10 hover:border-red-500/20"
          onClick={() => navigate("/orders?status=FAILED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-400/80">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-black font-mono text-red-400 tracking-tight">{stats.failed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Active Shipment */}
        <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
            <CardTitle className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-400" />
              Current Active Shipment
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : activeShipment ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Order #</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{activeShipment.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Status</span>
                  <Badge className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    {activeShipment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Route</span>
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                    {activeShipment.pickupAddress?.split(',')[0]} → {activeShipment.dropAddress?.split(',')[0]}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2 border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-9 cursor-pointer"
                  onClick={() => navigate(`/tracking/${activeShipment.id}`)}
                >
                  Track Shipment <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-zinc-400">No active shipment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Delivery */}
        <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
            <CardTitle className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Upcoming Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : upcomingDelivery ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Order #</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{upcomingDelivery.orderNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-300 truncate">{upcomingDelivery.pickupAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-300 truncate">{upcomingDelivery.dropAddress}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-zinc-500">Est. Duration</span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {(upcomingDelivery as any).estimatedDuration ? `${Math.round(Number((upcomingDelivery as any).estimatedDuration) / 60)} min` : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-zinc-400">No upcoming deliveries</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
            <CardTitle className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">This Month</span>
                  <span className="text-lg font-black font-mono text-emerald-400">₹{totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Shipments</span>
                  <span className="text-sm font-bold text-zinc-300">{monthlyOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Avg. Cost</span>
                  <span className="text-sm font-bold text-zinc-300">
                    {monthlyOrders > 0 ? `₹${Math.round(totalSpent / monthlyOrders)}` : "₹0"}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-zinc-500">Logistics spending tracked</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
          <CardTitle className="text-sm font-black tracking-tight text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid gap-3 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer"
              onClick={() => navigate("/orders/create")}
            >
              <Plus className="mr-2 h-4 w-4 text-zinc-400" />
              Create Shipment
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer"
              onClick={() => navigate("/orders")}
            >
              <Package className="mr-2 h-4 w-4 text-zinc-400" />
              View All Shipments
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer"
              onClick={() => navigate("/orders?status=DELIVERED")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-zinc-400" />
              Delivery History
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer"
              onClick={() => navigate("/orders?status=FAILED")}
            >
              <AlertCircle className="mr-2 h-4 w-4 text-zinc-400" />
              Failed Deliveries
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-6 px-6 pt-6">
          <div>
            <CardTitle className="text-lg font-black tracking-tight text-white">Live Dispatches</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1 font-medium">Your latest shipments tracked in real-time.</CardDescription>
          </div>
          <Button variant="ghost" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.02]" onClick={() => navigate("/orders")}>
            View All Queue <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-semibold text-zinc-400">No active dispatches found.</p>
              <p className="text-xs text-zinc-500 mt-2">Create your first shipment to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/tracking/${order.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border ${
                      order.status === "FAILED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {order.status === "FAILED" ? <AlertCircle className="h-5 w-5" /> :
                       order.status === "DELIVERED" ? <CheckCircle2 className="h-5 w-5" /> :
                       <Truck className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-100">{order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                      order.status === "FAILED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-zinc-800 text-zinc-400 border-white/5"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

