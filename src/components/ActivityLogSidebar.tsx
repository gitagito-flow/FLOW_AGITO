import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  PanelLeftOpen,
  PanelLeftClose,
  Users,
  Palette,
  Film,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface ActivityLogSidebarProps {
  onBackToDashboard: () => void;
  selectedDivision: "all" | "graphic" | "motion" | "music";
  onSelectDivision: (division: "all" | "graphic" | "motion" | "music") => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  backButtonLabel: string; // NEW PROP
}

export function ActivityLogSidebar({
  onBackToDashboard,
  selectedDivision,
  onSelectDivision,
  isExpanded,
  onToggleExpand,
  backButtonLabel, // Use new prop
}: ActivityLogSidebarProps) {
  const renderButton = (
    division: "all" | "graphic" | "motion" | "music",
    label: string,
    Icon: React.ElementType
  ) => {
    const isActive = selectedDivision === division;
    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        onClick={() => onSelectDivision(division)}
        className={cn(
          "w-full justify-start pl-3 transition-all duration-200",
          isActive ? "" : "glass hover:glass-dark"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span
          className={cn(
            "ml-3 whitespace-nowrap transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          {label}
        </span>
      </Button>
    );
  };

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
        {/* Back to Dashboard Button */}
        <Button
          variant="ghost"
          onClick={onBackToDashboard}
          className="w-full justify-start glass hover:glass-dark pl-3"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "ml-3 whitespace-nowrap transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            {backButtonLabel}
          </span>
        </Button>

        <div className="w-full h-px bg-border/50 my-2" /> {/* Separator */}

        {/* Division Filters */}
        <h3
          className={cn(
            "text-sm font-semibold text-muted-foreground px-3 mb-1 transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
          )}
        >
          Filter by Division
        </h3>
        
        {renderButton("all", "All Divisions", Users)}
        {renderButton("graphic", "Graphic", Palette)}
        {renderButton("motion", "Motion", Film)}
        {renderButton("music", "Music", Music)}
      </div>

      <div className="mt-auto px-2">
        <ThemeToggle />
      </div>
    </div>
  );
}