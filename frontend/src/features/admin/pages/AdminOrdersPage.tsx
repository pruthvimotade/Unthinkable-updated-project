import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { orderApi } from "../../orders/api/orderApi";
import { adminApi } from "../api/adminApi";
import { api } from "../../../api/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { formatINR } from "../../../utils/currency";
import { Loader2, Package } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  
  const [page, setPage] = useState(1);
  const [orderType, setOrderType] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [reassignOrder, setReassignOrder] = useState<any>(null);
  const [reassignAgentId, setReassignAgentId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, orderType, paymentType, dateFrom, dateTo, search, status, sortBy, sortOrder],
    queryFn: () => orderApi.getOrders({ 
      page, 
      limit: 20,
      orderType: orderType || undefined,
      paymentType: paymentType || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      search: search || undefined,
      status: status || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined
    })
  });

  const { mutate: overrideTracking, isPending } = useMutation({
    mutationFn: (payload: { orderId: string, toStatus: string, reason: string }) => 
      adminApi.overrideTracking(payload.orderId, { toStatus: payload.toStatus, reason: payload.reason }),
    onSuccess: () => {
      success("Order status overridden successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
      setOverrideReason("");
      setOverrideStatus("");
    },
    onError: () => {
      error("Failed to override order status");
    }
  });

  const { mutate: reassignMutate, isPending: reassignPending } = useMutation({
    mutationFn: async (payload: { orderId: string, agentId?: string, reason?: string, isInitial: boolean }) => {
      if (payload.isInitial) {
        const { data } = await api.post(`/assignments/manual/${payload.orderId}`, {
          agentId: payload.agentId
        });
        return data;
      } else {
        const { data } = await api.post(`/assignments/reassign/${payload.orderId}`, {
          agentId: payload.agentId || undefined,
          reason: payload.reason
        });
        return data;
      }
    },
    onSuccess: (_, variables) => {
      success(variables.isInitial ? "Agent assigned successfully" : "Order reassigned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setReassignOrder(null);
      setReassignAgentId("");
      setReassignReason("");
    },
    onError: (err: any) => {
      error(err.response?.data?.message || "Operation failed");
    }
  });

  const handleOverride = () => {
    if (!selectedOrder || !overrideStatus || !overrideReason) return;
    overrideTracking({ orderId: selectedOrder.id, toStatus: overrideStatus, reason: overrideReason });
  };

  const handleReassign = () => {
    if (!reassignOrder || !reassignAgentId) return;
    const isInitial = reassignOrder.status === "PENDING";
    if (!isInitial && !reassignReason) return;
    reassignMutate({ 
      orderId: reassignOrder.id, 
      agentId: reassignAgentId, 
      reason: reassignReason, 
      isInitial 
    });
  };

  const { data: candidatesData, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["reassign-candidates", reassignOrder?.id],
    queryFn: async () => {
      const { data } = await api.get(`/assignments/candidates/${reassignOrder.id}`);
      return data.data;
    },
    enabled: !!reassignOrder?.id
  });

  useEffect(() => {
    if (candidatesData && candidatesData.length > 0 && !reassignAgentId) {
      setReassignAgentId(candidatesData[0].agent.userId);
    }
  }, [candidatesData, reassignAgentId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const orders = data?.data?.orders || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Orders Queue
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Manage active dispatches, override delivery routes, and trigger manuals drivers scoring.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Search Orders</Label>
          <Input 
            type="text" 
            placeholder="Order #, customer, phone..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Status</Label>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="PICKUP_ASSIGNED">PICKUP ASSIGNED</option>
            <option value="PICKED_UP">PICKED UP</option>
            <option value="IN_TRANSIT">IN TRANSIT</option>
            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Order Type</Label>
          <Select value={orderType} onChange={(e) => { setOrderType(e.target.value); setPage(1); }} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
            <option value="">All Types</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Payment Type</Label>
          <Select value={paymentType} onChange={(e) => { setPaymentType(e.target.value); setPage(1); }} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
            <option value="">All Types</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">COD</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Date From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Date To</Label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-400 font-bold text-xs">Sorting</Label>
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by);
              setSortOrder(order as "asc" | "desc");
              setPage(1);
            }}
            className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer"
          >
            <option value="createdAt-desc">Newest</option>
            <option value="createdAt-asc">Oldest</option>
            <option value="calculatedPrice-desc">Highest Price</option>
            <option value="calculatedPrice-asc">Lowest Price</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button 
            className="w-full border-white/5 hover:bg-white/[0.02] text-xs rounded-xl h-11 cursor-pointer font-bold"
            variant="outline" 
            onClick={() => {
              setSearch("");
              setStatus("");
              setOrderType("");
              setPaymentType("");
              setDateFrom("");
              setDateTo("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order #</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Created</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell className="font-bold text-xs text-zinc-200">{order.orderNumber}</TableCell>
                <TableCell className="text-xs text-zinc-400">{order.orderType} - {order.paymentType}</TableCell>
                <TableCell className="text-xs text-zinc-200 font-bold">{formatINR(order.calculatedPrice || 0)}</TableCell>
                <TableCell>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    order.status === "FAILED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-white/5"
                  }`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedOrder(order);
                    setOverrideStatus(order.status);
                  }} className="border-white/5 hover:bg-white/[0.05] text-[10px] rounded-xl cursor-pointer">
                    Override
                  </Button>
                  <Button size="sm" onClick={() => {
                    setReassignOrder(order);
                  }} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] rounded-xl cursor-pointer">
                    {order.status === "PENDING" ? "Assign" : "Reassign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Package className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No orders matching these criteria.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl cursor-pointer">
            Previous
          </Button>
          <span className="text-xs text-zinc-400 font-semibold font-mono">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl cursor-pointer">
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">Override Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Current Status</Label>
              <div className="p-3 bg-white/[0.02] border border-white/5 text-zinc-300 rounded-xl text-xs font-semibold">
                {selectedOrder?.status.replace(/_/g, " ")}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">New Target Status</Label>
              <Select value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="PICKED_UP">PICKED UP</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="FAILED">FAILED</option>
                <option value="RESCHEDULED">RESCHEDULED</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Audit Reason</Label>
              <Input 
                value={overrideReason} 
                onChange={(e) => setOverrideReason(e.target.value)} 
                placeholder="E.g. Operational delay, manually requested by customer..." 
                className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl h-11 cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleOverride} disabled={isPending || !overrideReason || overrideStatus === selectedOrder?.status} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-11 cursor-pointer">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassignOrder} onOpenChange={(open) => !open && setReassignOrder(null)}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">
              {reassignOrder?.status === "PENDING" ? "Assign Agent" : "Reassign Agent"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingCandidates ? (
              <div className="flex justify-center p-6">
                <Loader2 className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Recommended Drivers</Label>
                <div className="max-h-[250px] overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5 bg-zinc-900/50">
                  {(candidatesData || []).map((candidate: any, index: number) => {
                    const isRecommended = index === 0;
                    const isSelected = reassignAgentId === candidate.agent.userId;
                    return (
                      <div
                        key={candidate.agent.userId}
                        onClick={() => setReassignAgentId(candidate.agent.userId)}
                        className={`p-3 cursor-pointer transition-colors text-xs flex flex-col gap-2 items-start ${
                          isSelected ? "bg-indigo-500/10 border-indigo-500/20" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-bold text-zinc-200">{candidate.agent.name}</span>
                          <span className="text-[10px] font-black text-indigo-400 font-mono">{candidate.totalScore.toFixed(1)} PTS</span>
                        </div>
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">
                            {candidate.agent.vehicleType || "BIKE"}
                          </span>
                          {isRecommended && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-1.5 py-0.5 rounded">
                              ⭐ Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500 grid grid-cols-2 gap-x-2 gap-y-0.5 w-full mt-1 border-t border-white/5 pt-1.5">
                          <div>Rating: ⭐ {candidate.agent.rating?.toFixed(1) || "5.0"}</div>
                          <div>Accepts: {candidate.agent.acceptanceRate || "100"}%</div>
                          <div>Distance: {candidate.distanceKm !== undefined ? candidate.distanceKm.toFixed(1) + " km" : "N/A"}</div>
                          <div>Capacity: {candidate.agent.activeOrders} active</div>
                        </div>
                      </div>
                    );
                  })}
                  {(candidatesData || []).length === 0 && (
                    <div className="text-center p-6 text-zinc-500 text-xs">
                      No active agents in search grid
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {reassignOrder?.status !== "PENDING" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Audit Reason</Label>
                <Input 
                  value={reassignReason} 
                  onChange={(e) => setReassignReason(e.target.value)} 
                  placeholder="E.g. Vehicle breakdown, delay..." 
                  className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11"
                />
              </div>
            )}
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setReassignOrder(null)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl h-11 cursor-pointer">
              Cancel
            </Button>
            <Button 
              onClick={handleReassign} 
              disabled={reassignPending || (reassignOrder?.status !== "PENDING" && !reassignReason) || !reassignAgentId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-11 cursor-pointer"
            >
              {reassignPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

