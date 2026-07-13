import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Select } from "../../../components/ui/select";
import { Loader2 } from "lucide-react";

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
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Available Agents</CardTitle>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[120px] text-xs h-8"
        >
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No agents match the filter.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Vehicle / Rating</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Assignments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent: any) => {
                  const availability = agent.agentStatus?.availability || "OFFLINE";
                  const badgeVariant = 
                    availability === "ONLINE" ? "default" :
                    availability === "BUSY" ? "secondary" : "outline";
                  
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
                    <TableRow key={agent.id}>
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-sm">{agent.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={badgeVariant as any} className="text-[10px] px-1 py-0 scale-90 origin-left">
                            {availability}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground" title={locationText}>
                            Loc: {locationText}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs">
                        <div>{agent.agentStatus?.vehicleType || "BIKE"}</div>
                        <div className="text-muted-foreground mt-0.5">⭐ {rating}</div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-center font-semibold">
                        <span title="Active / Capacity">{workload}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-center font-semibold">
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
