import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { UserCheck } from "lucide-react";

interface RecentAssignmentsCardProps {
  assignments: any[];
}

export function RecentAssignmentsCard({ assignments }: RecentAssignmentsCardProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Latest Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent assignments.</p>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {assignment.agent.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Assigned to <span className="text-foreground font-medium">{assignment.order.orderNumber}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score: <span className="text-foreground font-medium">{assignment.assignmentScore !== null && assignment.assignmentScore !== undefined ? Number(assignment.assignmentScore).toFixed(1) : "N/A"}</span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
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
