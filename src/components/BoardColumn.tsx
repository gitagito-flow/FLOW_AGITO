import { Task, ColumnId } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { isGraphicOnlyTaskType, isDecorTaskType } from "@/lib/taskPoints";
import { cn } from "@/lib/utils";
import { ListChecks } from "lucide-react";

interface BoardColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, direction: 'left' | 'right') => void;
  isFirstColumn: boolean;
  isLastColumn: boolean;
}

export function BoardColumn({ id, title, tasks, onTaskClick, onMoveTask, isFirstColumn, isLastColumn }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-[300px]">
      <div className="glass rounded-lg p-4 h-full flex flex-col max-h-[calc(100vh-180px)]">
        <div className="flex items-center justify-between mb-2 sticky top-0 z-10 glass p-2 -mx-4 -mt-4 rounded-t-lg">
          {/* Menambahkan flex-1 dan text-center untuk memusatkan judul */}
          <h3 className="font-bold text-foreground flex-1 text-center">{title}</h3>
          <span className="text-sm text-muted-foreground glass px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 space-y-3 overflow-y-auto",
            isOver && "border-2 border-dashed border-primary/30 rounded-lg glass-dark transition-all duration-200 ease-in-out"
          )}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onMoveTask={onMoveTask}
                currentColumnId={id}
                isFirstColumn={isFirstColumn}
                isLastColumn={isLastColumn}
                isGraphicOnlyOrDecorTask={isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <ListChecks className="h-8 w-8 mb-2" />
              <p className="font-medium">Drag tasks here or create a new one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}