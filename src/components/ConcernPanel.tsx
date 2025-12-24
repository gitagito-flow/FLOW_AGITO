import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Flag, X, Trash2 } from "lucide-react"; // Import Trash2 icon
import { Project, Concern } from "@/lib/types";
import { getCurrentUserName } from "@/lib/storage";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConcernPanelProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate: (project: Project) => void;
}

export function ConcernPanel({ project, open, onOpenChange, onProjectUpdate }: ConcernPanelProps) {
  const [newConcernText, setNewConcernText] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [concernToDelete, setConcernToDelete] = useState<string | null>(null);
  const currentUser = getCurrentUserName() || "Unknown User";

  const handleAddConcern = () => {
    if (!newConcernText.trim()) {
      toast.error("Concern text cannot be empty.");
      return;
    }

    const newConcern: Concern = {
      id: `concern-${Date.now()}`,
      text: newConcernText.trim(),
      author: currentUser,
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    const updatedProject = {
      ...project,
      concerns: [...project.concerns, newConcern],
    };

    onProjectUpdate(updatedProject);
    setNewConcernText("");
    toast.success("Concern submitted.");
  };

  const handleToggleResolve = (concernId: string) => {
    const updatedConcerns = project.concerns.map((concern) =>
      concern.id === concernId
        ? {
            ...concern,
            resolved: !concern.resolved,
            resolvedAt: !concern.resolved ? new Date().toISOString() : undefined,
          }
        : concern
    );

    const updatedProject = {
      ...project,
      concerns: updatedConcerns,
    };

    onProjectUpdate(updatedProject);
    toast.success(
      updatedConcerns.find(c => c.id === concernId)?.resolved
        ? "Concern marked as resolved."
        : "Concern marked as unresolved."
    );
  };

  const handleDeleteClick = (concernId: string) => {
    setConcernToDelete(concernId);
    setShowDeleteAlert(true);
  };

  const confirmDeleteConcern = () => {
    if (concernToDelete) {
      const updatedConcerns = project.concerns.filter(
        (concern) => concern.id !== concernToDelete
      );
      const updatedProject = {
        ...project,
        concerns: updatedConcerns,
      };
      onProjectUpdate(updatedProject);
      toast.success("Concern deleted.");
      setConcernToDelete(null);
      setShowDeleteAlert(false);
    }
  };

  const sortedConcerns = [...project.concerns].sort((a, b) => {
    // Unresolved concerns first, then by creation date (newest first)
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Flag className="h-6 w-6 text-destructive" />
              Project Concerns
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Concern Submission */}
            <div className="glass p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-lg">Submit a New Concern</h4>
              <Textarea
                placeholder="Describe your concern or issue..."
                value={newConcernText}
                onChange={(e) => setNewConcernText(e.target.value)}
                className="glass min-h-[80px]"
              />
              <Button
                onClick={handleAddConcern}
                variant="destructive" // Menggunakan varian destructive
              >
                <Flag className="h-4 w-4 mr-2" />
                Submit Concern
              </Button>
            </div>

            {/* List of Concerns */}
            <div>
              <h4 className="font-semibold text-lg mb-3">All Concerns ({project.concerns.length})</h4>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {sortedConcerns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No concerns submitted yet.</p>
                  ) : (
                    sortedConcerns.map((concern) => (
                      <div
                        key={concern.id}
                        className={cn(
                          "glass-dark p-3 rounded-lg flex items-start gap-3 transition-all", // Menggunakan glass-dark
                          concern.resolved ? "bg-success/10 border-success/30" : ""
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleResolve(concern.id)}
                          className={cn(
                            "flex-shrink-0 h-8 w-8",
                            concern.resolved
                              ? "text-success hover:text-success/80"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {concern.resolved ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{concern.author}</span>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(concern.id)}
                          className="flex-shrink-0 h-8 w-8 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Concern</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this concern? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConcern} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}