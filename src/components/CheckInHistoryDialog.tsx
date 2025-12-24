import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ColumnId, TaskType } from "@/lib/types";
import { columns as allColumns } from "@/lib/columns";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType } from "@/lib/taskPoints";

interface CheckInHistoryDetail {
  date: Date;
  status: ColumnId;
}

interface CheckInHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  memberName: string;
  taskType: TaskType;
  memberDivision: "graphic" | "motion" | "music" | null;
  history: CheckInHistoryDetail[];
  totalCheckIns: number; // NEW PROP
}

const getStatusTitle = (columnId: ColumnId) => {
  return allColumns.find(col => col.id === columnId)?.title || columnId.replace(/-/g, ' ');
};

const getStatusColorClass = (taskType: TaskType, columnId: ColumnId, memberDivision: "graphic" | "motion" | "music" | null) => {
  if (!memberDivision) return "bg-gray-500 text-white";

  if (memberDivision === "graphic") {
    if (isGraphicOnlyTaskType(taskType) || isDecorTaskType(taskType)) {
      if (["todo-graphics", "wip-graphics"].includes(columnId)) return "bg-red-500 text-white";
      if (["qc-graphics", "revision-graphics"].includes(columnId)) return "bg-yellow-500 text-black";
      if (columnId === "done-graphics") return "bg-green-500 text-white";
    } else if (isGraphicMotionTaskType(taskType)) {
      if (["todo-graphics", "wip-graphics"].includes(columnId)) return "bg-red-500 text-white";
      if (["qc-graphics", "revision-graphics"].includes(columnId)) return "bg-yellow-500 text-black";
      if (["done-graphics", "todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(columnId)) return "bg-green-500 text-white";
    }
  } else if (memberDivision === "motion" || memberDivision === "music") {
    if (isGraphicMotionTaskType(taskType)) {
      if (["todo-graphics", "wip-graphics", "qc-graphics", "revision-graphics", "done-graphics", "todo-motion", "wip-motion"].includes(columnId)) return "bg-red-500 text-white";
      if (["qc-motion", "revision-motion"].includes(columnId)) return "bg-yellow-500 text-black";
      if (columnId === "final") return "bg-green-500 text-white";
    }
  }
  return "bg-gray-500 text-white";
};

export function CheckInHistoryDialog({
  open,
  onOpenChange,
  taskName,
  memberName,
  taskType,
  memberDivision,
  history,
  totalCheckIns,
}: CheckInHistoryDialogProps) {
  
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => b.date.getTime() - a.date.getTime());

  const columnBreakdown = useMemo(() => {
    const counts: Record<ColumnId, number> = {} as Record<ColumnId, number>;
    // Initialize counts for all columns
    allColumns.forEach(col => counts[col.id] = 0);

    history.forEach(entry => {
        counts[entry.status] = (counts[entry.status] || 0) + 1;
    });

    // Filter out columns with zero counts and map to display format
    return allColumns
        .map(col => ({
            id: col.id,
            title: col.title,
            count: counts[col.id]
        }))
        .filter(item => item.count > 0);
  }, [history]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ListChecks className="h-5 w-5 text-primary" />
            Check-in History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Member: <span className="font-semibold text-foreground">{memberName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Task: <span className="font-semibold text-foreground">{taskName}</span>
          </p>
          
          {/* Total Check-ins */}
          <div className="glass-dark p-3 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium">Total Check-ins:</p>
            <span className="text-xl font-bold text-primary">{totalCheckIns}</span>
          </div>

          {/* Status Check-in Breakdown */}
          {columnBreakdown.length > 0 && (
            <div className="glass p-3 rounded-lg space-y-2">
              <h4 className="text-sm font-bold text-primary">Status Check-in Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                  {columnBreakdown.map(item => (
                      <div key={item.id} className="flex justify-between items-center glass-dark p-2 rounded">
                          <span className="text-muted-foreground">{item.title}</span>
                          <span className="font-bold text-foreground">{item.count}x</span>
                      </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sortedHistory.map((entry, index) => (
              <div 
                key={index} 
                className={cn(
                  "glass-dark p-3 rounded-lg flex items-center justify-between transition-all",
                  index === 0 && "border-2 border-primary/50" // Highlight newest entry
                )}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">
                      {format(entry.date, "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(entry.date, "HH:mm:ss")}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span 
                    className={cn(
                      "inline-block px-2 py-1 rounded text-xs font-bold",
                      getStatusColorClass(taskType, entry.status, memberDivision)
                    )}
                  >
                    {getStatusTitle(entry.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}