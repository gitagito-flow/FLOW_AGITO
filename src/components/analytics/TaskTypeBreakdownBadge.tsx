import { Badge } from "@/components/ui/badge";
import { TaskType } from "@/lib/types";

interface TaskTypeBreakdownBadgeProps {
  type: TaskType;
  breakdown: { count: number; points: number };
}

export function TaskTypeBreakdownBadge({ type, breakdown }: TaskTypeBreakdownBadgeProps) {
  return (
    <div className="glass-dark p-2 rounded">
      <div className="space-y-1">
        <Badge variant="outline" className="text-xs w-full justify-center">
          {type}
        </Badge>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Tasks:</span>
          <span className="font-bold text-foreground">{breakdown.count}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Points:</span>
          <span className="font-bold text-primary">{breakdown.points.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}