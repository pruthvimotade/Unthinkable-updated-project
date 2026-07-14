import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import type { OrderWithTracking } from "../../tracking/api/trackingApi";
import { formatINR } from "../../../utils/currency";
import { Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";

interface RecentOrdersCardProps {
  orders: OrderWithTracking[];
}

export function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 bg-zinc-950/30 border-white/5 backdrop-blur-xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-base font-black tracking-tight text-white">Recent Shipments</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
            <p className="text-xs font-semibold text-zinc-400">No recent shipments found.</p>
            <p className="text-[10px] text-zinc-500 mt-1">New orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-3">Shipment</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-3">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-3">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-3">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right py-3">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-bold text-xs text-zinc-200 py-3">{order.orderNumber}</TableCell>
                    <TableCell className="text-xs text-zinc-400 py-3">{order.customer.name}</TableCell>
                    <TableCell className="text-xs text-zinc-400 py-3">{order.orderType}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {order.status === "DELIVERED" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {order.status === "FAILED" && <AlertCircle className="h-3 w-3 text-red-400" />}
                        {["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status) && <Truck className="h-3 w-3 text-indigo-400" />}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          order.status === "FAILED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status) ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                          "bg-white/[0.03] text-zinc-300 border border-white/5"
                        }`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <p className="font-bold text-xs text-white">{formatINR(order.calculatedPrice || 0)}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

