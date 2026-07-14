import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Activity } from "lucide-react";
import type { TrackingEvent } from "../../tracking/api/trackingApi";

interface RecentTrackingCardProps {
  events: TrackingEvent[];
}

export function RecentTrackingCard({ events }: RecentTrackingCardProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 bg-zinc-950/30 border-white/5 backdrop-blur-xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-base font-black tracking-tight text-white">Global Tracking Feed</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
            <p className="text-xs text-zinc-500 font-semibold">No recent tracking updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      Order {event.order?.orderNumber || "Unknown"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Status → <span className="text-zinc-300 font-bold">{event.status.replace(/_/g, " ")}</span>
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono sm:text-right">
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

