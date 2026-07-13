import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Eye, Loader2, Package } from "lucide-react";
import type { OrderWithTracking, OrderStatus } from "../../tracking/api/trackingApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";

interface AssignedOrdersTableProps {
  orders: OrderWithTracking[];
  agentId: string;
  onViewDetails: (order: OrderWithTracking) => void;
}

export function AssignedOrdersTable({ orders, agentId, onViewDetails }: AssignedOrdersTableProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, status, desc }: { orderId: string; status: OrderStatus; desc: string }) => {
      return agentApi.updateOrderStatus(orderId, status, desc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (assignmentId: string) => agentApi.acceptAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (assignmentId: string) => agentApi.rejectAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentOrders"] });
    },
  });

  const getContextAction = (status: OrderStatus, assignmentStatus?: string) => {
    switch (status) {
      case "ASSIGNED":
        if (assignmentStatus === "ACCEPTED") {
          return { label: "Arrived at Pickup", nextStatus: "PICKUP_ASSIGNED" as OrderStatus, desc: "Agent arrived at pickup location" };
        }
        return null;
      case "PICKUP_ASSIGNED":
        return { label: "Package Picked Up", nextStatus: "PICKED_UP" as OrderStatus, desc: "Package picked up by agent" };
      case "ARRIVED_AT_PICKUP":
        return { label: "Package Picked Up", nextStatus: "PICKED_UP" as OrderStatus, desc: "Package picked up by agent" };
      case "PICKED_UP":
        return { label: "Start Delivery", nextStatus: "IN_TRANSIT" as OrderStatus, desc: "Delivery started" };
      case "IN_TRANSIT":
        return { label: "Out For Delivery", nextStatus: "OUT_FOR_DELIVERY" as OrderStatus, desc: "Order is out for delivery" };
      case "OUT_FOR_DELIVERY":
        return { label: "Delivered Successfully", nextStatus: "DELIVERED" as OrderStatus, desc: "Delivered successfully" };
      default:
        return null;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">No Active Assignments</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You currently have no orders assigned to you. When the dispatch team assigns orders, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Pickup / Drop Address</TableHead>
            <TableHead>Distance / Weight</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            // Find the specific assignment record for this agent, including PENDING
            const assignment = order.assignments?.find(a => 
              a.agent.id === agentId && 
              ["ACCEPTED", "PENDING", "COMPLETED", "CANCELLED"].includes(a.status)
            );
            const assignedTime = assignment ? new Date((assignment as any).assignedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
            const score = assignment ? Number((assignment as any).assignmentScore || 0).toFixed(1) : "N/A";
            
            const isFinished = order.status === "DELIVERED" || order.status === "FAILED" || order.status === "CANCELLED";
            const actionInfo = getContextAction(order.status as OrderStatus, assignment?.status);
            const isPending = mutation.isPending && mutation.variables?.orderId === order.id;

            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div className="font-semibold">{order.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{order.customer.phone || "No phone"}</div>
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="truncate text-xs" title={order.pickupAddress}>
                    <span className="font-medium text-primary">Pickup:</span> {order.pickupAddress}
                  </div>
                  <div className="truncate text-xs text-muted-foreground mt-0.5" title={order.dropAddress}>
                    <span className="font-medium text-emerald-600">Drop:</span> {order.dropAddress}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div>{order.distanceKm !== null && order.distanceKm !== undefined ? `${Number(order.distanceKm).toFixed(1)} km` : "N/A"}</div>
                  <div className="text-muted-foreground mt-0.5">{order.actualWeight !== null && order.actualWeight !== undefined ? `${Number(order.actualWeight).toFixed(1)} kg` : "N/A"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={isFinished ? "secondary" : "default"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                  {assignment?.status === "PENDING" && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                      Pending Action
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div>{assignedTime}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Score: {score}</div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {assignment?.status === "PENDING" ? (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => acceptMutation.mutate(assignment.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate(assignment.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Reject
                      </Button>
                    </>
                  ) : (
                    actionInfo && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => mutation.mutate({ orderId: order.id, status: actionInfo.nextStatus, desc: actionInfo.desc })}
                        disabled={isPending}
                      >
                        {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        {actionInfo.label}
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
