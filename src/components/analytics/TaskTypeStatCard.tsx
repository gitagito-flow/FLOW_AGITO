import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskType } from "@/lib/types";

interface TaskTypeStatCardProps {
  type: TaskType;
  stats: { total: number; completed: number; inProgress: number };
}

export function TaskTypeStatCard({ type, stats }: TaskTypeStatCardProps) {
  return (
    <Card className="glass p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {type}
          </Badge>
          <span className="text-lg font-bold">{stats.total}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-semibold text-success">{stats.completed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Progress:</span>
            <span className="font-semibold text-accent">{stats.inProgress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To Do:</span>
            <span className="font-semibold text-muted-foreground">
              {stats.total - stats.completed - stats.inProgress}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}