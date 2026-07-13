import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { DashboardStats } from "../dashboard/DashboardStats";
import { RecentOrdersCard } from "../dashboard/RecentOrdersCard";
import { RecentAssignmentsCard } from "../dashboard/RecentAssignmentsCard";
import { RecentTrackingCard } from "../dashboard/RecentTrackingCard";
import { QuickActionsCard } from "../dashboard/QuickActionsCard";
import { AvailableAgentsCard } from "../dashboard/AvailableAgentsCard";
import { Skeleton } from "../../../components/ui/skeleton";
import { Activity } from "lucide-react";

export function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: adminApi.getDashboardData,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="col-span-1 lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="col-span-1 h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Failed to load admin dashboard</h2>
        <p className="text-muted-foreground max-w-md">
          {error?.message || "There was an error aggregating the latest platform analytics."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground">Monitor platform logistics, performance, and revenue in real-time.</p>
      </div>

      {data.stats.zoneSaturations && data.stats.zoneSaturations.length > 0 && (
        <div className="space-y-3">
          {data.stats.zoneSaturations.map((sat: any) => (
            <div key={sat.zoneId} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-2xl shadow-lg shadow-amber-500/5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <span className="text-sm font-semibold">
                Zone Saturation Alert: "{sat.zoneName}" is overloaded! Over 80% of active agents are currently at full capacity.
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
