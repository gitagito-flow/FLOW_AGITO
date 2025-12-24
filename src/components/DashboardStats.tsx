
import React from "react";
import { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, CheckCircle2, Clock, CalendarDays, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType } from "@/lib/taskPoints";
import { differenceInDays } from "date-fns";

interface DashboardStatsProps {
    projects: Project[];
}

export function DashboardStats({ projects }: DashboardStatsProps) {
    const stats = React.useMemo(() => {
        const totalProjects = projects.length;

        // Helper to check status (reusing logic from Dashboard.tsx essentially)
        const getProjectStatus = (project: Project) => {
            if (project.tasks.length === 0) return "in-progress"; // Default to in-progress if empty

            const completedTasks = project.tasks.filter((t) => {
                if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
                    return t.columnId === "done-graphics";
                } else if (isGraphicMotionTaskType(t.type)) {
                    return t.columnId === "final";
                }
                return false;
            }).length;

            return completedTasks === project.tasks.length ? "completed" : "in-progress";
        };

        const completed = projects.filter(p => getProjectStatus(p) === "completed").length;
        const inProgress = totalProjects - completed;

        // Calculate upcoming deadlines (e.g., within next 7 days) across all ACTIVE projects
        const upcomingEvents = projects.filter(p => {
            if (getProjectStatus(p) === "completed") return false;
            const days = differenceInDays(new Date(p.eventStartDate), new Date());
            return days >= 0 && days <= 7;
        }).length;

        return {
            total: totalProjects,
            completed,
            inProgress,
            upcomingEvents
        };
    }, [projects]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="glass hover:glass-dark transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Projects
                    </CardTitle>
                    <FolderKanban className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Active and archived
                    </p>
                </CardContent>
            </Card>

            <Card className="glass hover:glass-dark transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        In Progress
                    </CardTitle>
                    <Clock className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Currently active
                    </p>
                </CardContent>
            </Card>

            <Card className="glass hover:glass-dark transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completed
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Successfully delivered
                    </p>
                </CardContent>
            </Card>

            <Card className="glass hover:glass-dark transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Start This Week
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{stats.upcomingEvents}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Events starting soon
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
