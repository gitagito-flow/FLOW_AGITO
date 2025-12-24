import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, Check, X, Search, FolderKanban } from "lucide-react";
import { Project, Concern } from "@/lib/types";
import { getProjects, updateProject } from "@/lib/storage";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GlobalConcernPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate: (project: Project) => void; // To handle resolving concerns
}

interface GlobalConcernItem extends Concern {
  projectId: string;
  projectTitle: string;
}

export function GlobalConcernPanel({ open, onOpenChange, onProjectUpdate }: GlobalConcernPanelProps) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "resolved" | "unresolved">("unresolved");

  useEffect(() => {
    if (open) {
      setAllProjects(getProjects());
    }
  }, [open]);

  const allConcerns: GlobalConcernItem[] = useMemo(() => {
    return allProjects.flatMap(project => 
      project.concerns.map(concern => ({
        ...concern,
        projectId: project.id,
        projectTitle: project.title,
      }))
    );
  }, [allProjects]);

  const filteredConcerns = useMemo(() => {
    let concerns = allConcerns;

    // Filter by status
    if (filterStatus === "resolved") {
      concerns = concerns.filter(c => c.resolved);
    } else if (filterStatus === "unresolved") {
      concerns = concerns.filter(c => !c.resolved);
    }

    // Filter by search query (project title or concern text)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      concerns = concerns.filter(c => 
        c.text.toLowerCase().includes(query) ||
        c.projectTitle.toLowerCase().includes(query)
      );
    }

    // Sort: Unresolved first, then by creation date (newest first)
    return concerns.sort((a, b) => {
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allConcerns, filterStatus, searchQuery]);

  const handleToggleResolve = (concernItem: GlobalConcernItem) => {
    const projectToUpdate = allProjects.find(p => p.id === concernItem.projectId);
    if (!projectToUpdate) return;

    const updatedConcerns = projectToUpdate.concerns.map((concern) =>
      concern.id === concernItem.id
        ? {
            ...concern,
            resolved: !concern.resolved,
            resolvedAt: !concern.resolved ? new Date().toISOString() : undefined,
          }
        : concern
    );

    const updatedProject = {
      ...projectToUpdate,
      concerns: updatedConcerns,
    };

    // Update local storage and state
    onProjectUpdate(updatedProject);
    setAllProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    toast.success(
      updatedConcerns.find(c => c.id === concernItem.id)?.resolved
        ? `Concern in ${projectToUpdate.title} marked as resolved.`
        : `Concern in ${projectToUpdate.title} marked as unresolved.`
    );
  };

  const unresolvedCount = allConcerns.filter(c => !c.resolved).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Flag className="h-6 w-6 text-destructive" />
            Global Project Concerns
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-destructive">
                    Unresolved: {unresolvedCount}
                </span>
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search concern or project..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 glass w-[200px]"
                    />
                </div>
                <Select value={filterStatus} onValueChange={(value: "all" | "resolved" | "unresolved") => setFilterStatus(value)}>
                    <SelectTrigger className="glass w-[150px]">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                        <SelectItem value="unresolved">Unresolved</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="all">All Statuses</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {filteredConcerns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {allConcerns.length === 0 ? "No concerns have been submitted across all projects." : "No concerns match your current filters."}
              </p>
            ) : (
              filteredConcerns.map((concern) => (
                <div
                  key={concern.id}
                  className={cn(
                    "glass-dark p-3 rounded-lg flex items-start gap-3 transition-all",
                    concern.resolved ? "bg-success/10 border-success/30" : "border-destructive/30 border"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleResolve(concern)}
                    className={cn(
                      "flex-shrink-0 h-8 w-8",
                      concern.resolved
                        ? "text-success hover:text-success/80"
                        : "text-destructive hover:text-destructive/80"
                    )}
                  >
                    {concern.resolved ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{concern.author}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {concern.projectTitle}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(concern.createdAt), "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        concern.resolved ? "line-through text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {concern.text}
                    </p>
                    {concern.resolved && concern.resolvedAt && (
                      <p className="text-xs text-success mt-1">
                        Resolved: {format(new Date(concern.resolvedAt), "MMM dd, HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}