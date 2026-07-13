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
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch only the most recent orders to compute quick stats
  // In a real prod app, there would be a dedicated /dashboard/stats endpoint.
  // We use the orders endpoint for now as per the "existing backend APIs" rule.
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-2">
            Here is an overview of your delivery operations.
          </p>
        </div>
        <Button onClick={() => navigate("/orders/create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/orders")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/orders?status=DELIVERED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.delivered}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/orders?status=IN_TRANSIT")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.inTransit}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => navigate("/orders?status=FAILED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest orders and their statuses.</CardDescription>
          </div>
          <Button variant="ghost" className="text-sm" onClick={() => navigate("/orders")}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You have no recent orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tracking/${order.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      order.status === "FAILED" ? "bg-destructive/10 text-destructive" :
                      order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {order.status === "FAILED" ? <AlertCircle className="h-5 w-5" /> :
                       order.status === "DELIVERED" ? <CheckCircle2 className="h-5 w-5" /> :
                       <Truck className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={order.status === "FAILED" ? "destructive" : "secondary"}>
                      {order.status}
                    </Badge>
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
