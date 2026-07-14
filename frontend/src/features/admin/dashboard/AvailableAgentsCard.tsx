import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Select } from "../../../components/ui/select";
import { Loader2, Users, Truck } from "lucide-react";

export function AvailableAgentsCard() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: adminApi.getAgents,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredAgents = agents.filter((agent: any) => {
    const status = agent.agentStatus?.availability || "OFFLINE";
    if (statusFilter === "all") return true;
    return status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <Card className="col-span-1 bg-zinc-950/30 border-white/5 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6">
        <CardTitle className="text-base font-black tracking-tight text-white">Fleet Availability</CardTitle>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[120px] text-xs h-8 rounded-xl border-white/5 bg-zinc-900 text-zinc-300 px-2 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </Select>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
            <p className="text-xs font-semibold text-zinc-400">No agents match the filter.</p>
            <p className="text-[10px] text-zinc-500 mt-1">Adjust filter or add new agents to the fleet.</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <Table>
              <TableHeader className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-0 py-3">Agent</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-3">Vehicle</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center py-3">Workload</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center pr-0 py-3">Jobs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent: any) => {
                  const availability = agent.agentStatus?.availability || "OFFLINE";
                  const rating = agent.agentStatus?.rating !== null && agent.agentStatus?.rating !== undefined
                    ? Number(agent.agentStatus.rating).toFixed(1)
                    : "5.0";
                  
                  const active = agent.agentStatus?.activeOrders || 0;
                  const capacity = agent.agentStatus?.capacity || 5;
                  const workload = `${active}/${capacity}`;
                  const assignmentsCount = agent._count?.agentAssignments || 0;
                  
                  const lat = agent.agentStatus?.latitude;
                  const lng = agent.agentStatus?.longitude;
                  const locationText = lat && lng ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "Unknown";

                  return (
                    <TableRow key={agent.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                      <TableCell className="py-3 pl-0">
                        <div className="font-bold text-xs text-zinc-200">{agent.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            availability === "ONLINE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            availability === "BUSY" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-zinc-800 text-zinc-500 border border-white/5"
                          }`}>
                            {availability}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-500 truncate max-w-[80px]" title={locationText}>
                            {locationText}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3 w-3 text-zinc-500" />
                          <span>{agent.agentStatus?.vehicleType || "BIKE"}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">⭐ {rating}</div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-center font-bold text-zinc-300">
                        {workload}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-center font-bold text-zinc-300 pr-0">
                        {assignmentsCount}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

