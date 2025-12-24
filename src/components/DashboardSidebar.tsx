import React from "react";
import { Button } from "@/components/ui/button";
import {
  PanelLeftOpen,
  PanelLeftClose,
  CalendarDays,
  BarChart3,
  TrendingUp,
  User,
  LogOut,
  Flag,
  Clock,
  Plus, // Import Plus icon for new project button
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardSidebarProps {
  onCalendarOpen: () => void;
  onAnalyticsOpen: () => void;
  onActivityLogOpen: () => void;
  onGlobalConcernsOpen: () => void;
  onCurrentlyWorkingOpen: () => void;
  // onUserConfigOpen: () => void; // Removed
  onLogout: () => void;
  onCreateProjectOpen: () => void; // New prop for Create Project button
  userName: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function DashboardSidebar({
  onCalendarOpen,
  onAnalyticsOpen,
  onActivityLogOpen,
  onGlobalConcernsOpen,
  onCurrentlyWorkingOpen,
  // onUserConfigOpen, // Removed
  onLogout,
  onCreateProjectOpen, // Use new prop
  userName,
  isExpanded,
  onToggleExpand,
}: DashboardSidebarProps) {
  const renderButton = (
    onClick: () => void,
    label: string,
    Icon: React.ElementType,
    isDestructive: boolean = false,
    isGradient: boolean = false, // New parameter for gradient variant
    className?: string // Optional custom class
  ) => (
    <Button
      variant={isGradient ? "default" : "ghost"} // Use default if gradient to allow bg override
      onClick={onClick}
      className={cn(
        "w-full justify-start pl-3 transition-all duration-200",
        !isGradient && !className && "glass hover:glass-dark", // Apply glass styles only if not gradient and no custom class
        isDestructive && !className && "text-destructive hover:text-destructive/80",
        isGradient && "btn-gradient-effect", // Menerapkan efek gradient
        className // Apply custom class if provided
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
        {/* New Project Button */}
        {renderButton(onCreateProjectOpen, "New Project", Plus, false, true)} {/* Added new project button with gradient */}

        <div className="w-full h-px bg-border/50 my-2" /> {/* Separator */}

        {/* Global Navigation */}
        {renderButton(onCalendarOpen, "Calendar", CalendarDays)}
        {renderButton(onAnalyticsOpen, "Analytics", BarChart3)}
        {renderButton(onActivityLogOpen, "Activity Log", TrendingUp)}

        {/* Currently Working */}
        {renderButton(onCurrentlyWorkingOpen, "Currently Working", Clock)}

        {/* Global Concerns */}
        {renderButton(
          onGlobalConcernsOpen,
          "Global Concerns",
          Flag,
          false,
          false,
          "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 btn-gradient-effect shadow-md border-none"
        )}

        <div className="w-full h-px bg-border/50 my-2" /> {/* Separator */}

        {/* User Configuration */}
        {/* User Configuration - Just display name for now */}
        {userName && renderButton(() => { }, userName, User)}

        {/* Logout */}
        {renderButton(onLogout, "Logout", LogOut, true)}
      </div>

      <div className="mt-auto px-2">
        <ThemeToggle />
      </div>
    </div>
  );
}