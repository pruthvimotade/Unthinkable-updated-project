import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Loader2, Users } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { useToast } from "../../../contexts/ToastContext";

export function AgentsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: agents, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: adminApi.getAgents
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminApi.updateAgentStatus(id, status),
    onSuccess: () => {
      success("Agent status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
    },
    onError: () => {
      error("Failed to update agent status");
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Agents Management
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Monitor delivery agent status, current workloads, and system routing settings.</p>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Phone</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Capacity</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Availability</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">System Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.map((agent: any) => {
              const availability = agent.agentStatus?.availability || "OFFLINE";
              return (
                <TableRow key={agent.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                  <TableCell className="font-bold text-xs text-zinc-200">{agent.name}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{agent.email}</TableCell>
                  <TableCell className="text-xs text-zinc-400 font-mono">{agent.phone || "-"}</TableCell>
                  <TableCell className="text-xs text-zinc-200 font-bold">{agent.agentStatus?.capacity || 0}</TableCell>
                  <TableCell>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      availability === "ONLINE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      availability === "BUSY" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-zinc-800 text-zinc-500 border border-white/5"
                    }`}>
                      {availability}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select 
                      disabled={isPending}
                      value={agent.status}
                      onChange={(e) => updateStatus({ id: agent.id, status: e.target.value })}
                      className="text-xs h-9 rounded-xl border-white/5 bg-zinc-900 text-zinc-300 px-2 cursor-pointer w-[120px]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!agents || agents.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No delivery agents registered.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

