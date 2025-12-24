import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users } from "lucide-react";
import { TaskType, TeamMember } from "@/lib/types";
import { isGraphicMotionTaskType, isGraphicOnlyTaskType, isDecorTaskType } from "@/lib/taskPoints";
import { TaskTypeBreakdownBadge } from "./TaskTypeBreakdownBadge";

interface TeamInvolvementStats {
  id: string;
  name: string;
  projectCount: number;
  division: "graphic" | "motion" | "music";
  totalPoints: number;
  taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
}

interface TeamInvolvementCardProps {
  title: string;
  team: TeamInvolvementStats;
  fullTeamMembers: TeamMember[];
  index: number;
}

export function TeamInvolvementCard({ title, team, fullTeamMembers, index }: TeamInvolvementCardProps) {
  const graphicMotionBreakdowns = Object.entries(team.taskTypeBreakdown).filter(([type, breakdown]) => 
    isGraphicMotionTaskType(type as TaskType) && breakdown.count > 0
  );
  const graphicOnlyBreakdowns = Object.entries(team.taskTypeBreakdown).filter(([type, breakdown]) => 
    isGraphicOnlyTaskType(type as TaskType) && breakdown.count > 0
  );
  const decorBreakdowns = Object.entries(team.taskTypeBreakdown).filter(([type, breakdown]) => 
    isDecorTaskType(type as TaskType) && breakdown.count > 0
  );

  const hasAnyBreakdown = graphicMotionBreakdowns.length > 0 || graphicOnlyBreakdowns.length > 0 || decorBreakdowns.length > 0;

  // NEW: Determine if there's any content to show inside the CollapsibleContent
  const hasGraphicMotionContent = graphicMotionBreakdowns.length > 0;
  const hasGraphicOnlyContent = team.division === "graphic" && graphicOnlyBreakdowns.length > 0;
  const hasDecorContent = team.division === "graphic" && decorBreakdowns.length > 0;

  const hasAnyActualBreakdownContent = hasGraphicMotionContent || hasGraphicOnlyContent || hasDecorContent;

  return (
    <Card key={team.id} className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="h-8 w-8 rounded-full flex items-center justify-center">
            #{index + 1}
          </Badge>
          <p className="font-semibold">{team.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Projects / Points</p>
          <p className="text-lg font-bold text-primary">
            {team.projectCount} / {team.totalPoints.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Team Members */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
          <span>Team Members ({fullTeamMembers.length})</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {fullTeamMembers.map(member => (
            <div key={member.id} className="flex items-center gap-2 text-sm glass-dark p-2 rounded">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
              </Avatar>
              <span>{member.name}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Task Type Breakdown for Team */}
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

                {/* Graphic Only Breakdown (only for graphic teams) */}
                {hasGraphicOnlyContent && (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Graphic Only Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {graphicOnlyBreakdowns.map(([type, breakdown]) => <TaskTypeBreakdownBadge key={type} type={type as TaskType} breakdown={breakdown} />)}
                    </div>
                  </div>
                )}

                {/* Decor Breakdown (only for graphic teams) */}
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
                <p className="text-muted-foreground text-sm font-medium">No tasks assigned to this team yet.</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-2 border-t border-border/50">No tasks assigned to this team yet.</p>
      )}
    </Card>
  );
}