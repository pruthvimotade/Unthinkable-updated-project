import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { UserCheck } from "lucide-react";

interface RecentAssignmentsCardProps {
  assignments: any[];
}

export function RecentAssignmentsCard({ assignments }: RecentAssignmentsCardProps) {
  return (
    <Card className="col-span-1 bg-zinc-950/30 border-white/5 backdrop-blur-xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-base font-black tracking-tight text-white">Latest Assignments</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
            <p className="text-xs text-zinc-500 font-semibold">No recent assignments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 mt-0.5 shrink-0">
                  {assignment.agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-200 truncate">
                    {assignment.agent.name}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Assigned to <span className="text-zinc-300 font-bold">{assignment.order.orderNumber}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Score: <span className="text-indigo-400 font-bold">{assignment.assignmentScore !== null && assignment.assignmentScore !== undefined ? Number(assignment.assignmentScore).toFixed(1) : "N/A"}</span>
                  </p>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono whitespace-nowrap shrink-0">
                  {new Date(assignment.assignedAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

