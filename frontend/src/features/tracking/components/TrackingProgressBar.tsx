import type { OrderStatus } from "../api/trackingApi";
import { cn } from "../../../utils";

interface TrackingProgressBarProps {
  status: OrderStatus;
}

const LINEAR_STATUS_STAGES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function TrackingProgressBar({ status }: TrackingProgressBarProps) {
  // If it's cancelled, returned, or failed, we might show a different state
  // But for the standard progress, we'll map to the linear stages.
  let currentIndex = LINEAR_STATUS_STAGES.indexOf(status);
  
  if (currentIndex === -1) {
    if (status === "CONFIRMED") currentIndex = 0;
    else if (status === "PICKUP_ASSIGNED" || status === "ARRIVED_AT_PICKUP") currentIndex = 1;
    else if (status === "FAILED" || status === "CANCELLED" || status === "RETURNED") {
      currentIndex = -1; // Specific handling below
    }
  }

  // Calculate percentage (clamped 0 to 100)
  const totalStages = LINEAR_STATUS_STAGES.length - 1;
  const percentage = currentIndex === -1 ? 100 : (currentIndex / totalStages) * 100;
  
  const isErrorState = ["FAILED", "CANCELLED", "RETURNED"].includes(status);

  return (
    <div className="w-full space-y-2 mt-4">
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-in-out",
            isErrorState ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
        <span>Order Placed</span>
        <span>Out for Delivery</span>
        <span>Delivered</span>
      </div>
    </div>
  );
}
