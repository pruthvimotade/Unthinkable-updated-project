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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
        <p className="text-muted-foreground max-w-md">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">Agent Console</h1>
          <p className="text-muted-foreground">Manage your route, update delivery steps, and view notifications in real-time.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 text-sm bg-green-500/10 text-green-500 border-green-500/20">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Active Geolocation
        </Badge>
      </div>

      <AgentStatsCards orders={orders || []} />

      {/* Main Grid for Current Assignment and Sidebars */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Current Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          {currentOrder ? (
            <Card className="border-border/80 shadow-lg relative overflow-hidden backdrop-blur-sm bg-card/60">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-muted/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {currentOrder.status.replace(/_/g, " ")}
                    </Badge>
                    {currentOrder.orderType === "B2B" && (
                      <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                        High Priority (B2B)
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold mt-1.5">{currentOrder.orderNumber}</CardTitle>
                </div>
                {currentAssignment && currentAssignment.status === "PENDING" && (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5 animate-pulse">
                    PENDING ACCEPTANCE
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Stepper Progress */}
                <div className="hidden md:block">
                  <div className="flex justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted z-0" />
                    <div 
                      className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 z-0" 
                      style={{ width: `${(getStepIndex(currentOrder.status) / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((step, idx) => {
                      const isActive = getStepIndex(currentOrder.status) >= idx;
                      return (
                        <div key={idx} className="flex flex-col items-center z-10 text-center flex-1">
                          <div className={`h-8.5 w-8.5 rounded-full flex items-center justify-center border text-xs font-semibold transition-all ${
                            isActive ? "bg-primary border-primary text-primary-foreground shadow" : "bg-card border-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[11px] mt-2 font-medium ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 h-10 w-10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pickup Address</p>
                        <p className="text-sm font-medium mt-0.5">{currentOrder.pickupAddress}</p>
                        {currentOrder.pickupContact && (
                          <p className="text-xs text-muted-foreground mt-0.5">Contact: {currentOrder.pickupContact}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 h-10 w-10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Drop Address</p>
                        <p className="text-sm font-medium mt-0.5">{currentOrder.dropAddress}</p>
                        {currentOrder.dropContact && (
                          <p className="text-xs text-muted-foreground mt-0.5">Contact: {currentOrder.dropContact}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-muted/40 p-4 rounded-xl text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-semibold">{currentOrder.customer.name}</span>
                    </div>
                    {currentOrder.customer.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Phone:</span>
                        <a 
                          href={`tel:${currentOrder.customer.phone}`} 
                          className="flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {currentOrder.customer.phone}
                        </a>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-semibold">{currentOrder.distanceKm ? `${currentOrder.distanceKm} km` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Duration:</span>
                      <span className="font-semibold">
                        {currentOrder.estimatedDuration 
                          ? `${Math.round(Number(currentOrder.estimatedDuration) / 60)} mins`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billable Weight:</span>
                      <span className="font-semibold">{currentOrder.billableWeight ? `${currentOrder.billableWeight} kg` : "N/A"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Workflow Actions */}
                <div className="flex flex-wrap gap-3">
                  {currentAssignment && currentAssignment.status === "PENDING" ? (
                    <>
                      <Button 
                        onClick={() => acceptMutation.mutate(currentAssignment.id)} 
                        disabled={acceptMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold flex-1 md:flex-initial"
                      >
                        Accept Assignment
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(currentAssignment.id)} 
                        disabled={rejectMutation.isPending}
                        className="flex-1 md:flex-initial"
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
                          className="bg-primary hover:bg-primary/90 font-semibold"
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
                          className="bg-primary hover:bg-primary/90 font-semibold"
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
                          className="bg-primary hover:bg-primary/90 font-semibold"
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
                          className="bg-primary hover:bg-primary/90 font-semibold"
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
                          className="bg-primary hover:bg-primary/90 font-semibold"
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
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          Confirm Delivery (Complete)
                        </Button>
                      )}

                      <Button 
                        variant="secondary"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(currentOrder.pickupAddress)}&destination=${encodeURIComponent(currentOrder.dropAddress)}`, "_blank")}
                        className="flex items-center gap-1"
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
            <Card className="border-border/60 bg-muted/20 border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-4 bg-muted rounded-full text-muted-foreground">
                <Truck className="h-10 w-10 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-lg">No Active Assignment</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  You are currently available! New orders assigned by the dispatch console will appear here instantly.
                </p>
              </div>
            </Card>
          )}

          {/* Today's Route List */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-muted/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
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
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          o.id === currentOrder?.id 
                            ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                            : "bg-muted/10 border-border hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-md mt-0.5">{o.pickupAddress} → {o.dropAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {o.status.toLowerCase().replace(/_/g, " ")}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No route sequence to display.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tracking Progress & Recent Notifications Sidebars */}
        <div className="space-y-6">
          {/* Tracking Progress timeline of active order */}
          {currentOrder && (
            <Card className="border-border/80">
              <CardHeader className="pb-3 border-b border-muted/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Tracking Event Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[280px] overflow-y-auto space-y-4">
                {currentOrder.trackingEvents && currentOrder.trackingEvents.length > 0 ? (
                  <div className="relative border-l border-muted pl-4 space-y-4">
                    {currentOrder.trackingEvents.map((evt, idx) => (
                      <div key={evt.id} className="relative">
                        <span className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border ${
                          idx === 0 ? "bg-primary border-primary animate-ping" : "bg-muted border-border"
                        }`} />
                        <span className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border ${
                          idx === 0 ? "bg-primary border-primary" : "bg-muted border-border"
                        }`} />
                        <div>
                          <p className={`text-xs font-semibold ${idx === 0 ? "text-primary" : "text-foreground"}`}>
                            {evt.status.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{evt.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tracking event logged yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Notifications Alert Panel */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-muted/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary animate-bounce" />
                Live Dispatch Alerts
              </CardTitle>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{notifications?.length || 0} New</Badge>
            </CardHeader>
            <CardContent className="pt-4 max-h-[300px] overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 rounded-lg bg-muted/30 border border-muted/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-foreground">{notif.title}</p>
                        <span className="text-[9px] text-muted-foreground">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No new notifications from the dispatch hub.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Filter view for All Orders */}
      <div>
        <div className="flex border-b border-border space-x-6 mb-6">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "assigned"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Assigned Orders ({orders?.filter(o => o.status === "ASSIGNED").length || 0})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Deliveries ({orders?.filter(o => ["PICKUP_ASSIGNED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)).length || 0})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "completed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
