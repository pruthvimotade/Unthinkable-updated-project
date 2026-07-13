import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { TrackingProgressBar } from "./TrackingProgressBar";
import type { OrderWithTracking } from "../api/trackingApi";
import { Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";

interface TrackingStatusCardProps {
  order: OrderWithTracking;
}

export function TrackingStatusCard({ order }: TrackingStatusCardProps) {
  // Mock estimated delivery date (3 days from creation)
  const estDelivery = new Date(order.createdAt);
  estDelivery.setDate(estDelivery.getDate() + 3);

  const getStatusIcon = () => {
    switch(order.status) {
      case "DELIVERED": return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "FAILED":
      case "CANCELLED": return <AlertCircle className="h-6 w-6 text-destructive" />;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY": return <Truck className="h-6 w-6 text-primary" />;
      default: return <Package className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch(order.status) {
      case "DELIVERED": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "FAILED":
      case "CANCELLED": return "destructive";
      default: return "default";
    }
  };

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="bg-muted p-3 rounded-full hidden sm:block">
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Order Number</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {order.orderNumber}
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <Badge variant={getStatusColor() as any} className="text-sm px-3 py-1 w-fit">
              {order.status.replace(/_/g, " ")}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Estimated Delivery: <span className="font-semibold text-foreground">{estDelivery.toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <TrackingProgressBar status={order.status} />
      </CardContent>
    </Card>
  );
}
