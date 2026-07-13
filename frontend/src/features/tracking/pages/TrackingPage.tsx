import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "../api/trackingApi";
import { orderApi } from "../../orders/api/orderApi";
import { TrackingStatusCard } from "../components/TrackingStatusCard";
import { OrderSummaryCard } from "../components/OrderSummaryCard";
import { TrackingTimeline } from "../components/TrackingTimeline";
import { RescheduleDeliveryCard } from "../components/RescheduleDeliveryCard";
import { TrackingMap } from "../components/TrackingMap";
import { Skeleton } from "../../../components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Activity, ChevronRight, Package, MapPin } from "lucide-react";

export function TrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ["tracking", orderId],
    queryFn: () => trackingApi.getOrderWithTracking(orderId!),
    enabled: !!orderId,
    refetchInterval: 30000, // Poll every 30 seconds for live updates
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", { page: 1, limit: 100 }],
    queryFn: () => orderApi.getOrders({ page: 1, limit: 100 }),
    enabled: !orderId,
  });

  if (!orderId) {
    if (isLoadingOrders) {
      return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      );
    }

    const orders = ordersData?.data?.orders || [];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track Your Deliveries</h1>
          <p className="text-muted-foreground mt-2">
            Select one of your active or past orders to view real-time tracking information.
          </p>
        </div>

        <Card className="border-muted/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No orders to track</h3>
                <p className="text-muted-foreground mt-1 mb-6">Create an order first to track it in real-time.</p>
                <Button onClick={() => navigate("/orders/create")}>Create Order</Button>
              </div>
            ) : (
              <div className="divide-y border rounded-lg overflow-hidden bg-card">
                {orders.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">{item.orderNumber}</span>
                        <Badge variant="secondary" className="text-xs font-semibold capitalize bg-primary/10 text-primary hover:bg-primary/20">
                          {item.status.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2 truncate max-w-lg">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-foreground">Pickup:</span> {item.pickupAddress}
                        </span>
                        <span className="flex items-center gap-2 truncate max-w-lg">
                          <MapPin className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">Drop:</span> {item.dropAddress}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => navigate(`/tracking/${item.id}`)} className="sm:self-center shrink-0">
                      Track Order <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Failed to load tracking data</h2>
        <p className="text-muted-foreground max-w-md">
          {error?.message || "The order could not be found or you do not have permission to view it."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      
      {/* Top Section */}
      <section className="space-y-6">
        <TrackingStatusCard order={order} />
        {order.status === "FAILED" && (
          <RescheduleDeliveryCard orderId={order.id} />
        )}
      </section>

      {/* Middle Section */}
      <section className="grid md:grid-cols-2 gap-6">
        <OrderSummaryCard order={order} />
        <Card className="flex flex-col h-full">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <TrackingMap 
              status={order.status}
              pickupLat={Number(order.pickupLatitude) || 18.95}
              pickupLng={Number(order.pickupLongitude) || 72.83}
              dropLat={Number(order.dropLatitude) || 19.1}
              dropLng={Number(order.dropLongitude) || 72.9}
            />
          </CardContent>
        </Card>
      </section>

      {/* Bottom Section */}
      <section>
        <Card>
          <CardHeader className="border-b bg-muted/30 pb-4 mb-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Tracking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.trackingEvents && order.trackingEvents.length > 0 ? (
              <TrackingTimeline events={order.trackingEvents} />
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No tracking events found for this order yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
      
    </div>
  );
}
