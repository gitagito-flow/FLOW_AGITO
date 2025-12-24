import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project, TaskType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Award, Users, FolderKanban, ListChecks, ChevronDown, CalendarDays, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMemberById, getMemberDivision, allTeams, graphicTeams, motionTeams, musicTeam } from "@/lib/teams";
import { 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { toast } from "sonner"; // Perbaikan: Menambahkan 'from'
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes"; // Import useTheme

// Import new sub-components
import { TaskTypeStatCard } from "./analytics/TaskTypeStatCard";
import { TaskTypeBreakdownBadge } from "./analytics/TaskTypeBreakdownBadge";
import { MemberPerformanceCard } from "./analytics/MemberPerformanceCard";
import { TeamInvolvementCard } from "./analytics/TeamInvolvementCard";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Import Table components

interface GlobalPerformanceAnalyticsProps {
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

interface TeamInvolvementStats {
  id: string;
  name: string;
  projectCount: number;
  division: "graphic" | "motion" | "music";
  totalPoints: number;
  taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
}

const PIE_CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 
  'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))',
  '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1', '#f5f5f5'
];

export function GlobalPerformanceAnalytics({ projects, open, onOpenChange }: GlobalPerformanceAnalyticsProps) {
  const { theme } = useTheme(); // Get current theme
  const [memberStats, setMemberStats] = useState<MemberGlobalStats[]>([]);
  const [teamInvolvement, setTeamInvolvement] = useState<TeamInvolvementStats[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "teams">("overview");
  const [activeProjectTypeTab, setActiveProjectTypeTab] = useState<"all" | "Project" | "Pitching">("all");
  const [taskTypeDistribution, setTaskTypeDistribution] = useState<{ name: TaskType; value: number }[]>([]);
  const [categorizedGlobalTaskTypeStats, setCategorizedGlobalTaskTypeStats] = useState<{
    graphicMotion: Record<TaskType, { total: number; completed: number; inProgress: number }>;
    graphicOnly: Record<TaskType, { total: number; completed: number; inProgress: number }>;
    decor: Record<TaskType, { total: number; completed: number; inProgress: number }>;
  }>(() => ({
    graphicMotion: initializeTaskTypeStats(),
    graphicOnly: initializeTaskTypeStats(),
    decor: initializeTaskTypeStats(),
  }));
  const [projectStatusChartData, setProjectStatusChartData] = useState<{ name: string; count: number; }[]>([]);
  const [projectListTableData, setProjectListTableData] = useState<
    { id: string; title: string; type: Project["type"]; progress: number; status: "Completed" | "In Progress" | "To Do" }[]
  >([]);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateRangePreset, setDateRangePreset] = useState<string>("all");

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

  useEffect(() => {
    if (!open || !projects.length) {
      setMemberStats([]);
      setTeamInvolvement([]);
      setTaskTypeDistribution([]);
      setCategorizedGlobalTaskTypeStats({
        graphicMotion: initializeTaskTypeStats(),
        graphicOnly: initializeTaskTypeStats(),
        decor: initializeTaskTypeStats(),
      });
      setProjectStatusChartData([]);
      setProjectListTableData([]);
      return;
    }

    const filteredProjects = projects.filter(p => {
      if (activeProjectTypeTab !== "all" && p.type !== activeProjectTypeTab) return false;

      const projectDate = new Date(p.createdAt);
      if (startDate && projectDate < startDate) return false;
      if (endDate && projectDate > addDays(endDate, 1)) return false;

      return true;
    });

    const aggregatedMemberStats = new Map<string, Omit<MemberGlobalStats, 'projectsInvolvedCount' | 'initials' | 'division' | 'taskTypeBreakdown'> & { 
      projectsInvolved: Set<string>;
      taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
    }>();
    const aggregatedTeamInvolvement = new Map<string, { 
      count: number; 
      division: "graphic" | "motion" | "music"; 
      points: number;
      taskTypeBreakdown: Record<TaskType, { count: number; points: number }>;
    }>();

    const initializeTaskTypeBreakdown = () => ({
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
    });

    allTeams.forEach(team => {
      const division = getMemberDivision(team.members[0]?.id || "") || "graphic";
      aggregatedTeamInvolvement.set(team.id, { 
        count: 0, 
        division, 
        points: 0,
        taskTypeBreakdown: initializeTaskTypeBreakdown(),
      });
    });

    const currentTaskTypeCounts: Record<TaskType, number> = {
      "CLIP": 0, "PRESENTATION": 0, "BUMPER": 0, "BACKGROUND": 0, "MINOR_ITEMS_ANIMATION": 0,
      "BRANDING": 0, "ADVERTISING": 0, "MICROSITE_UI_DESIGN": 0, "DIGITAL_MEDIA": 0,
      "PRINTED_MEDIA_MINOR_DESIGN": 0, "PRINTED_INFORMATION": 0, "PRINTED_DECORATION": 0,
      "CUTTING_MAL_RESIZE": 0,
    };

    const tempGraphicMotionTaskStats = initializeTaskTypeStats();
    const tempGraphicOnlyTaskStats = initializeTaskTypeStats();
    const tempDecorTaskStats = initializeTaskTypeStats();

    let completedProjectsCount = 0;
    let inProgressProjectsCount = 0;

    const projectTableData = filteredProjects.map(p => {
      const totalTasksInProject = p.tasks.length;
      const completedTasksInProject = p.tasks.filter((t) => {
          if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
              return t.columnId === "done-graphics";
          } else if (isGraphicMotionTaskType(t.type)) {
              return t.columnId === "final";
          }
          return false;
      }).length;

      const progressPercentage = totalTasksInProject > 0 ? Math.round((completedTasksInProject / totalTasksInProject) * 100) : 0;

      let status: "Completed" | "In Progress" | "To Do" = "To Do";
      if (totalTasksInProject > 0) {
          if (completedTasksInProject === totalTasksInProject) {
              status = "Completed";
          } else if (completedTasksInProject > 0 || p.tasks.some(t => !t.columnId.startsWith("todo-"))) {
              status = "In Progress";
          }
      }

      // Update project status counts for the chart
      if (status === "Completed") {
        completedProjectsCount++;
      } else if (status === "In Progress") {
        inProgressProjectsCount++;
      }

      return {
          id: p.id,
          title: p.title,
          type: p.type,
          progress: progressPercentage,
          status: status,
      };
    });
    setProjectListTableData(projectTableData);


    filteredProjects.forEach(project => {
      const involvedTeamIdsForProject = new Set<string>();
      project.graphicTeams.forEach(teamId => involvedTeamIdsForProject.add(teamId));
      project.motionTeams.forEach(teamId => involvedTeamIdsForProject.add(teamId));
      project.musicTeams.forEach(teamId => involvedTeamIdsForProject.add(teamId));

      involvedTeamIdsForProject.forEach(teamId => {
        const current = aggregatedTeamInvolvement.get(teamId);
        if (current) {
          aggregatedTeamInvolvement.set(teamId, { ...current, count: current.count + 1 });
        }
      });

      project.tasks.forEach(task => {
        currentTaskTypeCounts[task.type]++;

        let targetStats: Record<TaskType, { total: number; completed: number; inProgress: number }>;
        if (isGraphicMotionTaskType(task.type)) {
          targetStats = tempGraphicMotionTaskStats;
        } else if (isGraphicOnlyTaskType(task.type)) {
          targetStats = tempGraphicOnlyTaskStats;
        } else if (isDecorTaskType(task.type)) {
          targetStats = tempDecorTaskStats;
        } else {
          return;
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

        // --- REVISED LOGIC FOR TEAM TASK BREAKDOWN ---
        const teamsInvolvedInThisTask = new Set<string>();

        // Check graphic teams
        project.graphicTeams.forEach(projectTeamId => {
            const team = graphicTeams.find(t => t.id === projectTeamId);
            if (team && team.members.some(member => task.assignedGraphic.includes(member.id))) {
                teamsInvolvedInThisTask.add(projectTeamId);
            }
        });

        // Check motion teams
        project.motionTeams.forEach(projectTeamId => {
            const team = motionTeams.find(t => t.id === projectTeamId);
            if (team && team.members.some(member => task.assignedMotion.includes(member.id))) {
                teamsInvolvedInThisTask.add(projectTeamId);
            }
        });

        // Check music team
        if (project.musicTeams.includes(musicTeam.id) && musicTeam.members.some(member => task.assignedMusic.includes(member.id))) {
            teamsInvolvedInThisTask.add(musicTeam.id);
        }

        teamsInvolvedInThisTask.forEach(teamId => {
            const teamStats = aggregatedTeamInvolvement.get(teamId);
            if (teamStats) {
                teamStats.taskTypeBreakdown[task.type].count += 1;
                teamStats.taskTypeBreakdown[task.type].points += task.points;
            }
        });
        // --- END REVISED LOGIC FOR TEAM TASK BREAKDOWN ---

        task.memberAssignments.forEach(assignment => {
          const memberId = assignment.memberId;
          const member = getMemberById(memberId);

          if (!member) return;

          if (!aggregatedMemberStats.has(memberId)) {
            aggregatedMemberStats.set(memberId, {
              id: memberId,
              name: member.name,
              totalPoints: 0,
              tasksAssigned: 0,
              projectsInvolved: new Set<string>(),
              taskTypeBreakdown: initializeTaskTypeBreakdown(),
            });
          }

          const stats = aggregatedMemberStats.get(memberId)!;
          const memberPoints = task.points * (assignment.percentage / 100);
          stats.totalPoints += memberPoints;
          stats.tasksAssigned += 1;
          stats.projectsInvolved.add(project.id);
          stats.taskTypeBreakdown[task.type].count += 1; // Correct for member's breakdown
          stats.taskTypeBreakdown[task.type].points += memberPoints; // Correct for member's breakdown

          // This part is for the team's *totalPoints* (sum of memberPoints), which is fine.
          const memberDivision = getMemberDivision(memberId);
          let memberTeamId: string | undefined;
          if (memberDivision === "graphic") {
              memberTeamId = graphicTeams.find(team => team.members.some(m => m.id === memberId))?.id;
          } else if (memberDivision === "motion") {
              memberTeamId = motionTeams.find(team => team.members.some(m => m.id === memberId))?.id;
          } else if (memberDivision === "music") {
              memberTeamId = musicTeam.members.some(m => m.id === memberId) ? musicTeam.id : undefined;
          }

          if (memberTeamId) {
              const teamStats = aggregatedTeamInvolvement.get(memberTeamId);
              if (teamStats) {
                  teamStats.points += memberPoints; // This is for the team's *totalPoints*
              }
          }
        });
      });
    });

    const chartData = Object.entries(currentTaskTypeCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        name: type as TaskType,
        value: count,
      }));
    setTaskTypeDistribution(chartData);
    setCategorizedGlobalTaskTypeStats({
      graphicMotion: tempGraphicMotionTaskStats,
      graphicOnly: tempGraphicOnlyTaskStats,
      decor: tempDecorTaskStats,
    });

    setProjectStatusChartData([
      { name: 'Total Projects', count: filteredProjects.length },
      { name: 'Completed', count: completedProjectsCount },
      { name: 'In Progress', count: inProgressProjectsCount },
    ]);

    const finalMemberStats: MemberGlobalStats[] = Array.from(aggregatedMemberStats.values()).map(stats => ({
      ...stats,
      initials: getMemberById(stats.id)?.initials || "",
      division: getMemberDivision(stats.id),
      projectsInvolvedCount: stats.projectsInvolved.size,
    }));
    setMemberStats(finalMemberStats);

    const finalTeamInvolvement: TeamInvolvementStats[] = Array.from(aggregatedTeamInvolvement.entries()).map(([teamId, data]) => {
      const team = allTeams.find(t => t.id === teamId);
      return {
        id: teamId,
        name: team?.name || teamId,
        projectCount: data.count,
        division: data.division,
        totalPoints: data.points,
        taskTypeBreakdown: data.taskTypeBreakdown,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
    setTeamInvolvement(finalTeamInvolvement);

  }, [open, projects, activeProjectTypeTab, startDate, endDate]);

  const handleDateRangePresetChange = (value: string) => {
    setDateRangePreset(value);
    const today = new Date();
    switch (value) {
      case "all":
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      case "today":
        setStartDate(today);
        setEndDate(today);
        break;
      case "last7days":
        setStartDate(subDays(today, 6));
        setEndDate(today);
        break;
      case "thismonth":
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case "lastmonth":
        setStartDate(startOfMonth(subDays(today, 30)));
        setEndDate(endOfMonth(subDays(today, 30)));
        break;
      case "thisyear":
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
        break;
      default:
        break;
    }
  };

  const filteredProjectsForOverview = projects.filter(p => {
    if (activeProjectTypeTab !== "all" && p.type !== activeProjectTypeTab) return false;
    const projectDate = new Date(p.createdAt);
    if (startDate && projectDate < startDate) return false;
    if (endDate && projectDate > addDays(endDate, 1)) return false;
    return true;
  });

  const totalProjects = filteredProjectsForOverview.length;
  const totalTasks = filteredProjectsForOverview.reduce((sum, p) => sum + p.tasks.length, 0);
  const overallTotalPoints = memberStats.reduce((sum, m) => sum + m.totalPoints, 0);

  // Calculate global completed tasks for progress
  const globalCompletedTasks = filteredProjectsForOverview.reduce((sum, p) => {
    return sum + p.tasks.filter(t => {
      if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
        return t.columnId === "done-graphics";
      } else if (isGraphicMotionTaskType(t.type)) {
        return t.columnId === "final";
      }
      return false;
    }).length;
  }, 0);

  const globalProgress = totalTasks > 0 ? Math.round((globalCompletedTasks / totalTasks) * 100) : 0;


  const sortedMembersByPoints = [...memberStats].sort((a, b) => b.totalPoints - a.totalPoints);

  const topGraphicMembers = sortedMembersByPoints.filter(m => m.division === "graphic").slice(0, 5);
  const topMotionMembers = sortedMembersByPoints.filter(m => m.division === "motion").slice(0, 5);
  const topMusicMembers = sortedMembersByPoints.filter(m => m.division === "music").slice(0, 5);

  const graphicTeamInvolvement = teamInvolvement.filter(team => graphicTeams.some(gt => gt.id === team.id));
  const motionTeamInvolvement = teamInvolvement.filter(team => motionTeams.some(mt => mt.id === team.id));
  const musicTeamInvolvement = teamInvolvement.filter(team => musicTeam.id === team.id);

  // Helper function to format a value for CSV
  const formatCsvValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    // Check if the value contains a comma, double quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escape internal double quotes by doubling them, then enclose in double quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Helper function to export data to CSV
  const exportToCsv = (filename: string, rows: any[]) => {
    if (rows.length === 0) {
      toast.info("No data to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.map(formatCsvValue).join(','), // Format headers
      ...rows.map(row => headers.map(fieldName => formatCsvValue(row[fieldName])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`'${filename}' downloaded successfully!`);
    } else {
      toast.error("Your browser does not support downloading files directly.");
    }
  };

  const handleExportMembersCsv = () => {
    const dataToExport = sortedMembersByPoints.map(member => ({
      "Member ID": member.id,
      "Name": member.name,
      "Division": member.division,
      "Total Points": member.totalPoints.toFixed(1),
      "Tasks Assigned": member.tasksAssigned,
      "Projects Involved": member.projectsInvolvedCount,
    }));
    exportToCsv("member_performance.csv", dataToExport);
  };

  const handleExportTeamsCsv = () => {
    const dataToExport = teamInvolvement.map(team => ({
      "Team ID": team.id,
      "Team Name": team.name,
      "Division": team.division,
      "Projects Involved": team.projectCount,
      "Total Points": team.totalPoints.toFixed(1),
    }));
    exportToCsv("team_involvement.csv", dataToExport);
  };

  const projectItems = projectListTableData.filter(p => p.type === "Project");
  const pitchingItems = projectListTableData.filter(p => p.type === "Pitching");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="glass max-w-4xl max-h-[90vh] overflow-y-auto 
                   fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" // Explicit centering
      >
        {theme === 'dark' && (
          <div 
            className="absolute inset-0 -z-10 rounded-lg overflow-hidden" 
            style={{
              backgroundImage: 'url(/analytics-bg-dark.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15, 
            }}
          />
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Global Performance Analytics
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Select value={dateRangePreset} onValueChange={handleDateRangePresetChange}>
            <SelectTrigger className="glass flex-1">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
              <SelectItem value="thisyear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker
            date={startDate}
            setDate={setStartDate}
            placeholder="Start Date"
            className="flex-1"
          />
          <DatePicker
            date={endDate}
            setDate={setEndDate}
            placeholder="End Date"
            className="flex-1"
          />
        </div>

        <Tabs value={activeProjectTypeTab} onValueChange={(value) => setActiveProjectTypeTab(value as "all" | "Project" | "Pitching")} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="all" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Projects</TabsTrigger>
            <TabsTrigger value="Project" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Projects</TabsTrigger>
            <TabsTrigger value="Pitching" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pitching</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "members" | "teams")} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="overview" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="members" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Members</TabsTrigger>
            <TabsTrigger value="teams" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass p-4 flex items-center gap-3">
                <FolderKanban className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                </div>
              </Card>
              <Card className="glass p-4 flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
              </Card>
              <Card className="glass p-4 flex items-center gap-3">
                <Award className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{overallTotalPoints.toFixed(1)}</p>
                </div>
              </Card>
              <Card className="glass p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">
                    {globalProgress}%
                  </p>
                </div>
              </Card>
            </div>

            {/* Project Status Chart */}
            <div className="glass p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Project Status Overview
              </h3>
              {projectStatusChartData.length > 0 && projectStatusChartData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={projectStatusChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--glass-bg))', 
                        backdropFilter: 'blur(10px)', 
                        border: '1px solid hsl(var(--glass-border))',
                        boxShadow: 'var(--glass-shadow)',
                        borderRadius: '0.5rem'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No project data available for status overview.</p>
                </div>
              )}
            </div>

            {/* Global Task Type Statistics */}
            <div className="glass p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Global Task Type Statistics
              </h3>

              {/* Graphic-Motion Tasks */}
              {Object.keys(categorizedGlobalTaskTypeStats.graphicMotion).some(type => 
                isGraphicMotionTaskType(type as TaskType) && categorizedGlobalTaskTypeStats.graphicMotion[type as TaskType].total > 0
              ) ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-md mb-3 text-primary">Task Type Graphic-Motion</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categorizedGlobalTaskTypeStats.graphicMotion).map(([type, stats]) => {
                      if (stats.total === 0) return null;
                      return <TaskTypeStatCard key={type} type={type as TaskType} stats={stats} />;
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center mb-6">
                  <p className="text-muted-foreground text-lg font-medium">No Graphic-Motion tasks in this project yet.</p>
                </div>
              )}

              {/* Graphic Only Tasks */}
              {Object.keys(categorizedGlobalTaskTypeStats.graphicOnly).some(type => 
                isGraphicOnlyTaskType(type as TaskType) && categorizedGlobalTaskTypeStats.graphicOnly[type as TaskType].total > 0
              ) ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-md mb-3 text-primary">Task Type Graphic Only</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categorizedGlobalTaskTypeStats.graphicOnly).map(([type, stats]) => {
                      if (stats.total === 0) return null;
                      return <TaskTypeStatCard key={type} type={type as TaskType} stats={stats} />;
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center mb-6">
                  <p className="text-muted-foreground text-lg font-medium">No Graphic Only tasks in this project yet.</p>
                </div>
              )}

              {/* Decor Tasks */}
              {Object.keys(categorizedGlobalTaskTypeStats.decor).some(type => 
                isDecorTaskType(type as TaskType) && categorizedGlobalTaskTypeStats.decor[type as TaskType].total > 0
              ) ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-md mb-3 text-primary">Task Type Decor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categorizedGlobalTaskTypeStats.decor).map(([type, stats]) => {
                      if (stats.total === 0) return null;
                      return <TaskTypeStatCard key={type} type={type as TaskType} stats={stats} />;
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center mb-6">
                  <p className="text-muted-foreground text-lg font-medium">No Decor tasks in this project yet.</p>
                </div>
              )}

              {/* Empty state for project task type stats */}
              {Object.values(categorizedGlobalTaskTypeStats.graphicMotion).every(stats => stats.total === 0) &&
               Object.values(categorizedGlobalTaskTypeStats.graphicOnly).every(stats => stats.total === 0) &&
               Object.values(categorizedGlobalTaskTypeStats.decor).every(stats => stats.total === 0) && (
                <div className="glass-dark p-6 rounded-lg text-center col-span-full">
                  <p className="text-muted-foreground text-lg font-medium">No tasks available for project statistics.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-4 space-y-6">
            <div className="flex justify-end">
              <Button 
                onClick={handleExportMembersCsv} 
                variant="gradient" // Menggunakan varian gradient
                className="btn-gradient-effect" // Menerapkan efek gradient
                disabled={sortedMembersByPoints.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Members CSV
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Graphic Team Members
              </h3>
              {topGraphicMembers.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topGraphicMembers.map(m => ({ name: m.name, points: parseFloat(m.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {topGraphicMembers.map((member, index) => <MemberPerformanceCard key={member.id} member={member} index={index} pieChartColors={PIE_CHART_COLORS} />)}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No graphic team members with activity.</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Top Motion Team Members
              </h3>
              {topMotionMembers.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topMotionMembers.map(m => ({ name: m.name, points: parseFloat(m.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {topMotionMembers.map((member, index) => <MemberPerformanceCard key={member.id} member={member} index={index} pieChartColors={PIE_CHART_COLORS} />)}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No motion team members with activity.</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Top Music Team Members
              </h3>
              {topMusicMembers.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topMusicMembers.map(m => ({ name: m.name, points: parseFloat(m.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--accent))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {topMusicMembers.map((member, index) => <MemberPerformanceCard key={member.id} member={member} index={index} pieChartColors={PIE_CHART_COLORS} />)}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No music team members with activity.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-4 space-y-6">
            <div className="flex justify-end">
              <Button 
                onClick={handleExportTeamsCsv} 
                variant="gradient" // Menggunakan varian gradient
                className="btn-gradient-effect" // Menerapkan efek gradient
                disabled={teamInvolvement.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Teams CSV
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Graphic Teams Involvement
              </h3>
              {graphicTeamInvolvement.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={graphicTeamInvolvement.map(t => ({ name: t.name, points: parseFloat(t.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {graphicTeamInvolvement.map((team, index) => {
                      const fullTeam = allTeams.find(t => t.id === team.id);
                      if (!fullTeam) return null;
                      return <TeamInvolvementCard key={team.id} title="Graphic Teams Involvement" team={team} fullTeamMembers={fullTeam.members} index={index} />;
                    })}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No graphic team involvement data.</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Motion Teams Involvement
              </h3>
              {motionTeamInvolvement.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={motionTeamInvolvement.map(t => ({ name: t.name, points: parseFloat(t.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {motionTeamInvolvement.map((team, index) => {
                      const fullTeam = allTeams.find(t => t.id === team.id);
                      if (!fullTeam) return null;
                      return <TeamInvolvementCard key={team.id} title="Motion Teams Involvement" team={team} fullTeamMembers={fullTeam.members} index={index} />;
                    })}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No motion team involvement data.</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Music Team Involvement
              </h3>
              {musicTeamInvolvement.length > 0 ? (
                <>
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50">
                      <span>Points Distribution Chart</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 glass-dark p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={musicTeamInvolvement.map(t => ({ name: t.name, points: parseFloat(t.totalPoints.toFixed(1)) }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--glass-bg))',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid hsl(var(--glass-border))',
                              boxShadow: 'var(--glass-shadow)',
                              borderRadius: '0.5rem'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Bar dataKey="points" fill="hsl(var(--accent))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-3">
                    {musicTeamInvolvement.map((team, index) => {
                      const fullTeam = allTeams.find(t => t.id === team.id);
                      if (!fullTeam) return null;
                      return <TeamInvolvementCard key={team.id} title="Music Teams Involvement" team={team} fullTeamMembers={fullTeam.members} index={index} />;
                    })}
                  </div>
                </>
              ) : (
                <div className="glass-dark p-6 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No music team involvement data.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}