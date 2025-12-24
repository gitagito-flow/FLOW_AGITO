import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project, TaskType } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Award, ListChecks, ChevronDown, CheckCircle } from "lucide-react"; // Added CheckCircle
import { getMemberById, graphicTeams, motionTeams, musicTeam, getMemberDivision } from "@/lib/teams"; // Import getMemberDivision
import { 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints"; // Import task type helpers
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible

interface PerformanceAnalyticsProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to map member IDs to their categories
const getMemberCategoryMap = () => {
  const map: Record<string, "graphic" | "motion" | "music"> = {};
  graphicTeams.forEach(team => team.members.forEach(member => map[member.id] = "graphic"));
  motionTeams.forEach(team => team.members.forEach(member => map[member.id] = "motion"));
  musicTeam.members.forEach(member => map[member.id] = "music");
  return map;
};

// Helper to initialize task type stats for a category (used for project-level stats)
function initializeTaskTypeStats() {
  return {
    "CLIP": { total: 0, completed: 0, inProgress: 0 },
    "PRESENTATION": { total: 0, completed: 0, inProgress: 0 },
    "BUMPER": { total: 0, completed: 0, inProgress: 0 },
    "BACKGROUND": { total: 0, completed: 0, inProgress: 0 },
    "MINOR_ITEMS_ANIMATION": { total: 0, completed: 0, inProgress: 0 },
    "BRANDING": { total: 0, completed: 0, inProgress: 0 },
    "ADVERTISING": { total: 0, completed: 0, inProgress: 0 },
    "MICROSITE_UI_DESIGN": { total: 0, completed: 0, inProgress: 0 },
    "DIGITAL_MEDIA": { total: 0, completed: 0, inProgress: 0 },
    "PRINTED_MEDIA_MINOR_DESIGN": { total: 0, completed: 0, inProgress: 0 },
    "PRINTED_INFORMATION": { total: 0, completed: 0, inProgress: 0 },
    "PRINTED_DECORATION": { total: 0, completed: 0, inProgress: 0 },
    "CUTTING_MAL_RESIZE": { total: 0, completed: 0, inProgress: 0 },
  };
}

// NEW HELPER: Initialize task type breakdown for members (used for member-level stats)
function initializeMemberTaskTypeBreakdown() {
  return {
    "CLIP": { count: 0, points: 0 },
    "PRESENTATION": { count: 0, points: 0 },
    "BUMPER": { count: 0, points: 0 },
    "BACKGROUND": { count: 0, points: 0 },
    "MINOR_ITEMS_ANIMATION": { count: 0, points: 0 },
    "BRANDING": { count: 0, points: 0 },
    "ADVERTISING": { count: 0, points: 0 },
    "MICROSITE_UI_DESIGN": { count: 0, points: 0 },
    "DIGITAL_MEDIA": { count: 0, points: 0 },
    "PRINTED_MEDIA_MINOR_DESIGN": { count: 0, points: 0 },
    "PRINTED_INFORMATION": { count: 0, points: 0 },
    "PRINTED_DECORATION": { count: 0, points: 0 },
    "CUTTING_MAL_RESIZE": { count: 0, points: 0 },
  };
}

export function PerformanceAnalytics({ project, open, onOpenChange }: PerformanceAnalyticsProps) {
  const [selectedDivision, setSelectedDivision] = useState<"all" | "graphic" | "motion" | "music">("all");
  const memberCategoryMap = getMemberCategoryMap();

  // Calculate member statistics with task type breakdown
  const memberStats = new Map<string, { 
    name: string; 
    tasksAssigned: number;
    points: number;
    taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
  }>();

  // Categorized task type statistics for the project
  const categorizedProjectTaskTypeStats = {
    graphicMotion: initializeTaskTypeStats(),
    graphicOnly: initializeTaskTypeStats(),
    decor: initializeTaskTypeStats(),
  };

  project.tasks.forEach((task) => {
    // Update project-level task type stats
    let targetStats: Record<TaskType, { total: number; completed: number; inProgress: number }>;
    if (isGraphicMotionTaskType(task.type)) {
      targetStats = categorizedProjectTaskTypeStats.graphicMotion;
    } else if (isGraphicOnlyTaskType(task.type)) {
      targetStats = categorizedProjectTaskTypeStats.graphicOnly;
    } else if (isDecorTaskType(task.type)) {
      targetStats = categorizedProjectTaskTypeStats.decor;
    } else {
      return; // Skip if task type is not categorized
    }

    targetStats[task.type].total += 1;
    let isTaskCompleted = false;
    if (isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)) {
      isTaskCompleted = task.columnId === "done-graphics";
    } else if (isGraphicMotionTaskType(task.type)) {
      isTaskCompleted = task.columnId === "final";
    }

    if (isTaskCompleted) {
      targetStats[task.type].completed += 1;
    } else if (task.columnId !== "todo-graphics" && task.columnId !== "todo-motion") {
      targetStats[task.type].inProgress += 1;
    }

    task.memberAssignments.forEach(assignment => {
      const memberId = assignment.memberId;
      const member = getMemberById(memberId);
      
      if (!memberStats.has(memberId)) {
        memberStats.set(memberId, {
          name: member?.name || memberId,
          tasksAssigned: 0,
          points: 0,
          taskTypeBreakdown: initializeMemberTaskTypeBreakdown() // Use the new, correct initializer
        });
      }

      const stats = memberStats.get(memberId)!;
      
      const memberPoints = task.points * (assignment.percentage / 100);
      stats.points += memberPoints;
      stats.tasksAssigned += 1;
      stats.taskTypeBreakdown[task.type].count += 1; // This is where count is incremented
      stats.taskTypeBreakdown[task.type].points += memberPoints; // This is where points are added
    });
  });

  const sortedMembers = Array.from(memberStats.entries())
    .filter(([memberId]) => {
      if (selectedDivision === "all") return true;
      return memberCategoryMap[memberId] === selectedDivision;
    })
    .sort((a, b) => b[1].points - a[1].points);

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => {
    if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
      return t.columnId === "done-graphics";
    } else if (isGraphicMotionTaskType(t.type)) {
      return t.columnId === "final";
    }
    return false;
  }).length;
  const totalPoints = project.tasks.reduce((sum, t) => sum + t.points, 0);

  const renderTaskTypeStatCard = (type: TaskType, stats: { total: number; completed: number; inProgress: number }) => (
    <Card key={type} className="glass p-4">
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

  const renderBreakdownBadge = (type: TaskType, breakdown: { count: number; points: number }) => (
    <div key={type} className="glass-dark p-2 rounded">
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

  const renderMemberCard = (member: { 
    id: string; // Added id to member type for getMemberDivision
    name: string; 
    tasksAssigned: number;
    points: number;
    taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
  }, index: number) => {
    const memberDivision = getMemberDivision(member.id); // Get the member's division

    const graphicMotionBreakdowns: [TaskType, { count: number; points: number }][] = [];
    const graphicOnlyBreakdowns: [TaskType, { count: number; points: number }][] = [];
    const decorBreakdowns: [TaskType, { count: number; points: number }][] = [];

    for (const type in member.taskTypeBreakdown) {
      const breakdown = member.taskTypeBreakdown[type as TaskType];
      if (breakdown.count > 0) {
        if (isGraphicMotionTaskType(type as TaskType)) {
          graphicMotionBreakdowns.push([type as TaskType, breakdown]);
        } else if (isGraphicOnlyTaskType(type as TaskType)) {
          graphicOnlyBreakdowns.push([type as TaskType, breakdown]);
        } else if (isDecorTaskType(type as TaskType)) {
          decorBreakdowns.push([type as TaskType, breakdown]);
        }
      }
    }

    const hasAnyBreakdown = graphicMotionBreakdowns.length > 0 || 
                            (memberDivision === "graphic" && (graphicOnlyBreakdowns.length > 0 || decorBreakdowns.length > 0));

    return (
      <Card key={member.id} className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {index < 3 && (
                <Badge
                  variant={index === 0 ? "default" : "secondary"}
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                >
                  #{index + 1}
                </Badge>
              )}
              {index >= 3 && (
                <span className="text-muted-foreground w-8 text-center">#{index + 1}</span>
              )}
              <Avatar>
                <AvatarFallback className="glass">
                  {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-muted-foreground">
                {member.tasksAssigned} tasks assigned
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-sm text-muted-foreground">Points</p>
              <p className="text-lg font-bold text-primary">{member.points.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        {/* Task Type Breakdown for this member */}
        {hasAnyBreakdown ? (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
              <span>Task Type Breakdown</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {/* Graphic-Motion Breakdown */}
              {graphicMotionBreakdowns.length > 0 ? (
                <div>
                  <h5 className="text-sm font-semibold text-primary mb-2">Graphic-Motion Tasks</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {graphicMotionBreakdowns.map(([type, breakdown]) => renderBreakdownBadge(type as TaskType, breakdown))}
                  </div>
                </div>
              ) : (
                <div className="glass-dark p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-sm font-medium">No Graphic-Motion tasks assigned to this member yet.</p>
                </div>
              )}

              {/* Graphic Only Breakdown (only for graphic members) */}
              {memberDivision === "graphic" && (
                graphicOnlyBreakdowns.length > 0 ? (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Graphic Only Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {graphicOnlyBreakdowns.map(([type, breakdown]) => renderBreakdownBadge(type as TaskType, breakdown))}
                    </div>
                  </div>
                ) : (
                  <div className="glass-dark p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-sm font-medium">No Graphic Only tasks assigned to this member yet.</p>
                  </div>
                )
              )}

              {/* Decor Breakdown (only for graphic members) */}
              {memberDivision === "graphic" && (
                decorBreakdowns.length > 0 ? (
                  <div>
                    <h5 className="text-sm font-semibold text-primary mb-2">Decor Tasks</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {decorBreakdowns.map(([type, breakdown]) => renderBreakdownBadge(type as TaskType, breakdown))}
                    </div>
                  </div>
                ) : (
                  <div className="glass-dark p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-sm font-medium">No Decor tasks assigned to this member yet.</p>
                  </div>
                )
              )}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-2 border-t border-border/50">No tasks assigned to this member yet.</p>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Performance Analytics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                </div>
              </div>
            </Card>

            <Card className="glass p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{totalPoints.toFixed(1)}</p>
                </div>
              </div>
            </Card> {/* Added missing closing tag for the Card component */}

            <Card className="glass p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Task Type Statistics */}
          <div className="glass p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Task Type Statistics
            </h3>

            {/* Graphic-Motion Tasks */}
            {Object.keys(categorizedProjectTaskTypeStats.graphicMotion).some(type => 
              isGraphicMotionTaskType(type as TaskType) && categorizedProjectTaskTypeStats.graphicMotion[type as TaskType].total > 0
            ) ? (
              <div className="mb-6">
                <h4 className="font-semibold text-md mb-3 text-primary">Task Type Graphic-Motion</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categorizedProjectTaskTypeStats.graphicMotion).map(([type, stats]) => {
                    if (stats.total === 0) return null;
                    return renderTaskTypeStatCard(type as TaskType, stats);
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-dark p-6 rounded-lg text-center mb-6">
                <p className="text-muted-foreground text-lg font-medium">No Graphic-Motion tasks in this project yet.</p>
              </div>
            )}

            {/* Graphic Only Tasks */}
            {Object.keys(categorizedProjectTaskTypeStats.graphicOnly).some(type => 
              isGraphicOnlyTaskType(type as TaskType) && categorizedProjectTaskTypeStats.graphicOnly[type as TaskType].total > 0
            ) ? (
              <div className="mb-6">
                <h4 className="font-semibold text-md mb-3 text-primary">Task Type Graphic Only</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categorizedProjectTaskTypeStats.graphicOnly).map(([type, stats]) => {
                    if (stats.total === 0) return null;
                    return renderTaskTypeStatCard(type as TaskType, stats);
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-dark p-6 rounded-lg text-center mb-6">
                <p className="text-muted-foreground text-lg font-medium">No Graphic Only tasks in this project yet.</p>
              </div>
            )}

            {/* Decor Tasks */}
            {Object.keys(categorizedProjectTaskTypeStats.decor).some(type => 
              isDecorTaskType(type as TaskType) && categorizedProjectTaskTypeStats.decor[type as TaskType].total > 0
            ) ? (
              <div className="mb-6">
                <h4 className="font-semibold text-md mb-3 text-primary">Task Type Decor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categorizedProjectTaskTypeStats.decor).map(([type, stats]) => {
                    if (stats.total === 0) return null;
                    return renderTaskTypeStatCard(type as TaskType, stats);
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-dark p-6 rounded-lg text-center mb-6">
                <p className="text-muted-foreground text-lg font-medium">No Decor tasks in this project yet.</p>
              </div>
            )}

            {/* Empty state for project task type stats */}
            {Object.values(categorizedProjectTaskTypeStats.graphicMotion).every(stats => stats.total === 0) &&
             Object.values(categorizedProjectTaskTypeStats.graphicOnly).every(stats => stats.total === 0) &&
             Object.values(categorizedProjectTaskTypeStats.decor).every(stats => stats.total === 0) && (
              <div className="glass-dark p-6 rounded-lg text-center col-span-full">
                <p className="text-muted-foreground text-lg font-medium">No tasks available for project statistics.</p>
              </div>
            )}
          </div>

          {/* Member Leaderboard */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Member Leaderboard
            </h3>
            <Tabs value={selectedDivision} onValueChange={(value) => setSelectedDivision(value as "all" | "graphic" | "motion" | "music")} className="mb-4">
              <TabsList className="grid w-full grid-cols-4 glass">
                <TabsTrigger value="all" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                <TabsTrigger value="graphic" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Graphic</TabsTrigger>
                <TabsTrigger value="motion" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Motion</TabsTrigger>
                <TabsTrigger value="music" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Music</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {sortedMembers.length > 0 ? (
                sortedMembers.map(([memberId, stats], index) => {
                  return renderMemberCard({ ...stats, id: memberId }, index); // Pass memberId to renderMemberCard
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No member activity yet for this division.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}