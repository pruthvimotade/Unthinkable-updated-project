import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { DashboardStats } from "../dashboard/DashboardStats";
import { RecentOrdersCard } from "../dashboard/RecentOrdersCard";
import { RecentAssignmentsCard } from "../dashboard/RecentAssignmentsCard";
import { RecentTrackingCard } from "../dashboard/RecentTrackingCard";
import { QuickActionsCard } from "../dashboard/QuickActionsCard";
import { AvailableAgentsCard } from "../dashboard/AvailableAgentsCard";
import { Skeleton } from "../../../components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: adminApi.getDashboardData,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <Skeleton className="h-8 w-64 mb-2 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="col-span-1 lg:col-span-2 h-[350px] rounded-2xl" />
          <Skeleton className="col-span-1 h-[350px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="bg-red-500/10 text-red-400 p-5 rounded-2xl border border-red-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Control Center Unavailable</h2>
        <p className="text-sm text-zinc-500 max-w-md">
          {error?.message || "Failed to aggregate platform analytics. The backend may be unreachable."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Operations Hub
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Monitor platform logistics, fleet performance, and revenue in real-time.</p>
      </div>

      {data.stats.zoneSaturations && data.stats.zoneSaturations.length > 0 && (
        <div className="space-y-3">
          {data.stats.zoneSaturations.map((sat: any) => (
            <div key={sat.zoneId} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-2xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Zone Saturation Alert: "{sat.zoneName}" — Over 80% agents at full capacity.
              </span>
            </div>
          ))}
        </div>
      )}

      <DashboardStats stats={data.stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RecentOrdersCard orders={data.recentOrders} />
        <RecentAssignmentsCard assignments={data.recentAssignments} />
        <AvailableAgentsCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RecentTrackingCard events={data.recentTracking} />
        <QuickActionsCard />
      </div>
    </div>
  );
}

