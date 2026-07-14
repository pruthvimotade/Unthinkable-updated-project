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
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-wider">Delivered</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider">Failed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-wider">Pending</Badge>;
      case "ASSIGNED":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 text-[10px] font-black uppercase tracking-wider">Assigned</Badge>;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/15 text-[10px] font-black uppercase tracking-wider">In Transit</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider border-white/10 text-zinc-400 bg-white/[0.02]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Orders Queue
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Manage and track all your delivery orders in real-time.</p>
      </div>

      <Card className="bg-zinc-950/30 border-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-lg font-black tracking-tight text-white">Order History</CardTitle>
          <CardDescription className="text-xs text-zinc-500 font-medium">A complete list of your past and active orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-16 w-full rounded-xl bg-white/[0.02]" />
              <Skeleton className="h-16 w-full rounded-xl bg-white/[0.02]" />
              <Skeleton className="h-16 w-full rounded-xl bg-white/[0.02]" />
              <Skeleton className="h-16 w-full rounded-xl bg-white/[0.02]" />
            </div>
          ) : isError || !data ? (
            <div className="text-center py-16 text-red-400 font-semibold">
              Failed to load orders. Please try again later.
            </div>
          ) : data.data.orders.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Package className="h-12 w-12 text-zinc-600 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-zinc-300">No orders found</h3>
              <p className="text-zinc-500 mt-1 mb-6 text-sm font-medium">You haven't created any delivery orders yet.</p>
              <Button onClick={() => navigate("/orders/create")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer">Create Your First Order</Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-white/5 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order Number</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Route</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.orders.map((order) => (
                      <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                        <TableCell className="font-bold text-xs text-zinc-200">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs max-w-[200px] truncate">
                            <span className="flex items-center gap-1 text-zinc-500 truncate">
                              <MapPin className="h-3 w-3 inline-block shrink-0" />
                              {order.pickupAddress}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 inline-block shrink-0 text-indigo-400" />
                              {order.dropAddress}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-white/10 text-zinc-400 bg-white/[0.02]">
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
                            className="h-8 flex items-center gap-1 ml-auto text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.02] rounded-lg cursor-pointer"
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
                <div className="flex items-center justify-between mt-6 p-6 pt-0">
                  <p className="text-xs text-zinc-500 font-medium">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.data.total)} of {data.data.total} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-white/5 hover:bg-white/[0.02] text-xs rounded-lg cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.data.totalPages, p + 1))}
                      disabled={page === data.data.totalPages}
                      className="border-white/5 hover:bg-white/[0.02] text-xs rounded-lg cursor-pointer"
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
