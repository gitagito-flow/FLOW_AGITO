import { Task, ColumnId } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { getMemberById, getMemberDivision } from "@/lib/teams";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onMoveTask: (taskId: string, direction: 'left' | 'right') => void;
  currentColumnId: ColumnId;
  isFirstColumn: boolean;
  isLastColumn: boolean;
  isGraphicOnlyOrDecorTask: boolean;
}

export function TaskCard({ 
  task, 
  onClick, 
  onMoveTask, 
  currentColumnId, 
  isFirstColumn, 
  isLastColumn,
  isGraphicOnlyOrDecorTask
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1, // Slightly less opaque when dragging
    zIndex: isDragging ? 100 : 'auto',
    boxShadow: isDragging ? '0 15px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px hsl(var(--primary)/0.5)' : 'none', // More prominent shadow with a primary glow
    scale: isDragging ? 1.02 : 1, // Slight scale up when dragging
  };

  const allAssignedMembers = [
    ...task.assignedGraphic,
    ...task.assignedMotion,
    ...task.assignedMusic,
  ];

  let cardBgClass = "glass";
  if (isGraphicMotionTaskType(task.type)) {
    cardBgClass = "bg-blue-500/10 border-blue-500/20";
  } else if (isGraphicOnlyTaskType(task.type)) {
    cardBgClass = "bg-green-500/10 border-green-500/20";
  } else if (isDecorTaskType(task.type)) {
    cardBgClass = "bg-orange-500/10 border-orange-500/20";
  }

  const disableRightArrowForRestriction = isGraphicOnlyOrDecorTask && currentColumnId === "done-graphics";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("hover:glass-dark transition-all group", cardBgClass)}
    >
      <div className="p-3 space-y-2">
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        
        <div className="flex-1 space-y-2">
          {task.imageUrl && (
            <div className="w-full h-24 rounded-lg overflow-hidden">
              <img
                src={task.imageUrl}
                alt={task.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div>
            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
              {task.title}
            </h4>
            <Badge variant="secondary" className="mt-1 text-xs">
              {task.type} ({task.points} pts)
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            {allAssignedMembers.slice(0, 6).map((memberId) => {
              const member = getMemberById(memberId);
              if (!member) return null;

              const division = getMemberDivision(memberId);
              let avatarBgClass = "glass";
              if (division === "graphic") avatarBgClass = "bg-primary/20 text-primary-foreground";
              else if (division === "motion") avatarBgClass = "bg-secondary/20 text-secondary-foreground";
              else if (division === "music") avatarBgClass = "bg-accent/20 text-accent-foreground";

              return (
                <Avatar key={memberId} className="h-7 w-7">
                  <AvatarFallback className={cn(avatarBgClass, "text-xs")}>
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {allAssignedMembers.length > 6 && (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="glass text-xs">
                  +{allAssignedMembers.length - 6}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-8 text-xs glass hover:glass-dark hover:scale-[1.02] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-8 p-0 h-8 glass hover:glass-dark hover:scale-[1.02] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onMoveTask(task.id, 'left');
              }}
              disabled={isFirstColumn}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-8 p-0 h-8 glass hover:glass-dark hover:scale-[1.02] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onMoveTask(task.id, 'right');
              }}
              disabled={isLastColumn || disableRightArrowForRestriction}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}