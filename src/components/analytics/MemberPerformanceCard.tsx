import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import { TaskType } from "@/lib/types";
import { isGraphicMotionTaskType, isGraphicOnlyTaskType, isDecorTaskType } from "@/lib/taskPoints";
import { TaskTypeBreakdownBadge } from "./TaskTypeBreakdownBadge";

interface MemberGlobalStats {
  id: string;
  name: string;
  initials: string;
  division: "graphic" | "motion" | "music" | null;
  totalPoints: number;
  tasksAssigned: number;
  projectsInvolvedCount: number;
  taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
}

interface MemberPerformanceCardProps {
  member: MemberGlobalStats;
  index: number;
  pieChartColors: string[];
}

export function MemberPerformanceCard({ member, index, pieChartColors }: MemberPerformanceCardProps) {
  let avatarBgClass = "glass";
  if (member.division === "graphic") avatarBgClass = "bg-primary/20 text-primary-foreground";
  else if (member.division === "motion") avatarBgClass = "bg-secondary/20 text-secondary-foreground";
  else if (member.division === "music") avatarBgClass = "bg-accent/20 text-accent-foreground";

  const graphicMotionBreakdowns = Object.entries(member.taskTypeBreakdown).filter(([type, breakdown]) => 
    isGraphicMotionTaskType(type as TaskType) && breakdown.count > 0
  );
  const graphicOnlyBreakdowns = Object.entries(member.taskTypeBreakdown).filter(([type, breakdown]) => 
    isGraphicOnlyTaskType(type as TaskType) && breakdown.count > 0
  );
  const decorBreakdowns = Object.entries(member.taskTypeBreakdown).filter(([type, breakdown]) => 
    isDecorTaskType(type as TaskType) && breakdown.count > 0
  );

  const hasAnyBreakdown = graphicMotionBreakdowns.length > 0 || graphicOnlyBreakdowns.length > 0 || decorBreakdowns.length > 0;

  // NEW: Determine if there's any content to show inside the CollapsibleContent
  const hasGraphicMotionContent = graphicMotionBreakdowns.length > 0;
  const hasGraphicOnlyContent = member.division === "graphic" && graphicOnlyBreakdowns.length > 0;
  const hasDecorContent = member.division === "graphic" && decorBreakdowns.length > 0;

  const hasAnyActualBreakdownContent = hasGraphicMotionContent || hasGraphicOnlyContent || hasDecorContent;

  return (
    <Card key={member.id} className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={index === 0 ? "default" : "secondary"}
            className="h-8 w-8 rounded-full flex items-center justify-center"
          >
            #{index + 1}
          </Badge>
          <Avatar>
            <AvatarFallback className={cn(avatarBgClass, "text-xs")}>
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              {member.tasksAssigned} tasks, {member.projectsInvolvedCount} projects
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Points</p>
          <p className="text-lg font-bold text-primary">{member.totalPoints.toFixed(1)}</p>
        </div>
      </div>

      {hasAnyBreakdown ? (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
            <span>Task Type Breakdown</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {hasAnyActualBreakdownContent ? (
              <>
                {/* Graphic-Motion Breakdown */}
                {hasGraphicMotionContent && (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Graphic-Motion Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {graphicMotionBreakdowns.map(([type, breakdown]) => <TaskTypeBreakdownBadge key={type} type={type as TaskType} breakdown={breakdown} />)}
                    </div>
                  </div>
                )}

                {/* Graphic Only Breakdown (only for graphic members) */}
                {hasGraphicOnlyContent && (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Graphic Only Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {graphicOnlyBreakdowns.map(([type, breakdown]) => <TaskTypeBreakdownBadge key={type} type={type as TaskType} breakdown={breakdown} />)}
                    </div>
                  </div>
                )}

                {/* Decor Breakdown (only for graphic members) */}
                {hasDecorContent && (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Decor Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {decorBreakdowns.map(([type, breakdown]) => <TaskTypeBreakdownBadge key={type} type={type as TaskType} breakdown={breakdown} />)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-dark p-3 rounded-lg text-center">
                <p className="text-muted-foreground text-sm font-medium">No tasks assigned to this member yet.</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-2 border-t border-border/50">No tasks assigned to this member yet.</p>
      )}
    </Card>
  );
}