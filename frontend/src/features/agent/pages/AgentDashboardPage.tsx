import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { agentApi } from "../api/agentApi";
import type { OrderWithTracking } from "../../tracking/api/trackingApi";
import type { OrderStatus } from "../../tracking/api/trackingApi";

import { AgentStatsCards } from "../components/AgentStatsCards";
import { AssignedOrdersTable } from "../components/AssignedOrdersTable";
import { OrderDetailsDrawer } from "../components/OrderDetailsDrawer";
import { Skeleton } from "../../../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { 
  Activity, 
  MapPin, 
  Phone, 
  Navigation, 
  Bell, 
  ChevronRight,
  Shield,
  Truck
} from "lucide-react";

export function AgentDashboardPage() {
  const { user } = useAuth();
  const agentId = user?.id;
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<OrderWithTracking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assigned" | "active" | "completed">("assigned");

  // Geolocation ping every 30 seconds
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const sendPing = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await agentApi.pingLocation(
              position.coords.latitude,
              position.coords.longitude
            );
          } catch (e) {
            console.error("Agent location ping failed:", e);
          }
        },
        (err) => {
          console.warn("Agent geolocation failed:", err);
        },
        { enableHighAccuracy: true }
      );
    };

    sendPing();
    const interval = setInterval(sendPing, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch orders
  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ["agentOrders", agentId],
    queryFn: () => agentApi.getAssignedOrders(agentId!),
    enabled: !!agentId,
    refetchInterval: 15000,
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["agentNotifications", agentId],
    queryFn: () => agentApi.getNotifications(),
    enabled: !!agentId,
    refetchInterval: 15000,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, description }: { orderId: string, status: OrderStatus, description: string }) => {
      return agentApi.updateOrderStatus(orderId, status, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agentNotifications", agentId] });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return agentApi.acceptAssignment(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agentNotifications", agentId] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return agentApi.rejectAssignment(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agentNotifications", agentId] });
    }
  });

  const handleViewDetails = (order: OrderWithTracking) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const filteredOrders = (orders || []).filter((order) => {
    if (activeTab === "assigned") {
      return order.status === "ASSIGNED";
    }
    if (activeTab === "active") {
      return ["PICKUP_ASSIGNED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status);
    }
    if (activeTab === "completed") {
      return ["DELIVERED", "FAILED", "CANCELLED"].includes(order.status);
    }
    return true;
  });

  // Find the single current active/uncompleted assignment
  const currentOrder = (orders || []).find((order) => 
    ["PENDING", "ASSIGNED", "PICKUP_ASSIGNED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status)
  );

  const currentAssignment = currentOrder?.assignments?.find(a => 
    a.agent.id === agentId && ["PENDING", "ACCEPTED"].includes(a.status)
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <Skeleton className="h-8 w-64 mb-2 rounded-xl bg-white/[0.02]" />
          <Skeleton className="h-4 w-96 rounded-lg bg-white/[0.02]" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.02]" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl bg-white/[0.02]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="bg-red-500/10 text-red-400 p-5 rounded-2xl border border-red-500/20">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Failed to load dashboard</h2>
        <p className="text-sm text-zinc-500 max-w-md">
          {error?.message || "There was an error communicating with the dispatch server."}
        </p>
      </div>
    );
  }

  // Delivery workflow step index helper
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case "ASSIGNED": return 0;
      case "PICKUP_ASSIGNED": return 1;
      case "ARRIVED_AT_PICKUP": return 2;
      case "PICKED_UP": return 3;
      case "IN_TRANSIT": return 4;
      case "OUT_FOR_DELIVERY": return 5;
      case "DELIVERED": return 6;
      default: return 0;
    }
  };

  const steps = [
    { label: "Assigned", desc: "Order assigned" },
    { label: "En Route", desc: "Heading to pickup" },
    { label: "Arrived", desc: "At pickup location" },
    { label: "Loaded", desc: "Package picked up" },
    { label: "In Transit", desc: "On the way" },
    { label: "Out for Delivery", desc: "Near destination" },
    { label: "Delivered", desc: "Completed" }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Agent Console</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Manage your route, update delivery steps, and view notifications in real-time.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Geolocation
        </Badge>
      </div>

      <AgentStatsCards orders={orders || []} onTabChange={setActiveTab} />

      {/* Main Grid for Current Assignment and Sidebars */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Current Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          {currentOrder ? (
            <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/15 text-[10px] font-black uppercase tracking-wider">
                      {currentOrder.status.replace(/_/g, " ")}
                    </Badge>
                    {currentOrder.orderType === "B2B" && (
                      <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider">
                        High Priority (B2B)
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-black mt-1.5 text-white">{currentOrder.orderNumber}</CardTitle>
                </div>
                {currentAssignment && currentAssignment.status === "PENDING" && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/5 animate-pulse text-[10px] font-black uppercase tracking-wider">
                    PENDING ACCEPTANCE
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Stepper Progress */}
                <div className="hidden md:block">
                  <div className="flex justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/5 z-0" />
                    <div 
                      className="absolute top-4 left-0 h-0.5 bg-indigo-500 transition-all duration-500 z-0" 
                      style={{ width: `${(getStepIndex(currentOrder.status) / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((step, idx) => {
                      const isActive = getStepIndex(currentOrder.status) >= idx;
                      return (
                        <div key={idx} className="flex flex-col items-center z-10 text-center flex-1">
                          <div className={`h-8.5 w-8.5 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                            isActive ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-zinc-900 border-white/10 text-zinc-500"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isActive ? "text-zinc-100" : "text-zinc-500"}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 h-10 w-10 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pickup Address</p>
                        <p className="text-sm font-bold mt-0.5 text-zinc-200">{currentOrder.pickupAddress}</p>
                        {currentOrder.pickupContact && (
                          <p className="text-xs text-zinc-500 mt-0.5">Contact: {currentOrder.pickupContact}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 h-10 w-10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Drop Address</p>
                        <p className="text-sm font-bold mt-0.5 text-zinc-200">{currentOrder.dropAddress}</p>
                        {currentOrder.dropContact && (
                          <p className="text-xs text-zinc-500 mt-0.5">Contact: {currentOrder.dropContact}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Customer:</span>
                      <span className="font-bold text-zinc-200">{currentOrder.customer.name}</span>
                    </div>
                    {currentOrder.customer.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-medium">Phone:</span>
                        <a 
                          href={`tel:${currentOrder.customer.phone}`} 
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {currentOrder.customer.phone}
                        </a>
                      </div>
                    )}
                    <Separator className="my-2 bg-white/5" />
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Distance:</span>
                      <span className="font-bold text-zinc-200">{currentOrder.distanceKm ? `${currentOrder.distanceKm} km` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Est. Duration:</span>
                      <span className="font-bold text-zinc-200">
                        {currentOrder.estimatedDuration 
                          ? `${Math.round(Number(currentOrder.estimatedDuration) / 60)} mins`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Billable Weight:</span>
                      <span className="font-bold text-zinc-200">{currentOrder.billableWeight ? `${currentOrder.billableWeight} kg` : "N/A"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Workflow Actions */}
                <div className="flex flex-wrap gap-3">
                  {currentAssignment && currentAssignment.status === "PENDING" ? (
                    <>
                      <Button 
                        onClick={() => acceptMutation.mutate(currentAssignment.id)} 
                        disabled={acceptMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex-1 md:flex-initial rounded-xl cursor-pointer"
                      >
                        Accept Assignment
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(currentAssignment.id)} 
                        disabled={rejectMutation.isPending}
                        className="flex-1 md:flex-initial rounded-xl cursor-pointer"
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      {currentOrder.status === "ASSIGNED" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "PICKUP_ASSIGNED", 
                            description: "En route to pickup location" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Start Journey to Pickup
                        </Button>
                      )}

                      {currentOrder.status === "PICKUP_ASSIGNED" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "ARRIVED_AT_PICKUP", 
                            description: "Agent arrived at pickup point" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Arrived at Pickup
                        </Button>
                      )}

                      {currentOrder.status === "ARRIVED_AT_PICKUP" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "PICKED_UP", 
                            description: "Package loaded and verified" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Picked Up (Loaded)
                        </Button>
                      )}

                      {currentOrder.status === "PICKED_UP" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "IN_TRANSIT", 
                            description: "In transit to customer destination" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Start Transit to Destination
                        </Button>
                      )}

                      {currentOrder.status === "IN_TRANSIT" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "OUT_FOR_DELIVERY", 
                            description: "Out for delivery in customer area" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Mark Out For Delivery
                        </Button>
                      )}

                      {currentOrder.status === "OUT_FOR_DELIVERY" && (
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: currentOrder.id, 
                            status: "DELIVERED", 
                            description: "Package successfully delivered to customer" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Confirm Delivery (Complete)
                        </Button>
                      )}

                      <Button 
                        variant="secondary"
                        onClick={() => window.open(`https:// www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(currentOrder.pickupAddress)}&destination=${encodeURIComponent(currentOrder.dropAddress)}`, "_blank")}
                        className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl cursor-pointer border border-white/5"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate (Maps)
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-950/30 border-white/5 border-dashed backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-white/[0.02] rounded-full text-zinc-500 border border-white/5">
                <Truck className="h-10 w-10 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-lg text-zinc-200">No Active Assignment</h3>
                <p className="text-zinc-500 text-sm max-w-sm mt-1 font-medium">
                  You are currently available! New orders assigned by the dispatch console will appear here instantly.
                </p>
              </div>
            </Card>
          )}

          {/* Today's Route List */}
          <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                Today's Delivery Route
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {orders && orders.filter(o => !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length > 0 ? (
                <div className="space-y-3">
                  {orders
                    .filter(o => !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status))
                    .map((o, index) => (
                      <div 
                        key={o.id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          o.id === currentOrder?.id 
                            ? "bg-indigo-500/10 border-indigo-500/20 ring-1 ring-indigo-500/20" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-400">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-200">{o.orderNumber}</p>
                            <p className="text-xs text-zinc-500 truncate max-w-[200px] md:max-w-md mt-0.5">{o.pickupAddress} → {o.dropAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider border-white/10 text-zinc-400 bg-white/[0.02]">
                            {o.status.toLowerCase().replace(/_/g, " ")}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-6 font-medium">No route sequence to display.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tracking Progress & Recent Notifications Sidebars */}
        <div className="space-y-6">
          {/* Tracking Progress timeline of active order */}
          {currentOrder && (
            <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                  Live Tracking Event Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[280px] overflow-y-auto space-y-4">
                {currentOrder.trackingEvents && currentOrder.trackingEvents.length > 0 ? (
                  <div className="relative border-l border-white/5 pl-4 space-y-4">
                    {currentOrder.trackingEvents.map((evt, idx) => (
                      <div key={evt.id} className="relative">
                        <span className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border ${
                          idx === 0 ? "bg-indigo-500 border-indigo-500 animate-ping" : "bg-zinc-800 border-white/10"
                        }`} />
                        <span className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border ${
                          idx === 0 ? "bg-indigo-500 border-indigo-500" : "bg-zinc-800 border-white/10"
                        }`} />
                        <div>
                          <p className={`text-xs font-bold ${idx === 0 ? "text-indigo-400" : "text-zinc-300"}`}>
                            {evt.status.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">{evt.description}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No tracking event logged yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Notifications Alert Panel */}
          <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-400 animate-bounce" />
                Live Dispatch Alerts
              </CardTitle>
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider">{notifications?.length || 0} New</Badge>
            </CardHeader>
            <CardContent className="pt-4 max-h-[300px] overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-zinc-200">{notif.title}</p>
                        <span className="text-[9px] text-zinc-500">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{notif.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6 font-medium">No new notifications from the dispatch hub.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Filter view for All Orders */}
      <div>
        <div className="flex border-b border-white/5 space-x-6 mb-6">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === "assigned"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Assigned Orders ({orders?.filter(o => o.status === "ASSIGNED").length || 0})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === "active"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Active Deliveries ({orders?.filter(o => ["PICKUP_ASSIGNED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)).length || 0})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === "completed"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Completed ({orders?.filter(o => ["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length || 0})
          </button>
        </div>
        <AssignedOrdersTable 
          orders={filteredOrders} 
          agentId={agentId!} 
          onViewDetails={handleViewDetails}
        />
      </div>

      <OrderDetailsDrawer 
        order={selectedOrder} 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
      />
    </div>
  );
}
