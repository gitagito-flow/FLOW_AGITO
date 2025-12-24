import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Info,
  TrendingUp,
  Download,
  Flag,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  CalendarDays, // Import CalendarDays icon for activity log
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface LeftSidebarProps {
  onBackToDashboard: () => void;
  onProjectInfoOpen: () => void;
  onAnalyticsOpen: () => void;
  onGraphicDownloadOpen: () => void;
  onMotionDownloadOpen: () => void;
  onConcernPanelOpen: () => void;
  onCreateTaskOpen: () => void;
  onDailyActivityLogOpen: () => void; // New prop for Daily Activity Log
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LeftSidebar({
  onBackToDashboard,
  onProjectInfoOpen,
  onAnalyticsOpen,
  onGraphicDownloadOpen,
  onMotionDownloadOpen,
  onConcernPanelOpen,
  onCreateTaskOpen,
  onDailyActivityLogOpen, // New prop
  isExpanded,
  onToggleExpand,
}: LeftSidebarProps) {
  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-background glass-dark border-r border-border/50 z-50",
        "flex flex-col py-4 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-end px-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleExpand}
          className="glass hover:glass-dark"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex flex-col items-start gap-2 px-2 flex-1">
        {/* Back to Dashboard Button (sekarang di atas) */}
        <Button
          variant="ghost"
          onClick={onBackToDashboard}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Back to Dashboard
          </span>
        </Button>

        <div className="w-full h-px bg-border/50 my-2" /> {/* Separator */}

        {/* Create Task Button (sekarang di bawah Back to Dashboard) */}
        <Button
          variant="gradient"
          onClick={onCreateTaskOpen}
          className="w-full justify-start pl-3 btn-gradient-effect" // Menerapkan efek gradient
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Create Task
          </span>
        </Button>

        <div className="w-full h-px bg-border/50 my-2" /> {/* Separator */}

        {/* 1. Project Info */}
        <Button
          variant="ghost"
          onClick={onProjectInfoOpen}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <Info className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Project Info
          </span>
        </Button>

        {/* 2. Analytics */}
        <Button
          variant="ghost"
          onClick={onAnalyticsOpen}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <TrendingUp className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Analytics
          </span>
        </Button>

        {/* 3. Daily Activity Log */}
        <Button
          variant="ghost"
          onClick={onDailyActivityLogOpen}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <CalendarDays className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Daily Activity Log
          </span>
        </Button>

        {/* 4. Graphic Tasks */}
        <Button
          variant="ghost"
          onClick={onGraphicDownloadOpen}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <Download className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Graphic Tasks
          </span>
        </Button>

        {/* 5. Motion Tasks */}
        <Button
          variant="ghost"
          onClick={onMotionDownloadOpen}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <Download className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Motion Tasks
          </span>
        </Button>

        {/* 6. Concerns */}
        <Button
          variant="ghost"
          onClick={onConcernPanelOpen}
          className="w-full justify-start pl-3 bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 btn-gradient-effect shadow-md border-none"
        >
          <Flag className="h-5 w-5 flex-shrink-0" />
          <span className={cn("ml-3 whitespace-nowrap transition-opacity duration-200", isExpanded ? "opacity-100" : "opacity-0")}>
            Concerns
          </span>
        </Button>
      </div>

      <div className="mt-auto px-2">
        <ThemeToggle />
      </div>
    </div>
  );
}