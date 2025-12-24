import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, Users } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, getDay, subDays, addDays } from "date-fns";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getTeamById } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectInfoDialog } from "./ProjectInfoDialog"; // Import ProjectInfoDialog

interface MonthlyCalendarPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

// Define a set of colors for project badges
const PROJECT_COLORS = [
  "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30",
  "bg-red-500/20 text-red-500 hover:bg-red-500/30",
  "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30",
  "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "bg-lime-500/20 text-lime-500 hover:bg-lime-500/30",
];

// Function to get a consistent color class for a given project ID
const getProjectColorClass = (projectId: string) => {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PROJECT_COLORS.length;
  return PROJECT_COLORS[index];
};

export function MonthlyCalendarPanel({ open, onOpenChange, projects }: MonthlyCalendarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [showProjectDetailsDialog, setShowProjectDetailsDialog] = useState(false);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startDay = getDay(start); // 0 for Sunday, 1 for Monday, etc.

    // Calculate the start of the calendar grid (Sunday of the first week)
    const calendarStart = subDays(start, startDay);

    // Calculate the end of the calendar grid (Saturday of the last week)
    const calendarEnd = addDays(end, 6 - getDay(end));

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProjectForDetails(project);
    setShowProjectDetailsDialog(true);
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDayIndex = getDay(new Date()); // Get index of today's day (0-6)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CalendarDays className="h-6 w-6 text-primary" />
              Monthly Event Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="glass hover:glass-dark">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-xl font-bold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="glass hover:glass-dark">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground mb-2">
            {daysOfWeek.map((day, index) => (
              <div 
                key={day}
                className={cn(
                  "py-1 rounded-md",
                  index === todayDayIndex && "bg-primary/10 text-primary font-bold" // Highlight today's day of the week
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <ScrollArea className="flex-1 pr-4"> {/* flex-1 ensures it takes available height and scrolls */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const eventsOnDay = projects.filter(project => {
                  const startDate = new Date(project.eventStartDate);
                  const endDate = new Date(project.eventEndDate);
                  return isWithinInterval(day, { start: startDate, end: endDate });
                });

                return (
                  <div
                    key={index}
                    className={cn(
                      "glass-dark p-2 rounded-lg min-h-32 flex flex-col",
                      !isCurrentMonth && "opacity-50",
                      isToday && "border-2 border-primary",
                      eventsOnDay.length > 0 && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold mb-1",
                        isToday && "text-primary",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex-1 space-y-1">
                      {eventsOnDay.length > 0 ? (
                        eventsOnDay.map((event) => (
                          <Button
                            key={event.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full h-auto justify-start p-1 rounded-md text-xs font-medium truncate",
                              getProjectColorClass(event.id)
                            )}
                            onClick={() => handleProjectClick(event)}
                            title={event.title}
                          >
                            {event.title}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No events</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedProjectForDetails && (
        <ProjectInfoDialog
          project={selectedProjectForDetails}
          open={showProjectDetailsDialog}
          onOpenChange={setShowProjectDetailsDialog}
        />
      )}
    </>
  );
}