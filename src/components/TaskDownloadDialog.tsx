import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Project, Task } from "@/lib/types";
import { Download, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints"; // Import task type helpers

interface TaskDownloadDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: "motion" | "graphics";
}

export function TaskDownloadDialog({ project, open, onOpenChange, division }: TaskDownloadDialogProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const [graphicMotionTasks, setGraphicMotionTasks] = useState<Task[]>([]);
  const [graphicOnlyTasks, setGraphicOnlyTasks] = useState<Task[]>([]);
  const [decorTasks, setDecorTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!project || !open) return;

    // Sort by creation date (oldest first)
    const allFilteredTasks = project.tasks.filter(task => {
      if (division === "graphics") {
        return (isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type) || isGraphicMotionTaskType(task.type)) && task.assignedGraphic.length > 0;
      } else if (division === "motion") {
        return isGraphicMotionTaskType(task.type) && task.assignedMotion.length > 0;
      }
      return false;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    setGraphicMotionTasks(allFilteredTasks.filter(task => isGraphicMotionTaskType(task.type)));
    setGraphicOnlyTasks(allFilteredTasks.filter(task => isGraphicOnlyTaskType(task.type)));
    setDecorTasks(allFilteredTasks.filter(task => isDecorTaskType(task.type)));

  }, [project, open, division]);

  const getStatusColorClass = (task: Task, currentDivision: "motion" | "graphics") => {
    const columnId = task.columnId;

    if (currentDivision === "graphics") {
      if (isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)) {
        // Specific rules for Graphic Only/Decor tasks
        if (["todo-graphics", "wip-graphics"].includes(columnId)) {
          return "bg-red-500 text-white"; // Merah
        } else if (["qc-graphics", "revision-graphics"].includes(columnId)) {
          return "bg-yellow-500 text-black"; // Kuning
        } else if (columnId === "done-graphics") {
          return "bg-green-500 text-white"; // Hijau
        }
      } else if (isGraphicMotionTaskType(task.type)) {
        // Existing rules for Graphic-Motion tasks (graphics part)
        if (["todo-graphics", "wip-graphics"].includes(columnId)) {
          return "bg-red-500 text-white";
        } else if (["qc-graphics", "revision-graphics"].includes(columnId)) {
          return "bg-yellow-500 text-black";
        } else if (["done-graphics", "todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(columnId)) {
          return "bg-green-500 text-white";
        }
      }
    } else if (currentDivision === "motion") {
      if (isGraphicMotionTaskType(task.type)) {
        // Existing rules for Graphic-Motion tasks (motion part)
        if (["todo-graphics", "wip-graphics", "qc-graphics", "revision-graphics", "done-graphics", "todo-motion", "wip-motion"].includes(columnId)) {
          return "bg-red-500 text-white";
        } else if (["qc-motion", "revision-motion"].includes(columnId)) {
          return "bg-yellow-500 text-black";
        } else if (columnId === "final") {
          return "bg-green-500 text-white";
        }
      }
    }
    return "bg-gray-500 text-white"; // Default for unhandled or irrelevant columns
  };

  const handleDownloadImage = async () => {
    if (taskListRef.current) {
      try {
        const canvas = await html2canvas(taskListRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: document.documentElement.classList.contains('dark') ? '#161b22' : '#f8f9fa',
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `${project.title}-${division}-tasks.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Task list downloaded as image!");
      } catch (error) {
        console.error("Error downloading task list as image:", error);
        toast.error("Failed to download image. Please try again.");
      }
    }
  };

  const renderTaskList = (tasks: Task[], title: string) => {
    if (tasks.length === 0) {
      return <p className="text-muted-foreground text-center py-2">No {title.toLowerCase()} tasks.</p>;
    }
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="glass-dark p-3 rounded-lg">
          <div className="grid grid-cols-[30px_1fr] gap-0 items-center text-sm font-bold text-muted-foreground border-b border-border/50 pb-2 mb-2">
            <span>#</span>
            <span>Task Title</span>
          </div>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={task.id} className="grid grid-cols-[30px_1fr] gap-0 items-center text-sm">
                <span className="text-muted-foreground">{index + 1}.</span>
                <span className={cn("font-medium p-1 rounded", getStatusColorClass(task, division))}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const allFilteredTasksCount = graphicMotionTasks.length + graphicOnlyTasks.length + decorTasks.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ListChecks className="h-6 w-6 text-primary" />
            Task List for "{project.title}" ({division === "graphics" ? "Graphics" : "Motion"})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div ref={taskListRef} className="p-4 space-y-4 bg-background rounded-lg">
            <h2 className="text-xl font-bold text-center mb-4">
              {project.title} - {division === "graphics" ? "Graphics" : "Motion"} Tasks
            </h2>
            
            {division === "graphics" ? (
              <>
                {renderTaskList(graphicMotionTasks, "Task Type Graphic-Motion")}
                {renderTaskList(graphicOnlyTasks, "Task Type Graphic Only")}
                {renderTaskList(decorTasks, "Task Type Decor")}
                {allFilteredTasksCount === 0 && (
                  <p className="text-muted-foreground text-center py-4">No graphics tasks in this project yet.</p>
                )}
              </>
            ) : (
              renderTaskList(graphicMotionTasks, "Motion Tasks")
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleDownloadImage}
            variant="gradient" // Menggunakan varian gradient
            className="btn-gradient-effect" // Menerapkan efek gradient
          >
            <Download className="h-4 w-4 mr-2" />
            Download as Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}