import React, { useState } from "react";
import { Task, ColumnId } from "@/lib/types";
import { columns } from "@/lib/columns";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, DragEndEvent, DragOverEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { isGraphicOnlyTaskType, isDecorTaskType } from "@/lib/taskPoints";

interface MobileKanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, direction: 'left' | 'right') => void;
  onDragEnd: (event: DragEndEvent) => void; // Pass the drag end handler from parent
  onDragOver: (event: DragOverEvent) => void; // Pass the drag over handler from parent
}

export function MobileKanbanBoard({ tasks, onTaskClick, onMoveTask, onDragEnd, onDragOver }: MobileKanbanBoardProps) {
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  const currentColumn = columns[currentColumnIndex];
  const tasksInCurrentColumn = tasks.filter(task => task.columnId === currentColumn.id);

  const goToNextColumn = () => {
    setCurrentColumnIndex(prev => Math.min(prev + 1, columns.length - 1));
  };

  const goToPreviousColumn = () => {
    setCurrentColumnIndex(prev => Math.max(prev - 1, 0));
  };

  const isFirstColumn = currentColumnIndex === 0;
  const isLastColumn = currentColumnIndex === columns.length - 1;

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-between w-full max-w-md">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousColumn}
            disabled={isFirstColumn}
            className="glass hover:glass-dark"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-bold text-lg text-foreground text-center flex-1">
            {currentColumn.title}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextColumn}
            disabled={isLastColumn}
            className="glass hover:glass-dark"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-full max-w-md glass rounded-lg p-4 h-[calc(100vh-300px)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Tasks:</span>
            <span className="text-sm text-muted-foreground glass px-2 py-1 rounded-full">
              {tasksInCurrentColumn.length}
            </span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            <SortableContext items={tasksInCurrentColumn.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasksInCurrentColumn.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onMoveTask={onMoveTask}
                  currentColumnId={currentColumn.id}
                  isFirstColumn={isFirstColumn}
                  isLastColumn={isLastColumn}
                  isGraphicOnlyOrDecorTask={isGraphicOnlyTaskType(task.type) || isDecorTaskType(task.type)}
                />
              ))}
            </SortableContext>
            {tasksInCurrentColumn.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No tasks in this column.</p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}