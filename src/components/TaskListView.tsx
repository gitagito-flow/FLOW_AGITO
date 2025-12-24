import { Task, Project, ColumnId } from "@/lib/types";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ListChecks } from "lucide-react";
import { getMemberById } from "@/lib/teams";
import { columns as allColumns } from "@/lib/columns";
import { cn } from "@/lib/utils";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType } from "@/lib/taskPoints";
import { useMemo } from "react";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const getStatusTitle = (columnId: ColumnId) => {
  return allColumns.find(col => col.id === columnId)?.title || columnId.replace(/-/g, ' ');
};

const getMemberFirstName = (memberId: string) => {
  const member = getMemberById(memberId);
  if (!member) return "Unknown";
  return member.name.split(" ")[0];
};

// Helper function to determine the color class based on task type and column ID
const getStatusColorClass = (taskType: Task["type"], columnId: ColumnId) => {
  if (isGraphicOnlyTaskType(taskType) || isDecorTaskType(taskType)) {
    if (["todo-graphics", "wip-graphics"].includes(columnId)) {
      return "bg-destructive/20 text-destructive border-destructive/50";
    } else if (["qc-graphics", "revision-graphics"].includes(columnId)) {
      return "bg-accent/20 text-accent border-accent/50";
    } else if (columnId === "done-graphics") {
      return "bg-success/20 text-success border-success/50";
    }
  } else if (isGraphicMotionTaskType(taskType)) {
    if (["todo-graphics", "wip-graphics", "todo-motion", "wip-motion"].includes(columnId)) {
      return "bg-destructive/20 text-destructive border-destructive/50";
    } else if (["qc-graphics", "revision-graphics", "qc-motion", "revision-motion"].includes(columnId)) {
      return "bg-accent/20 text-accent border-accent/50";
    } else if (columnId === "final") {
      return "bg-success/20 text-success border-success/50";
    } else if (columnId === "done-graphics") {
      return "bg-primary/20 text-primary border-primary/50"; 
    }
  }
  
  return "bg-muted/50 text-muted-foreground border-muted-foreground/50";
};

// NEW: Helper function to get color class for Task Type badge
const getTaskTypeBadgeColorClass = (taskType: Task["type"]) => {
  if (isGraphicMotionTaskType(taskType)) {
    return "bg-blue-500/20 text-blue-500"; // Biru untuk Graphic-Motion
  } else if (isGraphicOnlyTaskType(taskType)) {
    return "bg-green-500/20 text-green-500"; // Hijau untuk Graphic Only
  } else if (isDecorTaskType(taskType)) {
    return "bg-orange-500/20 text-orange-500"; // Oranye untuk Decor
  }
  return "bg-muted/50 text-muted-foreground"; // Default
};

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  const groupedTasks = useMemo(() => {
    const groups: {
      'Graphic-Motion': Task[];
      'Graphic Only': Task[];
      'Decor': Task[];
    } = {
      'Graphic-Motion': [],
      'Graphic Only': [],
      'Decor': [],
    };

    // 1. Group tasks by category
    tasks.forEach(task => {
      if (isGraphicMotionTaskType(task.type)) {
        groups['Graphic-Motion'].push(task);
      } else if (isGraphicOnlyTaskType(task.type)) {
        groups['Graphic Only'].push(task);
      } else if (isDecorTaskType(task.type)) {
        groups['Decor'].push(task);
      }
    });

    // 2. Sort each group by creation date (oldest first)
    const sortTasks = (a: Task, b: Task) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    
    groups['Graphic-Motion'].sort(sortTasks);
    groups['Graphic Only'].sort(sortTasks);
    groups['Decor'].sort(sortTasks);

    return groups;
  }, [tasks]);

  // New render function specifically for Graphic-Motion Tasks
  const renderGraphicMotionTaskList = (title: string, taskList: Task[]) => {
    if (taskList.length === 0) {
      return (
        <div className="glass-dark p-6 rounded-lg text-center">
          <p className="text-muted-foreground text-lg font-medium">No {title} tasks found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-primary mb-4">{title} ({taskList.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background glass-dark z-10">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-[250px]">Task Name</TableHead>
                <TableHead className="w-[120px]">Graphic</TableHead> {/* Changed from Grafis to Graphic */}
                <TableHead className="w-[120px]">Motion</TableHead>
                <TableHead className="w-[120px]">Music</TableHead>
                <TableHead className="w-[150px]">Task Type</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task, index) => {
                const graphicAssignedNames = task.assignedGraphic.map(getMemberFirstName);
                const motionAssignedNames = task.assignedMotion.map(getMemberFirstName);
                const musicAssignedNames = task.assignedMusic.map(getMemberFirstName);

                return (
                  <TableRow
                    key={task.id}
                    className="hover:glass-dark transition-colors cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {graphicAssignedNames.length > 0 ? graphicAssignedNames.join(", ") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {motionAssignedNames.length > 0 ? motionAssignedNames.join(", ") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {musicAssignedNames.length > 0 ? musicAssignedNames.join(", ") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getTaskTypeBadgeColorClass(task.type))}
                      >
                        {task.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold border",
                          getStatusColorClass(task.type, task.columnId)
                        )}
                      >
                        {getStatusTitle(task.columnId)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Existing render function for other task lists
  const renderTaskList = (title: string, taskList: Task[]) => {
    if (taskList.length === 0) {
      return (
        <div className="glass-dark p-6 rounded-lg text-center">
          <p className="text-muted-foreground text-lg font-medium">No {title} tasks found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-primary mb-4">{title} ({taskList.length})</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background glass-dark z-10">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-[350px]">Task Name</TableHead>
                <TableHead className="w-[250px]">Assignment</TableHead> {/* Increased width */}
                <TableHead className="w-[150px]">Task Type</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task, index) => {
                const graphicAssignedNames = task.assignedGraphic.map(getMemberFirstName);
                const motionAssignedNames = task.assignedMotion.map(getMemberFirstName);
                const musicAssignedNames = task.assignedMusic.map(getMemberFirstName);

                return (
                  <TableRow 
                    key={task.id} 
                    className="hover:glass-dark transition-colors cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {graphicAssignedNames.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="h-4 px-1 text-xs bg-primary/20 text-primary-foreground">G</Badge>
                          <span>{graphicAssignedNames.join(", ")}</span>
                        </div>
                      )}
                      {motionAssignedNames.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="h-4 px-1 text-xs bg-secondary/20 text-secondary-foreground">M</Badge>
                          <span>{motionAssignedNames.join(", ")}</span>
                        </div>
                      )}
                      {musicAssignedNames.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="h-4 px-1 text-xs bg-accent/20 text-accent-foreground">Mu</Badge>
                          <span>{musicAssignedNames.join(", ")}</span>
                        </div>
                      )}
                      {graphicAssignedNames.length === 0 && motionAssignedNames.length === 0 && musicAssignedNames.length === 0 && "-"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getTaskTypeBadgeColorClass(task.type))}
                      >
                        {task.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-semibold border",
                          getStatusColorClass(task.type, task.columnId)
                        )}
                      >
                        {getStatusTitle(task.columnId)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const allTaskLists = [
    { title: 'Graphic-Motion Tasks', list: groupedTasks['Graphic-Motion'] },
    { title: 'Graphic Only Tasks', list: groupedTasks['Graphic Only'] },
    { title: 'Decor Tasks', list: groupedTasks['Decor'] },
  ];

  const totalTasks = tasks.length;

  return (
    <ScrollArea className="h-[calc(100vh-250px)] glass p-4 rounded-lg pr-4"> {/* Added glass styling here */}
      <div className="space-y-6">
        {totalTasks === 0 ? (
          <div className="glass p-8 rounded-lg text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No tasks found matching the current filters.</p>
          </div>
        ) : (
          allTaskLists.map(group => (
            group.list.length > 0 && (
              <div key={group.title}>
                {group.title === 'Graphic-Motion Tasks'
                  ? renderGraphicMotionTaskList(group.title, group.list)
                  : renderTaskList(group.title, group.list)}
              </div>
            )
          ))
        )}
      </div>
    </ScrollArea>
  );
}