import type { TrackingEvent } from "../api/trackingApi";
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "../../../utils";

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative border-l-2 border-white/5 ml-4 md:ml-6 space-y-8 pb-4">
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
    if (!isLatest) return "bg-white/[0.02] text-zinc-500 border-white/5";
    switch(event.status) {
      case "DELIVERED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10";
      case "FAILED":
      case "CANCELLED": return "bg-red-500/10 text-red-400 border-red-500/20 shadow-sm shadow-red-500/10";
      default: return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm shadow-indigo-500/10";
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
        isLatest ? "opacity-100" : "opacity-60"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className={cn("text-sm font-bold", isLatest ? "text-zinc-100" : "text-zinc-500")}>
            {event.status.replace(/_/g, " ")}
          </h4>
          <span className="text-xs text-zinc-500 font-medium">
            {date.toLocaleString()}
          </span>
        </div>
        
        {event.description && (
          <p className="text-xs text-zinc-500">{event.description}</p>
        )}
        
        {event.latitude && event.longitude && (
          <p className="text-[10px] text-zinc-600 mt-1 bg-white/[0.02] w-fit px-2 py-1 rounded border border-white/5">
            Coordinates: {Number(event.latitude).toFixed(4)}, {Number(event.longitude).toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
