import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi, taskApi } from "@/lib/api";
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
import { getProjectMembers } from "@/lib/teams";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType, taskTypes } from "@/lib/taskPoints";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Search, Filter, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKanbanBoard } from "@/components/MobileKanbanBoard";
import { cn } from "@/lib/utils";
import { LeftSidebar } from "@/components/LeftSidebar";
import { TaskListView } from "@/components/TaskListView";

type ViewMode = "kanban" | "list";

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [showConcernPanel, setShowConcernPanel] = useState(false);
  const [showGraphicDownloadDialog, setShowGraphicDownloadDialog] = useState(false);
  const [showMotionDownloadDialog, setShowMotionDownloadDialog] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | TaskType>("all");
  const [assignedMemberFilter, setAssignedMemberFilter] = useState<"all" | string>("all");

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id!),
    enabled: !!id
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string, columnId: string }) => taskApi.move(taskId, columnId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] })
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !project) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    
    let destinationColumnId: ColumnId;
    if (columns.some(col => col.id === overId)) {
      destinationColumnId = overId as ColumnId;
    } else {
      const overTask = project.tasks.find(t => t.id === overId);
      if (!overTask) return;
      destinationColumnId = overTask.columnId;
    }

    const task = project.tasks.find(t => t.id === taskId);
    if (!task || task.columnId === destinationColumnId) return;

    if ((isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)) && 
        ["todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(destinationColumnId)) {
      toast.error("Graphic Only/Decor tasks cannot move past 'DONE (Graphics)'.");
      return;
    }

    try {
      await moveTaskMutation.mutateAsync({ taskId, columnId: destinationColumnId });
      toast.success("Task moved");
    } catch (e) {
      toast.error("Failed to move task");
    }
  };

  const handleMoveTask = async (taskId: string, direction: 'left' | 'right') => {
    if (!project) return;
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = columns.findIndex(col => col.id === task.columnId);
    const newIndex = direction === 'left' ? Math.max(0, currentIndex - 1) : Math.min(columns.length - 1, currentIndex + 1);
    const newColumnId = columns[newIndex].id;

    if (newColumnId === task.columnId) return;

    if ((isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)) && 
        ["todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(newColumnId)) {
      toast.error("Graphic Only tasks restricted to Graphics stages.");
      return;
    }

    await moveTaskMutation.mutateAsync({ taskId, columnId: newColumnId });
  };

  const filteredTasks = useMemo(() => {
    if (!project) return [];
    let list = project.tasks;
    if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (taskTypeFilter !== "all") list = list.filter(t => t.type === taskTypeFilter);
    if (assignedMemberFilter !== "all") list = list.filter(t => [...t.assignedGraphic, ...t.assignedMotion, ...t.assignedMusic].includes(assignedMemberFilter));
    return list;
  }, [project, searchQuery, taskTypeFilter, assignedMemberFilter]);

  if (isLoading || !project) return <div className="flex h-screen items-center justify-center"><LiquidBackground /><p>Loading project...</p></div>;

  const totalTasks = project.tasks.length;
  const completedCount = project.tasks.filter(t => (isGraphicOnlyTaskType(t.type) || isDecorTaskType(t.type)) ? t.columnId === "done-graphics" : t.columnId === "final").length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="h-screen relative flex">
      <LiquidBackground />
      <LeftSidebar
        onBackToDashboard={() => navigate("/dashboard")}
        onProjectInfoOpen={() => setProjectInfoOpen(true)}
        onAnalyticsOpen={() => setAnalyticsOpen(true)}
        onGraphicDownloadOpen={() => setShowGraphicDownloadDialog(true)}
        onMotionDownloadOpen={() => setShowMotionDownloadDialog(true)}
        onConcernPanelOpen={() => setShowConcernPanel(true)}
        onCreateTaskOpen={() => setCreateTaskDialogOpen(true)}
        onDailyActivityLogOpen={() => navigate("/activity-log", { state: { projectId: project.id } })}
        isExpanded={isLeftSidebarExpanded}
        onToggleExpand={() => setIsLeftSidebarExpanded(!isLeftSidebarExpanded)}
      />

      <div className={cn("flex flex-col flex-1 transition-all duration-300", isLeftSidebarExpanded ? "ml-64" : "ml-16")}>
        <header className="glass sticky top-0 z-50 border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="h-8 w-8" alt="logo" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Flow | {project.title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 glass" />
              <Select value={taskTypeFilter} onValueChange={(v: any) => setTaskTypeFilter(v)}>
                <SelectTrigger className="glass w-[150px]"><SelectValue placeholder="Task Type" /></SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="all">All Types</SelectItem>
                  {taskTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")} className="glass">
                {viewMode === "kanban" ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />} {viewMode === "kanban" ? "List" : "Kanban"}
              </Button>
            </div>
          </div>
          <div className="mt-3 glass p-2 rounded-lg">
            <div className="flex justify-between text-xs mb-1"><span>Progress ({completedCount}/{totalTasks})</span><span>{progress}%</span></div>
            <div className="h-1 bg-muted rounded-full"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-auto">
          {viewMode === "list" ? <TaskListView tasks={filteredTasks} onTaskClick={(t) => { setSelectedTask(t); setTaskDetailOpen(true); }} /> : (
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 h-full">
                {columns.map(col => (
                  <BoardColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tasks={filteredTasks.filter(t => t.columnId === col.id)}
                    onTaskClick={(t) => { setSelectedTask(t); setTaskDetailOpen(true); }}
                    onMoveTask={handleMoveTask}
                    isFirstColumn={col.id === columns[0].id}
                    isLastColumn={col.id === columns[columns.length - 1].id}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </main>
      </div>

      <CreateTaskDialog project={project} open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen} onTaskCreate={() => queryClient.invalidateQueries({ queryKey: ['project', id] })} />
      <TaskDetailDialog project={project} task={selectedTask} open={taskDetailOpen} onOpenChange={setTaskDetailOpen} onTaskUpdate={() => queryClient.invalidateQueries({ queryKey: ['project', id] })} onTaskDelete={() => queryClient.invalidateQueries({ queryKey: ['project', id] })} />
      <PerformanceAnalytics project={project} open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
      <ProjectInfoDialog project={project} open={projectInfoOpen} onOpenChange={setProjectInfoOpen} />
      <ConcernPanel project={project} open={showConcernPanel} onOpenChange={setShowConcernPanel} onProjectUpdate={() => queryClient.invalidateQueries({ queryKey: ['project', id] })} />
    </div>
  );
}