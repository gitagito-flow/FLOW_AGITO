import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Info, LogOut, FolderKanban, User, BarChart3, Filter, ArrowDownWideNarrow, Edit, Trash2, ArrowRight, Users, CalendarDays, Archive, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiquidBackground } from "@/components/LiquidBackground";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog"; // Jalur impor diperbaiki
import { EmptyState } from "@/components/EmptyState";
import { getCurrentUserName } from "@/lib/storage";
import { Project } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { GlobalPerformanceAnalytics } from "@/components/GlobalPerformanceAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType } from "@/lib/taskPoints";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, differenceInDays, isPast, getMonth, isSameDay } from "date-fns"; // Menambahkan isSameDay
import { useNavigate } from "react-router-dom";
import { getTeamById, allTeams } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { MonthlyCalendarPanel } from "@/components/MonthlyCalendarPanel";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { GlobalConcernPanel } from "@/components/GlobalConcernPanel";
import { CurrentlyWorkingPanel } from "@/components/CurrentlyWorkingPanel";
import { DashboardStats } from "@/components/DashboardStats";
import { useAuth } from "@/components/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Legacy state for projects
  const { data: projects = [], refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getAll()
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  // Removed showUserConfig state as it is replaced by AuthContext
  const [showGlobalAnalytics, setShowGlobalAnalytics] = useState(false);
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [showGlobalConcerns, setShowGlobalConcerns] = useState(false);
  const [showCurrentlyWorking, setShowCurrentlyWorking] = useState(false);
  const [isDashboardSidebarExpanded, setIsDashboardSidebarExpanded] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<"all" | number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [teamFilter, setTeamFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<"title" | "eventStartDate" | "eventEndDate" | "createdAt">("eventStartDate");

  const navigate = useNavigate();

  // Removed useEffect for legacy user name check

  const getProjectStatus = (project: Project) => {
    if (project.tasks.length === 0) return "in-progress";

    const completedTasks = project.tasks.filter((t) => {
      if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
        return t.columnId === "done-graphics";
      } else if (isGraphicMotionTaskType(t.type)) {
        return t.columnId === "final";
      }
      return false;
    }).length;

    if (completedTasks === project.tasks.length) {
      return "completed";
    }
    return "in-progress";
  };

  const calculateProjectProgress = (project: Project) => {
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) return 0;

    const completedTasks = project.tasks.filter((t) => {
      if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
        return t.columnId === "done-graphics";
      } else if (isGraphicMotionTaskType(t.type)) {
        return t.columnId === "final";
      }
      return false;
    }).length;

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const calculateDaysUntilEvent = (eventStartDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
    const startDate = new Date(eventStartDate);
    startDate.setHours(0, 0, 0, 0); // Normalize event start date to start of day

    const days = differenceInDays(startDate, today);
    return days;
  };

  // New helper to determine if a project should be considered "Done" (archived)
  const isProjectDone = (project: Project) => {
    const status = getProjectStatus(project);
    const eventEndDate = new Date(project.eventEndDate);
    const today = new Date();
    // A project is considered "done" if all tasks are completed
    // AND its event end date is today or in the past.
    return status === "completed" && (isSameDay(eventEndDate, today) || isPast(eventEndDate));
  };

  const filteredAndSortedProjects = useMemo(() => {
    let currentProjects = projects;

    // Separate active and done projects first
    const activeProjects = currentProjects.filter(p => !isProjectDone(p));
    const doneProjects = currentProjects.filter(p => isProjectDone(p));

    // Apply filters and sorting only to active projects
    let filteredActiveProjects = activeProjects;

    if (searchQuery) {
      filteredActiveProjects = filteredActiveProjects.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // New month and year filter logic
    if (selectedMonth !== "all") {
      const targetMonth = selectedMonth; // 0-11 for Jan-Dec
      filteredActiveProjects = filteredActiveProjects.filter(p => {
        const startDate = new Date(p.eventStartDate);
        const endDate = new Date(p.eventEndDate);
        return getMonth(startDate) === targetMonth || getMonth(endDate) === targetMonth;
      });
    }

    if (selectedYear !== "all") {
      filteredActiveProjects = filteredActiveProjects.filter(p => {
        const startYear = new Date(p.eventStartDate).getFullYear().toString();
        const endYear = new Date(p.eventEndDate).getFullYear().toString();
        return startYear === selectedYear || endYear === selectedYear;
      })
    }

    if (teamFilter !== "all") {
      filteredActiveProjects = filteredActiveProjects.filter((p) =>
        p.graphicTeams.includes(teamFilter) ||
        p.motionTeams.includes(teamFilter) ||
        p.musicTeams.includes(teamFilter)
      );
    }

    filteredActiveProjects.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "eventEndDate") {
        return new Date(a.eventEndDate).getTime() - new Date(b.eventEndDate).getTime();
      } else if (sortBy === "eventStartDate") {
        return new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime();
      } else if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    // Sort done projects by eventEndDate (oldest first)
    doneProjects.sort((a, b) => new Date(a.eventEndDate).getTime() - new Date(b.eventEndDate).getTime());

    return {
      active: filteredActiveProjects,
      done: doneProjects,
    };
  }, [projects, searchQuery, selectedMonth, teamFilter, sortBy]);

  const projectItems = filteredAndSortedProjects.active.filter(p => p.type === "Project");
  const pitchingItems = filteredAndSortedProjects.active.filter(p => p.type === "Pitching");

  const doneProjectItems = filteredAndSortedProjects.done.filter(p => p.type === "Project");
  const donePitchingItems = filteredAndSortedProjects.done.filter(p => p.type === "Pitching");

  const totalProjects = projects.length;
  const completedProjectsCount = projects.filter(p => getProjectStatus(p) === "completed").length;

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditDialog(true);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      await projectApi.update(updatedProject.id, updatedProject);
      refetch();
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error("Failed to update project");
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (deleteProjectId) {
      try {
        await projectApi.delete(deleteProjectId);
        refetch();
        toast.success("Project deleted successfully");
      } catch (error) {
        toast.error("Failed to delete project");
        console.error(error);
      }
      setDeleteProjectId(null);
    }
  };



  // Define a set of colors for team badges
  const TEAM_BADGE_COLORS = [
    "bg-blue-500/20 text-blue-500",
    "bg-green-500/20 text-green-500",
    "bg-purple-500/20 text-purple-500",
    "bg-orange-500/20 text-orange-500",
    "bg-pink-500/20 text-pink-500",
    "bg-teal-500/20 text-teal-500",
    "bg-indigo-500/20 text-indigo-500",
    "bg-red-500/20 text-red-500",
    "bg-yellow-500/20 text-yellow-500",
    "bg-cyan-500/20 text-cyan-500",
    "bg-lime-500/20 text-lime-500",
  ];

  // Function to get a consistent color class for a given team ID
  const getTeamBadgeClass = (teamId: string) => {
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TEAM_BADGE_COLORS.length;
    return TEAM_BADGE_COLORS[index];
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    // Add current year by default so it's always an option
    years.add(new Date().getFullYear().toString());

    projects.forEach(p => {
      if (p.eventStartDate) years.add(new Date(p.eventStartDate).getFullYear().toString());
      if (p.eventEndDate) years.add(new Date(p.eventEndDate).getFullYear().toString());
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [projects]);


  const renderProjectTable = (projectsToRender: Project[], title: string, icon: React.ElementType, isDonePanel: boolean = false) => (
    <div className="glass p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {React.createElement(icon, { className: `h-5 w-5 ${isDonePanel ? 'text-success' : 'text-primary'}` })}
          {title}
        </h2>
        {/* Removed the Create Project button from here */}
      </div>

      {projectsToRender.length > 0 ? (
        <ScrollArea className="h-full"> {/* Changed height to h-full */}
          <Table>
            <TableHeader className="rounded-t-lg overflow-hidden">
              <TableRow className="bg-transparent">
                <TableHead className="w-[50px] rounded-tl-lg">No</TableHead>
                <TableHead className="w-[120px]">Start Date</TableHead>
                <TableHead className="w-[120px]">End Date</TableHead>
                <TableHead className="w-[200px]">Nama Project</TableHead>
                <TableHead className="w-[150px]">Team Event</TableHead>
                <TableHead className="w-[150px]">Team Grafis</TableHead>
                <TableHead className="w-[150px]">Team Animasi</TableHead>
                <TableHead className="w-[120px]">Progress</TableHead>
                <TableHead className="w-[100px]">H-Days</TableHead>
                <TableHead className="text-right w-[150px] rounded-tr-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsToRender.map((project, index) => {
                const progress = calculateProjectProgress(project);
                const daysUntilEvent = calculateDaysUntilEvent(project.eventStartDate); // Use eventStartDate
                const projectIsDone = isProjectDone(project); // Check if the project is done

                return (
                  <TableRow key={project.id} className="hover:glass-dark transition-colors">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{project.eventStartDate ? format(new Date(project.eventStartDate), "dd MMM yyyy") : "-"}</TableCell>
                    <TableCell>{project.eventEndDate ? format(new Date(project.eventEndDate), "dd MMM yyyy") : "-"}</TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.eventTeamName || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.graphicTeams.length > 0 ?
                          project.graphicTeams.map(teamId => {
                            const team = getTeamById(teamId);
                            return team ? (
                              <Badge key={teamId} className={getTeamBadgeClass(teamId)}>
                                {team.name.replace("TEAM ", "")}
                              </Badge>
                            ) : null;
                          }) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.motionTeams.length > 0 ?
                          project.motionTeams.map(teamId => {
                            const team = getTeamById(teamId);
                            return team ? (
                              <Badge key={teamId} className={getTeamBadgeClass(teamId)}>
                                {team.name.replace("TEAM ", "")}
                              </Badge>
                            ) : null;
                          }) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full border-2 border-border/50">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm text-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs font-semibold",
                          projectIsDone && "bg-success/20 text-success", // Green for Done
                          !projectIsDone && daysUntilEvent > 7 && "bg-success/20 text-success",
                          !projectIsDone && daysUntilEvent <= 7 && daysUntilEvent >= 0 && "bg-orange-500/20 text-orange-500",
                          !projectIsDone && daysUntilEvent < 0 && "bg-destructive/20 text-destructive"
                        )}
                      >
                        {projectIsDone ? "Done" : (daysUntilEvent >= 0 ? `H-${daysUntilEvent} Days` : "Event Started")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="glass hover:glass-dark"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditProject(project)}
                          className="hover:glass-dark"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteProjectId(project.id)}
                          className="hover:glass-dark text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={`No ${title} Found`}
          description={`There are no ${title.toLowerCase()} that match the criteria.`}
          actionLabel={!isDonePanel ? "Create Project" : undefined}
          onAction={!isDonePanel ? () => setShowCreateDialog(true) : undefined}
        />
      )}
    </div>
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen relative flex">
      <LiquidBackground />

      {/* Dashboard Sidebar */}
      <DashboardSidebar
        onCalendarOpen={() => setShowMonthlyCalendar(true)}
        onAnalyticsOpen={() => setShowGlobalAnalytics(true)}
        onActivityLogOpen={() => navigate("/activity-log")}
        onCurrentlyWorkingOpen={() => setShowCurrentlyWorking(true)}
        onGlobalConcernsOpen={() => setShowGlobalConcerns(true)}

        // onUserConfigOpen={() => setShowUserConfig(true)} // Removed
        onLogout={() => {
          logout();
          navigate("/login");
          toast.success("Logged out successfully");
        }}
        onCreateProjectOpen={() => setShowCreateDialog(true)} // Pass the handler here
        userName={user?.name || "Guest"}
        isExpanded={isDashboardSidebarExpanded}
        onToggleExpand={() => setIsDashboardSidebarExpanded(!isDashboardSidebarExpanded)}
      />

      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        isDashboardSidebarExpanded ? "ml-64" : "ml-16"
      )}>
        <header className="glass sticky top-0 z-50 border-b border-border/50">
          <div className="container mx-auto px-6 py-4">
            {/* Top Row: Logo and User/Theme Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Flow Logo" className="h-8 w-8" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Flow
                </h1>
              </div>

              {/* Removed redundant buttons from header */}
              <div className="flex items-center gap-3">
                {/* <ThemeToggle /> <-- REMOVED */}
              </div>
            </div>

            {/* Bottom Row: Search, Filters, and Action Buttons */}
            <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(value === "all" ? "all" : parseInt(value, 10))}>
                  <SelectTrigger className="glass w-full sm:w-[150px] hover:glass-dark hover:scale-[1.02] transition-transform">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Month">
                      {selectedMonth === "all" ? "All Months" : months[selectedMonth]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>{monthName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="glass w-full sm:w-[120px] hover:glass-dark hover:scale-[1.02] transition-transform">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Year" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={teamFilter} onValueChange={(value: "all" | string) => setTeamFilter(value)}>
                  <SelectTrigger className="glass w-full sm:w-[180px] hover:glass-dark hover:scale-[1.02] transition-transform">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Team" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="all">All Teams</SelectItem>
                    {allTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: "title" | "eventStartDate" | "eventEndDate" | "createdAt") => setSortBy(value)}>
                  <SelectTrigger className="glass w-full sm:w-[180px] hover:glass-dark hover:scale-[1.02] transition-transform">
                    <ArrowDownWideNarrow className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="createdAt">Newest First</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="eventStartDate">Event Start Date</SelectItem>
                    <SelectItem value="eventEndDate">Event End Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons Group (Removed Create Project button from here) */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto md:justify-end">
                {/* Placeholder for alignment if needed, but keeping it empty */}
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow-y-auto to main */}
          <div className="container mx-auto h-full">

            {/* Dashboard Stats Widgets */}
            <DashboardStats projects={[...filteredAndSortedProjects.active, ...filteredAndSortedProjects.done]} />

            {filteredAndSortedProjects.active.length === 0 && filteredAndSortedProjects.done.length === 0 ? (
              searchQuery || selectedMonth !== "all" || selectedYear !== "all" || teamFilter !== "all" ? (
                <EmptyState
                  icon={Search}
                  title="No Projects Found"
                  description="No projects match your current filters. Try adjusting them."
                />
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title="No Projects Yet"
                  description="Start by creating your first project to manage your workflow"
                  actionLabel="Create Project"
                  onAction={() => setShowCreateDialog(true)}
                />
              )
            ) : (
              <div className="space-y-8 h-full"> {/* Added h-full here */}
                {/* Projects Table */}
                {projectItems.length > 0 && renderProjectTable(projectItems, "Projects", FolderKanban)}

                {/* Pitching Table */}
                {pitchingItems.length > 0 && renderProjectTable(pitchingItems, "Pitching", FolderKanban)}

                {/* Done Projects Table */}
                {doneProjectItems.length > 0 && renderProjectTable(doneProjectItems, "Done Projects", Archive, true)}

                {/* Done Pitching Table */}
                {donePitchingItems.length > 0 && renderProjectTable(donePitchingItems, "Done Pitching", Archive, true)}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Project Overview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center p-4 glass rounded-lg">
              <span className="text-muted-foreground">Total Projects</span>
              <span className="text-2xl font-bold">{totalProjects}</span>
            </div>
            <div className="flex justify-between items-center p-4 glass rounded-lg">
              <span className="text-muted-foreground">Completed</span>
              <span className="text-2xl font-bold text-success">{completedProjectsCount}</span>
            </div>
            <div className="flex justify-between items-center p-4 glass rounded-lg">
              <span className="text-muted-foreground">In Progress</span>
              <span className="text-2xl font-bold text-primary">
                {totalProjects - completedProjectsCount}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={() => refetch()}
      />

      <EditProjectDialog
        project={selectedProject}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onProjectUpdate={handleUpdateProject}
      />

      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and will delete all tasks and data associated with this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      <GlobalPerformanceAnalytics
        projects={projects}
        open={showGlobalAnalytics}
        onOpenChange={setShowGlobalAnalytics}
      />

      <MonthlyCalendarPanel
        open={showMonthlyCalendar}
        onOpenChange={setShowMonthlyCalendar}
        projects={projects}
      />

      <GlobalConcernPanel
        open={showGlobalConcerns}
        onOpenChange={setShowGlobalConcerns}
        onProjectUpdate={(updatedProject) => {
          handleUpdateProject(updatedProject);
          // Refetch handled inside handleUpdateProject
        }}
      />

      <CurrentlyWorkingPanel
        open={showCurrentlyWorking}
        onOpenChange={setShowCurrentlyWorking}
      />
    </div>
  );
}