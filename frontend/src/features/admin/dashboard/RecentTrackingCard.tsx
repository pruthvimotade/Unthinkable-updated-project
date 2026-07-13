import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Activity } from "lucide-react";
import type { TrackingEvent } from "../../tracking/api/trackingApi";

interface RecentTrackingCardProps {
  events: TrackingEvent[];
}

export function RecentTrackingCard({ events }: RecentTrackingCardProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Global Tracking Feed</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent tracking updates.</p>
        ) : (
          <div className="space-y-6">
            {events.map((event, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Order {event.order?.orderNumber || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status updated to <strong className="text-foreground">{event.status.replace(/_/g, " ")}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
