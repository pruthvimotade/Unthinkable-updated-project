import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Loader2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
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

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Agents Management</h1>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>System Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.map((agent: any) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>{agent.phone || "-"}</TableCell>
                <TableCell>{agent.agentStatus?.capacity || 0}</TableCell>
                <TableCell>
                  <Badge variant={agent.agentStatus?.availability === "ONLINE" ? "default" : "secondary"}>
                    {agent.agentStatus?.availability || "OFFLINE"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    disabled={isPending}
                    value={agent.status}
                    onChange={(e) => updateStatus({ id: agent.id, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {(!agents || agents.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No agents found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
