import type { TrackingEvent } from "../api/trackingApi";
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "../../../utils";

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative border-l-2 border-muted ml-4 md:ml-6 space-y-8 pb-4">
      {events.map((event, index) => {
        const isLatest = index === 0; // events are ordered by createdAt desc

        return (
          <TrackingEventCard
            key={event.id}
            event={event}
            isLatest={isLatest}
          />
        );
      })}
    </div>
  );
}

interface TrackingEventCardProps {
  event: TrackingEvent;
  isLatest: boolean;
}

function TrackingEventCard({ event, isLatest }: TrackingEventCardProps) {
  const getEventIcon = () => {
    switch(event.status) {
      case "PENDING":
      case "CONFIRMED": return <Clock className="h-4 w-4" />;
      case "DELIVERED": return <CheckCircle2 className="h-4 w-4" />;
      case "FAILED":
      case "CANCELLED": return <AlertCircle className="h-4 w-4" />;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY": return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getIconColor = () => {
    if (!isLatest) return "bg-muted text-muted-foreground border-border";
    switch(event.status) {
      case "DELIVERED": return "bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-100";
      case "FAILED":
      case "CANCELLED": return "bg-destructive/10 text-destructive border-destructive/20 shadow-sm shadow-destructive/10";
      default: return "bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/10";
    }
  };

  const date = new Date(event.createdAt);

  return (
    <div className="relative pl-8 md:pl-10">
      <div 
        className={cn(
          "absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
          getIconColor()
        )}
      >
        {getEventIcon()}
      </div>
      
      <div className={cn(
        "flex flex-col space-y-1.5",
        isLatest ? "opacity-100" : "opacity-70"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className={cn("text-base font-semibold", isLatest ? "text-foreground" : "text-muted-foreground")}>
            {event.status.replace(/_/g, " ")}
          </h4>
          <span className="text-xs text-muted-foreground font-medium">
            {date.toLocaleString()}
          </span>
        </div>
        
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        
        {event.latitude && event.longitude && (
          <p className="text-xs text-muted-foreground mt-1 bg-muted/50 w-fit px-2 py-1 rounded">
            Coordinates: {Number(event.latitude).toFixed(4)}, {Number(event.longitude).toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
