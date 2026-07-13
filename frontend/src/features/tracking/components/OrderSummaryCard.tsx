import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import type { OrderWithTracking } from "../api/trackingApi";
import { MapPin, Box, Banknote, UserCircle } from "lucide-react";
import { formatINR } from "../../../utils/currency";

interface OrderSummaryCardProps {
  order: OrderWithTracking;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const activeAssignment = order.assignments?.find(a => 
    ["ACCEPTED", "COMPLETED", "CANCELLED"].includes(a.status)
  );

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="text-lg">Order Details</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b">
          
          {/* Origin */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Pickup Origin</h3>
            </div>
            <p className="text-sm">{order.pickupAddress}</p>
            {order.pickupArea && (
              <p className="text-xs text-muted-foreground">{order.pickupArea.name} ({order.pickupArea.zone?.name})</p>
            )}
            <p className="text-xs font-medium pt-2">{order.pickupContact}</p>
          </div>

          {/* Destination */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Drop Destination</h3>
            </div>
            <p className="text-sm">{order.dropAddress}</p>
            {order.dropArea && (
              <p className="text-xs text-muted-foreground">{order.dropArea.name} ({order.dropArea.zone?.name})</p>
            )}
            <p className="text-xs font-medium pt-2">{order.dropContact}</p>
          </div>

          {/* Package */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Box className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Package Details</h3>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Type: <span className="font-medium text-foreground">{order.orderType}</span></p>
              <p>Actual Wt: <span className="font-medium text-foreground">{order.actualWeight} kg</span></p>
              <p>Billable Wt: <span className="font-medium text-foreground">{order.billableWeight} kg</span></p>
              {order.lengthCm && (
                <p className="text-xs">Dims: {order.lengthCm}x{order.widthCm}x{order.heightCm} cm</p>
              )}
            </div>
          </div>

          {/* Payment & Agent */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Financials</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pricing Breakdown</p>
              <div className="space-y-1 text-sm bg-muted/20 p-3 rounded-md">
                <p>Base: <span className="font-medium text-foreground">{formatINR(order.calculatedPrice || 0)}</span></p>
                <p>Total: <span className="font-medium text-foreground text-lg text-primary">{formatINR(order.calculatedPrice || 0)}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground pt-4 mt-4 border-t">
              <UserCircle className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Assigned Agent</h3>
            </div>
            {activeAssignment ? (
              <div className="text-sm space-y-1 bg-muted/35 p-3 rounded-md border border-border/40 mt-1">
                <p className="font-semibold text-foreground">{activeAssignment.agent.name}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Vehicle:</span> {activeAssignment.agent.agentStatus?.vehicleType || "BIKE"}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Phone:</span> {activeAssignment.agent.phone || "N/A"}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Rating:</span> ⭐ {activeAssignment.agent.agentStatus?.rating ? Number(activeAssignment.agent.agentStatus.rating).toFixed(1) : "5.0"}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Status:</span> {activeAssignment.agent.agentStatus?.availability || "OFFLINE"}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">ETA:</span> {(() => {
                  if (order.estimatedDuration) {
                    const date = new Date(order.createdAt);
                    date.setSeconds(date.getSeconds() + order.estimatedDuration);
                    return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${date.toLocaleDateString()})`;
                  }
                  const estDelivery = new Date(order.createdAt);
                  estDelivery.setDate(estDelivery.getDate() + 3);
                  return estDelivery.toLocaleDateString();
                })()}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Pending assignment</p>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
