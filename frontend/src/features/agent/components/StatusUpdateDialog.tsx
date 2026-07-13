import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { agentApi } from "../api/agentApi";
import type { OrderStatus, OrderWithTracking } from "../../tracking/api/trackingApi";
import { Loader2 } from "lucide-react";

interface StatusUpdateDialogProps {
  order: OrderWithTracking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map of valid next states based on backend rules
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["ASSIGNED"],
  ASSIGNED: ["PICKUP_ASSIGNED", "PICKED_UP"],
  PICKUP_ASSIGNED: ["ARRIVED_AT_PICKUP", "PICKED_UP", "FAILED"],
  ARRIVED_AT_PICKUP: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
};

export function StatusUpdateDialog({ order, open, onOpenChange }: StatusUpdateDialogProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => {
      // Provide a generic description based on the status
      const desc = `Status updated to ${status.replace(/_/g, " ")}`;
      return agentApi.updateOrderStatus(order!.id, status, desc);
    },
    onSuccess: () => {
      // Invalidate to refresh table, stats, and tracking
      queryClient.invalidateQueries({ queryKey: ["agentOrders"] });
      onOpenChange(false);
      setSelectedStatus(null);
      setErrorMsg(null);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || "Failed to update status");
    }
  });

  if (!order) return null;

  const validNextStates = VALID_TRANSITIONS[order.status] || [];

  const handleUpdate = () => {
    if (!selectedStatus) return;
    mutation.mutate({ status: selectedStatus });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Order #{order.orderNumber} is currently <strong className="text-foreground">{order.status}</strong>.
          Select the next valid status from the options below.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {errorMsg && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {validNextStates.length === 0 ? (
          <div className="text-center p-4 bg-muted rounded-md text-sm text-muted-foreground">
            No further updates are allowed for this order (Final State).
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {validNextStates.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`flex items-center justify-between p-4 border rounded-md transition-all ${
                  selectedStatus === status 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="font-semibold text-sm">
                  {status.replace(/_/g, " ")}
                </span>
                {selectedStatus === status && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => {
            onOpenChange(false);
            setSelectedStatus(null);
          }}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpdate} 
          disabled={!selectedStatus || mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Update
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
