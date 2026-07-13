import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatcherApi } from "../api/dispatcherApi";
import { useToast } from "../../../contexts/ToastContext";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Activity, Clock, Crosshair } from "lucide-react";
import { AxiosError } from "axios";

export function DispatcherDashboardPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pendingOrdersData, isLoading } = useQuery({
    queryKey: ["dispatcher", "pendingOrders"],
    queryFn: dispatcherApi.getPendingOrders,
    refetchInterval: 15000, // Refresh every 15s
  });

  const pendingOrders = pendingOrdersData?.orders || [];

  const autoAssignMutation = useMutation({
    mutationFn: dispatcherApi.autoAssign,
    onSuccess: () => {
      success("Order successfully assigned via auto-assignment algorithm.");
      queryClient.invalidateQueries({ queryKey: ["dispatcher", "pendingOrders"] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      error(err.response?.data?.message || "Failed to auto-assign order. No agents available?");
    }
  });

  const handleAutoAssign = (orderId: string) => {
    autoAssignMutation.mutate(orderId);
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispatcher Dashboard</h1>
        <p className="text-muted-foreground">Monitor the queue and assign orders to the fleet.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{pendingOrdersData?.total || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Assignment Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Queue is empty. All orders have been assigned!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(order => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{order.orderType}</Badge>
                      <Badge variant="outline">{order.paymentType}</Badge>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right text-sm text-muted-foreground">
                    <p>Pickup: {order.pickupAddress}</p>
                    <p>Drop: {order.dropAddress}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => handleAutoAssign(order.id)}
                      disabled={autoAssignMutation.isPending}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Crosshair className="w-4 h-4" />
                      Auto-Assign
                    </Button>
                    <Button variant="outline" disabled>
                      Manual Assign
                    </Button>
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
