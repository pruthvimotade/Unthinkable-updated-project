import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { orderApi } from "../api/orderApi";
import { Package, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export function OrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { page, limit }],
    queryFn: () => orderApi.getOrders({ page, limit }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Delivered</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
      case "ASSIGNED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Assigned</Badge>;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">In Transit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Manage and track all your delivery orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>A complete list of your past and active orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError || !data ? (
            <div className="text-center py-10 text-destructive">
              Failed to load orders. Please try again later.
            </div>
          ) : data.data.orders.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mt-1 mb-6">You haven't created any delivery orders yet.</p>
              <Button onClick={() => navigate("/orders/create")}>Create Your First Order</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm max-w-[200px] truncate">
                            <span className="flex items-center gap-1 text-muted-foreground truncate">
                              <MapPin className="h-3 w-3 inline-block shrink-0" />
                              {order.pickupAddress}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 inline-block shrink-0 text-primary" />
                              {order.dropAddress}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {order.orderType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 flex items-center gap-1 ml-auto"
                            onClick={() => navigate(`/tracking/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Track
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.data.total)} of {data.data.total} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.data.totalPages, p + 1))}
                      disabled={page === data.data.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
