import { Sheet, SheetHeader, SheetTitle, SheetDescription } from "../../../components/ui/sheet";
import { OrderSummaryCard } from "../../tracking/components/OrderSummaryCard";
import { TrackingTimeline } from "../../tracking/components/TrackingTimeline";
import type { OrderWithTracking } from "../../tracking/api/trackingApi";
import { Badge } from "../../../components/ui/badge";

interface OrderDetailsDrawerProps {
  order: OrderWithTracking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDrawer({ order, open, onOpenChange }: OrderDetailsDrawerProps) {
  if (!order) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <div />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <div className="flex items-center justify-between pt-4">
          <Badge variant="secondary" className="mb-2">{order.status.replace(/_/g, " ")}</Badge>
        </div>
        <SheetTitle className="text-2xl">{order.orderNumber}</SheetTitle>
        <SheetDescription>
          Customer: {order.customer.name} ({order.customer.phone || order.customer.email})
        </SheetDescription>
      </SheetHeader>

      <div className="mt-8 space-y-8">
        
        {/* We can re-use the OrderSummaryCard from tracking since it renders what we need beautifully */}
        <div>
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="[&>div]:border-none [&>div]:shadow-none [&>div]:bg-muted/10 [&>div>div]:p-4 [&>div>div]:grid-cols-1 md:[&>div>div]:grid-cols-1 lg:[&>div>div]:grid-cols-1 [&>div>div]:divide-y [&>div>div]:divide-x-0">
            {/* Force single column for the drawer by overriding styles using tailwind descendant selectors */}
            <OrderSummaryCard order={order} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Timeline</h3>
          <div className="bg-muted/10 p-4 rounded-md">
             <TrackingTimeline events={order.trackingEvents} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
