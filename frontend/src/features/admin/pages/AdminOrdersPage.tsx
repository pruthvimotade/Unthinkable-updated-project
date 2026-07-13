import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../../orders/api/orderApi";
import { adminApi } from "../api/adminApi";
import { api } from "../../../api/axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { formatINR } from "../../../utils/currency";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  
  const [page, setPage] = useState(1);
  const [orderType, setOrderType] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const orders = data?.data?.orders || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50">
        <div className="space-y-2">
          <Label>Search Orders</Label>
          <Input 
            type="text" 
            placeholder="Order #, customer, phone..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
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
          <Label>Order Type</Label>
          <Select value={orderType} onChange={(e) => { setOrderType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Payment Type</Label>
          <Select value={paymentType} onChange={(e) => { setPaymentType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">COD</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-2">
          <Label>Date To</Label>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-2">
          <Label>Sorting</Label>
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by);
              setSortOrder(order as "asc" | "desc");
              setPage(1);
            }}
          >
            <option value="createdAt-desc">Newest</option>
            <option value="createdAt-asc">Oldest</option>
            <option value="calculatedPrice-desc">Highest Price</option>
            <option value="calculatedPrice-asc">Lowest Price</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button 
            className="w-full"
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.orderType} - {order.paymentType}</TableCell>
                <TableCell>{formatINR(order.calculatedPrice || 0)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{order.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedOrder(order);
                    setOverrideStatus(order.status);
                  }}>
                    Override
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setReassignOrder(order);
                  }}>
                    {order.status === "PENDING" ? "Assign" : "Reassign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No orders found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="p-2 bg-muted rounded-md">{selectedOrder?.status.replace(/_/g, " ")}</div>
            </div>
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}>
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
              <Label>Reason (Required)</Label>
              <Input 
                value={overrideReason} 
                onChange={(e) => setOverrideReason(e.target.value)} 
                placeholder="E.g. Operational delay, manually requested by customer..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={isPending || !overrideReason || overrideStatus === selectedOrder?.status}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassignOrder} onOpenChange={(open) => !open && setReassignOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reassignOrder?.status === "PENDING" ? "Assign Agent" : "Reassign Agent"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingCandidates ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Agent Candidate</Label>
                <div className="max-h-[250px] overflow-y-auto border rounded-md divide-y">
                  {(candidatesData || []).map((candidate: any, index: number) => {
                    const isRecommended = index === 0;
                    const isSelected = reassignAgentId === candidate.agent.userId;
                    return (
                      <div
                        key={candidate.agent.userId}
                        onClick={() => setReassignAgentId(candidate.agent.userId)}
                        className={`p-3 cursor-pointer transition-colors text-xs flex flex-col justify-between gap-1 items-start ${
                          isSelected ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-semibold text-foreground">{candidate.agent.name}</span>
                          <span className="text-xs font-bold text-primary">{candidate.totalScore.toFixed(1)} pts</span>
                        </div>
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {candidate.agent.vehicleType || "BIKE"}
                          </span>
                          {isRecommended && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              ⭐ Recommended Agent
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-0.5 w-full mt-1">
                          <div>Rating: {candidate.agent.rating?.toFixed(1) || "5.0"}</div>
                          <div>Acceptance: {candidate.agent.acceptanceRate || "100"}%</div>
                          <div>Distance: {candidate.distanceKm !== undefined ? candidate.distanceKm.toFixed(1) + " km" : "N/A"}</div>
                          <div>Active Orders: {candidate.agent.activeOrders}</div>
                        </div>
                      </div>
                    );
                  })}
                  {(candidatesData || []).length === 0 && (
                    <div className="text-center p-4 text-muted-foreground text-xs">
                      No online agents available
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {reassignOrder?.status !== "PENDING" && (
              <div className="space-y-2">
                <Label>Reason (Required)</Label>
                <Input 
                  value={reassignReason} 
                  onChange={(e) => setReassignReason(e.target.value)} 
                  placeholder="E.g. Vehicle breakdown, delay..." 
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOrder(null)}>Cancel</Button>
            <Button 
              onClick={handleReassign} 
              disabled={reassignPending || (reassignOrder?.status !== "PENDING" && !reassignReason) || !reassignAgentId}
            >
              {reassignPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
