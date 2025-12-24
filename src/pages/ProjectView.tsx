import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, List, LayoutGrid } from "lucide-react";
import { getProjectById, updateProject } from "@/lib/storage";
import { Task, Project, ColumnId, TaskType } from "@/lib/types";
import { columns } from "@/lib/columns";
import { BoardColumn } from "@/components/BoardColumn";
import { LiquidBackground } from "@/components/LiquidBackground";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { PerformanceAnalytics } from "@/components/PerformanceAnalytics";
import { ProjectInfoDialog } from "@/components/ProjectInfoDialog";
import { ConcernPanel } from "@/components/ConcernPanel";
import { TaskDownloadDialog } from "@/components/TaskDownloadDialog";
import { getMemberById, getProjectMembers } from "@/lib/teams";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType, taskTypes } from "@/lib/taskPoints";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKanbanBoard } from "@/components/MobileKanbanBoard";
import { cn } from "@/lib/utils";
import { LeftSidebar } from "@/components/LeftSidebar";
import { TaskListView } from "@/components/TaskListView"; // Import new component

type ViewMode = "kanban" | "list";

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [showConcernPanel, setShowConcernPanel] = useState(false);
  const [showGraphicDownloadDialog, setShowGraphicDownloadDialog] = useState(false);
  const [showMotionDownloadDialog, setshowMotionDownloadDialog] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>("kanban"); // New state for view mode

  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | TaskType>("all");
  const [assignedMemberFilter, setAssignedMemberFilter] = useState<"all" | string>("all");

  const isMobile = useIsMobile();

  useEffect(() => {
    if (id) {
      const loadedProject = getProjectById(id);
      if (loadedProject) {
        // Migrate old 'deadline' to 'eventEndDate' if 'eventStartDate' is missing
        if (!(loadedProject as any).eventStartDate && (loadedProject as any).deadline) {
          loadedProject.eventStartDate = (loadedProject as any).deadline; // Use old deadline as start date
          loadedProject.eventEndDate = (loadedProject as any).deadline; // Use old deadline as end date
          delete (loadedProject as any).deadline; // Remove old field
          updateProject(loadedProject); // Save migrated project
        } else if (!(loadedProject as any).eventStartDate && !loadedProject.eventEndDate) {
          // If both are missing, set to current date as a fallback
          const now = new Date().toISOString();
          loadedProject.eventStartDate = now;
          loadedProject.eventEndDate = now;
          updateProject(loadedProject);
        }

        if (!loadedProject.concerns) {
          loadedProject.concerns = [];
        }
        setProject(loadedProject);
      } else {
        toast.error("Project not found");
        navigate("/dashboard");
      }
    }
  }, [id, navigate]);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !project) return;

    const activeTaskId = active.id as string;
    
    let overColumnId: ColumnId | null = null;
    
    if (columns.some(col => col.id === over.id)) {
      overColumnId = over.id as ColumnId;
    } else {
      const overTask = project.tasks.find((t) => t.id === over.id);
      if (overTask) {
        overColumnId = overTask.columnId;
      }
    }

    if (!overColumnId) return;

    const activeTask = project.tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    if ((isGraphicOnlyTaskType(activeTask.type) || isDecorTaskType(activeTask.type)) && 
        (overColumnId === "todo-motion" || overColumnId === "wip-motion" || overColumnId === "qc-motion" || overColumnId === "revision-motion" || overColumnId === "final")) {
      toast.error("Graphic Only/Decor tasks cannot move past 'DONE (Graphics)'.");
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !project) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTask = project.tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    let destinationColumnId: ColumnId;
    let overTask: Task | undefined;

    if (columns.some(col => col.id === overId)) {
      destinationColumnId = overId as ColumnId;
    } else {
      overTask = project.tasks.find((t) => t.id === overId);
      if (!overTask) return;
      destinationColumnId = overTask.columnId;
    }

    if ((isGraphicOnlyTaskType(activeTask.type) || isDecorTaskType(activeTask.type)) && 
        (destinationColumnId === "todo-motion" || destinationColumnId === "wip-motion" || destinationColumnId === "qc-motion" || destinationColumnId === "revision-motion" || destinationColumnId === "final")) {
      toast.error("Graphic Only/Decor tasks cannot move past 'DONE (Graphics)'.");
      setProject(getProjectById(project.id) || null); 
      return;
    }

    if (activeTask.columnId === destinationColumnId && activeTaskId === overId) {
        return;
    }

    let updatedTasks: Task[] = [];

    if (activeTask.columnId === destinationColumnId) {
        const tasksInSameColumn = project.tasks.filter(t => t.columnId === destinationColumnId);
        const oldIndexInColumn = tasksInSameColumn.findIndex(t => t.id === activeTaskId);
        const newIndexInColumn = tasksInSameColumn.findIndex(t => t.id === overId);

        if (oldIndexInColumn === -1 || newIndexInColumn === -1) {
            return;
        }

        const reorderedColumnTasks = arrayMove(tasksInSameColumn, oldIndexInColumn, newIndexInColumn);
        
        updatedTasks = project.tasks.filter(t => t.columnId !== destinationColumnId);
        updatedTasks.push(...reorderedColumnTasks);

    } else {
        const tasksFromOldColumn = project.tasks.filter(t => t.columnId === activeTask.columnId && t.id !== activeTaskId);
        const tasksInNewColumn = project.tasks.filter(t => t.columnId === destinationColumnId);

        const newIndexInNewColumn = overTask ? tasksInNewColumn.findIndex(t => t.id === overId) : tasksInNewColumn.length;

        const movedTask = { ...activeTask, columnId: destinationColumnId };
        
        updatedTasks = project.tasks.filter(t => t.columnId !== activeTask.columnId && t.columnId !== destinationColumnId);
        updatedTasks.push(...tasksFromOldColumn);
        
        tasksInNewColumn.splice(newIndexInNewColumn, 0, movedTask);
        updatedTasks.push(...tasksInNewColumn);
    }

    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
    updateProject(updatedProject);
  };

  const handleMoveTask = (taskId: string, direction: 'left' | 'right') => {
    if (!project) return;

    const taskToMove = project.tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    const currentColumnIndex = columns.findIndex(col => col.id === taskToMove.columnId);
    if (currentColumnIndex === -1) return;

    let newColumnIndex = currentColumnIndex;
    if (direction === 'left') {
      newColumnIndex = Math.max(0, currentColumnIndex - 1);
    } else {
      newColumnIndex = Math.min(columns.length - 1, currentColumnIndex + 1);
    }

    const newColumnId = columns[newColumnIndex].id;

    const isGraphicOnlyOrDecor = isGraphicOnlyTaskType(taskToMove.type) || isDecorTaskType(taskToMove.type);
    const isMovingIntoMotionOrFinal = ["todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(newColumnId);

    if (isGraphicOnlyOrDecor && isMovingIntoMotionOrFinal) {
      toast.error("Graphic Only/Decor tasks cannot move past 'DONE (Graphics)'.");
      return;
    }

    if (newColumnIndex === currentColumnIndex) {
      return;
    }

    const updatedTasks = project.tasks.map(task => 
      task.id === taskId ? { ...task, columnId: newColumnId } : task
    );

    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
    updateProject(updatedProject);
    toast.success(`Task "${taskToMove.title}" moved to ${columns[newColumnIndex].title}`);
  };

  const handleTaskCreate = (task: Task) => {
    if (!project) return;
    const updatedProject = { ...project, tasks: [...project.tasks, task] };
    setProject(updatedProject);
    updateProject(updatedProject);
    setCreateTaskDialogOpen(false);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (!project) return;
    const updatedTasks = project.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
    updateProject(updatedProject);
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskId: string) => {
    if (!project) return;
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
    updateProject(updatedProject);
  };

  const handleProjectUpdateFromConcernPanel = (updatedProject: Project) => {
    setProject(updatedProject);
    updateProject(updatedProject);
  };

  const allProjectMembers = useMemo(() => {
    if (!project) return [];
    const members = getProjectMembers(project);
    return [...members.graphic, ...members.motion, ...members.music];
  }, [project]);

  const filteredTasks = useMemo(() => {
    if (!project) return [];
    let currentTasks = project.tasks;

    if (searchQuery) {
      currentTasks = currentTasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (taskTypeFilter !== "all") {
      currentTasks = currentTasks.filter((task) => task.type === taskTypeFilter);
    }

    if (assignedMemberFilter !== "all") {
      currentTasks = currentTasks.filter((task) => 
        task.assignedGraphic.includes(assignedMemberFilter) ||
        task.assignedMotion.includes(assignedMemberFilter) ||
        task.assignedMusic.includes(assignedMemberFilter)
      );
    }

    return currentTasks;
  }, [project, searchQuery, taskTypeFilter, assignedMemberFilter]);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LiquidBackground />
        <div className="glass p-8 rounded-2xl flex flex-col items-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-secondary border-b-transparent rounded-full animate-spin" style={{ animationDelay: "150ms" }} />
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  const completedTasks = project.tasks.filter((t) => {
    if (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) {
      return t.columnId === "done-graphics";
    } else if (isGraphicMotionTaskType(t.type)) {
      return t.columnId === "final";
    }
    return false;
  }).length;
  
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="h-screen relative flex">
      <LiquidBackground />

      {/* Left Sidebar */}
      <LeftSidebar
        onBackToDashboard={() => navigate("/dashboard")}
        onProjectInfoOpen={() => setProjectInfoOpen(true)}
        onAnalyticsOpen={() => setAnalyticsOpen(true)}
        onGraphicDownloadOpen={() => setShowGraphicDownloadDialog(true)}
        onMotionDownloadOpen={() => setshowMotionDownloadDialog(true)}
        onConcernPanelOpen={() => setShowConcernPanel(true)}
        onCreateTaskOpen={() => setCreateTaskDialogOpen(true)}
        onDailyActivityLogOpen={() => navigate("/activity-log", { state: { projectId: project.id } })}
        isExpanded={isLeftSidebarExpanded}
        onToggleExpand={() => setIsLeftSidebarExpanded(!isLeftSidebarExpanded)}
      />

      {/* Main content wrapper */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out overflow-x-hidden",
        isLeftSidebarExpanded ? "ml-64" : "ml-16",
        // Removed showCurrentlyWorkingSidebar ? "lg:mr-80" : ""
      )}>
        <header className={cn(
          "glass sticky top-0 z-50 border-b border-border/50 transition-all duration-300 ease-in-out"
        )}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <img src="/logo.png" alt="Flow Logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Flow
                </h1>
                <span className="text-xl font-semibold text-foreground ml-2">
                  | {project.title}
                </span>
                
                {/* Search Input and Filters, aligned with title */}
                <div className="flex items-center gap-3 ml-4 mt-2 md:mt-0 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass"
                    />
                  </div>
                  <Select value={taskTypeFilter} onValueChange={(value: "all" | TaskType) => setTaskTypeFilter(value)}>
                    <SelectTrigger className="glass w-[150px] hover:glass-dark hover:scale-[1.02] transition-transform">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Task Type" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Task Types</SelectItem>
                      {taskTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={assignedMemberFilter} onValueChange={(value: "all" | string) => setAssignedMemberFilter(value)}>
                    <SelectTrigger className="glass w-[150px] hover:glass-dark hover:scale-[1.02] transition-transform">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Member" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="all">All Members</SelectItem>
                      {allProjectMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* View Mode Toggle Button MODIFIED HERE */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
                    className={cn(
                      "w-[150px] h-10 px-3 py-2 text-sm font-medium transition-all duration-200",
                      viewMode === "list" 
                        ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/50" // Soft blue for active list view
                        : "glass hover:glass-dark" // Default glass for kanban view
                    )}
                  >
                    {viewMode === "kanban" ? (
                      <>
                        <List className="h-4 w-4 mr-2" />
                        List View
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Kanban View
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Removed the empty div that used to hold the button */}
            </div>

            <div className="mt-3 glass p-2 rounded-lg">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Project Progress</span>
                  <span className="text-xs text-muted-foreground">({completedTasks} of {totalTasks} tasks completed)</span>
                </div>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <main className={cn(
          "px-6 py-4 flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          // Removed showCurrentlyWorkingSidebar ? "lg:mr-80" : ""
        )}>
          <div className="container mx-auto h-full pb-0">
            {viewMode === "list" ? (
              <TaskListView 
                tasks={filteredTasks} 
                onTaskClick={handleTaskClick} 
              />
            ) : isMobile ? (
              <MobileKanbanBoard
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onMoveTask={handleMoveTask}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              />
            ) : (
              <DndContext
                collisionDetection={closestCorners}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="overflow-x-auto pb-0 h-full">
                  <div
                    className="flex gap-4 h-full"
                  >
                    {columns.map((column) => {
                      const columnTasks = filteredTasks.filter((task) => task.columnId === column.id);
                      const currentColumnIndex = columns.findIndex(col => col.id === column.id);
                      const isFirstColumn = currentColumnIndex === 0;
                      const isLastColumn = currentColumnIndex === columns.length - 1;

                      return (
                        <BoardColumn
                          key={column.id}
                          id={column.id}
                          title={column.title}
                          tasks={columnTasks}
                          onTaskClick={handleTaskClick}
                          onMoveTask={handleMoveTask}
                          isFirstColumn={isFirstColumn}
                          isLastColumn={isLastColumn}
                        />
                      );
                    })}
                  </div>
                </div>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog project={project} onTaskCreate={handleTaskCreate} open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen} />
      <TaskDetailDialog
        project={project} 
        task={selectedTask}
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />

      <PerformanceAnalytics
        project={project}
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />

      <ProjectInfoDialog
        project={project}
        open={projectInfoOpen}
        onOpenChange={setProjectInfoOpen}
      />

      {project && (
        <ConcernPanel
          project={project}
          open={showConcernPanel}
          onOpenChange={setShowConcernPanel}
          onProjectUpdate={handleProjectUpdateFromConcernPanel}
        />
      )}

      {project && (
        <TaskDownloadDialog
          project={project}
          open={showGraphicDownloadDialog}
          onOpenChange={setShowGraphicDownloadDialog}
          division="graphics"
        />
      )}
      {project && (
        <TaskDownloadDialog
          project={project}
          open={showMotionDownloadDialog}
          onOpenChange={setshowMotionDownloadDialog}
          division="motion"
        />
      )}
    </div>
  );
}