import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskType, Comment, MemberAssignment, Project, ActivityLogEntry } from "@/lib/types";
import { Edit, Trash2, Send, ExternalLink, Maximize2, ChevronDown, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { getMemberById, getProjectMembers, getMemberDivision } from "@/lib/teams";
import { addActivityLogEntry, deleteActivityLogEntriesByTaskId } from "@/lib/activityLogStorage";
import { 
  getTaskPoints, 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints";
import { format } from "date-fns";
import { ImageViewer } from "./ImageViewer";
import { cn } from "@/lib/utils";
import { getCurrentUserName } from "@/lib/storage";
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
import { MemberAssignmentSection } from "./MemberAssignmentSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface TaskDetailDialogProps {
  project: Project;
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TaskDetailDialog({ project, task, open, onOpenChange, onTaskUpdate, onTaskDelete }: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [memberPercentages, setMemberPercentages] = useState<Record<string, number>>({});
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // New states for comment deletion and editing
  const [showDeleteCommentAlert, setShowDeleteCommentAlert] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  const commentsScrollRef = useRef<HTMLDivElement>(null); // Ref for comments scroll area

  const projectMembers = getProjectMembers(project);
  const currentUser = getCurrentUserName() || "Unknown User";

  // Filter project members based on selected task type
  const getFilteredProjectMembers = (currentTaskType: TaskType) => {
    const filtered = { graphic: [] as TeamMember[], motion: [] as TeamMember[], music: [] as TeamMember[] };
    
    if (isGraphicOnlyTaskType(currentTaskType) || isDecorTaskType(currentTaskType)) {
      filtered.graphic = projectMembers.graphic;
      // Music team members should be excluded for Graphic Only and Decor tasks
    } else if (isGraphicMotionTaskType(currentTaskType)) {
      filtered.graphic = projectMembers.graphic;
      filtered.motion = project.motionTeams.length > 0 ? projectMembers.motion : []; // Only include motion if project has motion teams
      filtered.music = project.musicTeams.length > 0 ? projectMembers.music : []; // Only include music if project has music teams
    }
    return filtered;
  };

  // Efek untuk memperbarui assignedMembers dan memberPercentages saat task atau editedTask berubah
  useEffect(() => {
    if (task) {
      const currentTaskData = isEditing && editedTask ? editedTask : task;
      setAssignedMembers([
        ...currentTaskData.assignedGraphic,
        ...currentTaskData.assignedMotion,
        ...currentTaskData.assignedMusic,
      ]);
      const initialPercentages: Record<string, number> = {};
      currentTaskData.memberAssignments.forEach(a => {
        initialPercentages[a.memberId] = a.percentage;
      });
      setMemberPercentages(initialPercentages);
    }
  }, [task, isEditing, editedTask]);

  if (!task) return null;

  const currentTask = isEditing && editedTask ? editedTask : task;
  const filteredProjectMembers = getFilteredProjectMembers(currentTask.type);
  
  // Calculate individual category totals for validation
  const graphicAssignedMembers = filteredProjectMembers.graphic.filter(m => assignedMembers.includes(m.id));
  const graphicTotal = graphicAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isGraphicValid = graphicAssignedMembers.length === 0 || graphicTotal === 100;

  const motionAssignedMembers = filteredProjectMembers.motion.filter(m => assignedMembers.includes(m.id));
  const motionTotal = motionAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isMotionValid = motionAssignedMembers.length === 0 || motionTotal === 100;

  const musicAssignedMembers = filteredProjectMembers.music.filter(m => assignedMembers.includes(m.id));
  const musicTotal = musicAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isMusicValid = musicAssignedMembers.length === 0 || musicTotal === 100;

  const isOverallAssignmentValid = isGraphicValid && isMotionValid && isMusicValid;

  const startEditing = () => {
    setEditedTask({ ...task });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedTask(null);
    setIsEditing(false);
    // Reset assignedMembers dan memberPercentages to original task values
    setAssignedMembers([
      ...task.assignedGraphic,
      ...task.assignedMotion,
      ...task.assignedMusic,
    ]);
    const initialPercentages: Record<string, number> = {};
    task.memberAssignments.forEach(a => {
      initialPercentages[a.memberId] = a.percentage;
    });
    setMemberPercentages(initialPercentages);
  };

  const saveEditing = () => {
    if (editedTask) {
      if (!isOverallAssignmentValid) {
        let errorMessage = "Point distribution for assigned members must total 100% in each category: ";
        if (graphicAssignedMembers.length > 0 && !isGraphicValid) errorMessage += "Graphic Team ";
        if (motionAssignedMembers.length > 0 && !isMotionValid) errorMessage += "Motion Team ";
        if (musicAssignedMembers.length > 0 && !isMusicValid) errorMessage += "Music Team ";
        toast.error(errorMessage.trim());
        return;
      }

      const updatedAssignments: MemberAssignment[] = assignedMembers.map(memberId => ({
        memberId,
        percentage: memberPercentages[memberId] || 0,
      }));
      
      const graphicIds = assignedMembers.filter(id => filteredProjectMembers.graphic.some(m => m.id === id));
      const motionIds = assignedMembers.filter(id => filteredProjectMembers.motion.some(m => m.id === id));
      const musicIds = assignedMembers.filter(id => filteredProjectMembers.music.some(m => m.id === id));

      const updatedTask: Task = {
        ...editedTask,
        assignedGraphic: graphicIds,
        assignedMotion: motionIds,
        assignedMusic: musicIds,
        memberAssignments: updatedAssignments,
      };

      onTaskUpdate(updatedTask);
      setIsEditing(false);
      setEditedTask(null);
      toast.success("Task updated successfully");
    }
  };

  const confirmDelete = () => {
    if (task) {
      // 1. Delete activity log entries associated with this task
      deleteActivityLogEntriesByTaskId(task.id);
      
      // 2. Delete the task itself
      onTaskDelete(task.id);
      
      onOpenChange(false);
      toast.success("Task deleted successfully");
      setShowDeleteAlert(false);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast.error("Comment text cannot be empty.");
      return;
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text: commentText.trim(),
      author: currentUser,
      imageUrl: commentImage || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...currentTask, // Use currentTask to ensure latest comments are included
      comments: [...currentTask.comments, newComment],
    };

    onTaskUpdate(updatedTask);
    setCommentText("");
    setCommentImage(""); // Clear image after sending
    toast.success("Comment added");

    // Scroll to bottom after adding comment
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTaskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editedTask) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedTask({ ...editedTask, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMemberAssignment = (memberId: string, category: "graphic" | "motion" | "music") => {
    if (!editedTask) return;

    setAssignedMembers(prevAssigned => {
      const isAssigned = prevAssigned.includes(memberId);
      let newAssigned: string[];

      // Check if the member's category is allowed for the current task type
      const isAllowedCategory = 
        (category === "graphic" && (isGraphicOnlyTaskType(editedTask.type) || isDecorTaskType(editedTask.type) || isGraphicMotionTaskType(editedTask.type))) ||
        (category === "motion" && isGraphicMotionTaskType(editedTask.type)) ||
        (category === "music" && isGraphicMotionTaskType(editedTask.type)); // Music is only allowed for Graphic-Motion tasks

      if (!isAllowedCategory && !isAssigned) { // Prevent assigning if not allowed and not already assigned
        toast.error(`Cannot assign ${category} team member for this task type.`);
        return prevAssigned;
      }

      if (isAssigned) {
        newAssigned = prevAssigned.filter(id => id !== memberId);
      } else {
        newAssigned = [...prevAssigned, memberId];
      }

      const categoryMembersInProject = filteredProjectMembers[category];
      const assignedInThisCategory = newAssigned.filter(id => 
        categoryMembersInProject.some(m => m.id === id)
      );

      setMemberPercentages(prevPercentages => {
        const newPercentages = { ...prevPercentages };

        // Clear percentages for members in this category who are no longer assigned
        categoryMembersInProject.forEach(member => {
          if (!assignedInThisCategory.includes(member.id)) {
            delete newPercentages[member.id];
          }
        });

        // Distribute 100% among currently assigned members in this category, with rounding
        if (assignedInThisCategory.length > 0) {
          const basePercentage = Math.floor(100 / assignedInThisCategory.length);
          let remainder = 100 % assignedInThisCategory.length;

          assignedInThisCategory.forEach((id) => {
            let percentage = basePercentage;
            if (remainder > 0) {
              percentage += 1;
              remainder--;
            }
            newPercentages[id] = percentage;
          });
        }
        return newPercentages;
      });

      return newAssigned;
    });
  };

  const handlePercentageChange = (memberId: string, value: string) => {
    const percentage = parseInt(value) || 0;
    setMemberPercentages(prev => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(100, percentage))
    }));
  };

  // Handler for deleting a comment
  const handleDeleteCommentClick = (commentId: string) => {
    setCommentToDeleteId(commentId);
    setShowDeleteCommentAlert(true);
  };

  const confirmDeleteComment = () => {
    if (commentToDeleteId) {
      const updatedComments = currentTask.comments.filter(
        (comment) => comment.id !== commentToDeleteId
      );
      const updatedTask = {
        ...currentTask,
        comments: updatedComments,
      };
      onTaskUpdate(updatedTask);
      toast.success("Comment deleted.");
      setCommentToDeleteId(null);
      setShowDeleteCommentAlert(false);
    }
  };

  // Handler for editing a comment
  const handleEditCommentClick = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleSaveEditedComment = () => {
    if (!editingCommentId || !editedCommentText.trim()) {
      toast.error("Edited comment cannot be empty.");
      return;
    }

    const updatedComments = currentTask.comments.map(comment =>
      comment.id === editingCommentId
        ? { ...comment, text: editedCommentText.trim() }
        : comment
    );

    const updatedTask = {
      ...currentTask,
      comments: updatedComments,
    };

    onTaskUpdate(updatedTask);
    toast.success("Comment updated.");
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleCancelEditingComment = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  // NEW: Handle Check-in
  const handleCheckIn = (memberId: string) => {
    const member = getMemberById(memberId);
    if (!member) return;

    const division = getMemberDivision(memberId);
    if (!division) {
        toast.error(`Could not determine division for ${member.name}.`);
        return;
    }

    const newLogEntry: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        memberDivision: division,
        projectId: project.id, // Pass project ID
        projectTitle: project.title, // Pass project title
        taskId: currentTask.id,
        taskTitle: currentTask.title,
        taskType: currentTask.type,
        taskColumnId: currentTask.columnId,
        checkInTime: new Date().toISOString(),
        checkInDateOnly: format(new Date(), "yyyy-MM-dd"), // This will be overwritten by addActivityLogEntry, but good for consistency
    };

    const success = addActivityLogEntry(newLogEntry);
    if (success) {
      toast.success(`${member.name} checked in to task: ${currentTask.title}`);
    } else {
      toast.info(`${member.name} has already checked in to this task in this column today.`);
    }
  };

  // Determine if check-in should be disabled
  const isCheckInDisabled = currentTask.columnId === "todo-graphics" || currentTask.columnId === "todo-motion";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{isEditing ? "Edit Task" : "Task Details"}</DialogTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={startEditing} aria-label="Edit task details">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDeleteAlert(true)} aria-label="Delete task">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="gradient" // Menggunakan varian gradient
                      onClick={saveEditing} 
                      className="btn-gradient-effect" // Menerapkan efek gradient
                      // Removed disabled prop to allow validation feedback
                      aria-label="Save edited task"
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className="glass hover:glass-dark" aria-label="Cancel editing task">Cancel</Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {currentTask.imageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                <img
                  src={currentTask.imageUrl}
                  alt={`Image for task ${currentTask.title}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setZoomedImage(currentTask.imageUrl!)}
                  aria-label="Maximize task image"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isEditing && editedTask ? (
              <>
                <div>
                  <Label htmlFor="edit-title">Task Title</Label>
                  <Input
                    id="edit-title"
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="glass"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="glass"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-task-type">Task Type</Label>
                    <Select 
                      value={editedTask.type} 
                      onValueChange={(v: TaskType) => {
                        setEditedTask({ 
                          ...editedTask, 
                          type: v,
                          points: getTaskPoints(v)
                        });
                        // Reset assigned members and percentages when task type changes
                        setAssignedMembers([]);
                        setMemberPercentages({});
                      }}
                    >
                      <SelectTrigger id="edit-task-type" className="glass">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Graphic-Motion Task Types */}
                        <SelectItem value="CLIP">Graphic-Motion: Clip (20 points)</SelectItem>
                        <SelectItem value="PRESENTATION">Graphic-Motion: Presentation (10 points)</SelectItem>
                        <SelectItem value="BUMPER">Graphic-Motion: Bumper (5 points)</SelectItem>
                        <SelectItem value="BACKGROUND">Graphic-Motion: Background (2 points)</SelectItem>
                        <SelectItem value="MINOR_ITEMS_ANIMATION">Graphic-Motion: Minor Items Animation (1 point)</SelectItem>
                        {/* Graphic Only Task Types */}
                        <SelectItem value="BRANDING">Graphic Only: Branding (20 points)</SelectItem>
                        <SelectItem value="ADVERTISING">Graphic Only: Advertising (10 points)</SelectItem>
                        <SelectItem value="MICROSITE_UI_DESIGN">Graphic Only: Microsite & UI Design (5 points)</SelectItem>
                        <SelectItem value="DIGITAL_MEDIA">Graphic Only: Digital Media (2 points)</SelectItem>
                        <SelectItem value="PRINTED_MEDIA_MINOR_DESIGN">Graphic Only: Printed Media/Minor Design (1 point)</SelectItem>
                        {/* Decor Task Types */}
                        <SelectItem value="PRINTED_INFORMATION">Decor: Printed Information (10 points)</SelectItem>
                        <SelectItem value="PRINTED_DECORATION">Decor: Printed Decoration (4 points)</SelectItem>
                        <SelectItem value="CUTTING_MAL_RESIZE">Decor: Cutting/Mal/Resize (1 point)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-graphic-link">Graphic Link</Label>
                    <Input
                      id="edit-graphic-link"
                      value={editedTask.graphicLink || ""}
                      onChange={(e) => setEditedTask({ ...editedTask, graphicLink: e.target.value })}
                      className="glass"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-animation-link">Animation Link</Label>
                    <Input
                      id="edit-animation-link"
                      value={editedTask.animationLink || ""}
                      onChange={(e) => setEditedTask({ ...editedTask, animationLink: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-music-link">Music Link</Label>
                    <Input
                      id="edit-music-link"
                      value={editedTask.musicLink || ""}
                      onChange={(e) => setEditedTask({ ...editedTask, musicLink: e.target.value })}
                      className="glass"
                    />
                  </div>
                </div>

                <MemberAssignmentSection
                  projectMembers={filteredProjectMembers} // Pass filtered members
                  assignedMembers={assignedMembers}
                  memberPercentages={memberPercentages}
                  toggleMemberAssignment={toggleMemberAssignment}
                  handlePercentageChange={handlePercentageChange}
                />

                <div>
                  <Label htmlFor="edit-image">Update Image</Label>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleTaskImageUpload}
                    className="glass"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-bold">{currentTask.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{currentTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 glass p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{currentTask.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="font-medium">{currentTask.points}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{currentTask.columnId.replace(/-/g, " ")}</p>
                  </div>
                  {currentTask.deadline && (
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">{format(new Date(currentTask.deadline), "MMM dd, yyyy")}</p>
                    </div>
                  )}
                </div>

                {(currentTask.graphicLink || currentTask.animationLink || currentTask.musicLink) && (
                  <div className="space-y-2">
                    <Label>Links</Label>
                    <div className="space-y-1">
                      {currentTask.graphicLink && (
                        <a href={currentTask.graphicLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Graphic Link
                        </a>
                      )}
                      {currentTask.animationLink && (
                        <a href={currentTask.animationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Animation Link
                        </a>
                      )}
                      {currentTask.musicLink && (
                        <a href={currentTask.musicLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Music Link
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-base font-semibold">Points Distribution</Label>
                  
                  {currentTask.memberAssignments.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {currentTask.memberAssignments.map(assignment => {
                        const member = getMemberById(assignment.memberId);
                        if (!member) return null;

                        const assignedPoints = currentTask.points * (assignment.percentage / 100);

                        return (
                          <div key={assignment.memberId} className="glass p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="font-medium">{member.name}</span>
                                <Badge variant="secondary" className="text-xs">{assignment.percentage}%</Badge>
                                <span className="text-sm text-primary font-bold">{assignedPoints.toFixed(1)} pts</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckIn(member.id)}
                                className="glass hover:glass-dark"
                                disabled={isCheckInDisabled} // Apply disabled prop here
                            >
                                <Clock className="h-4 w-4 mr-1" />
                                Check-in
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No members assigned to this task.</p>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <Label>Comments</Label>
                  <div ref={commentsScrollRef} className="space-y-3 mt-3 max-h-60 overflow-y-auto">
                    {currentTask.comments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No comments yet.</p>
                    ) : (
                      currentTask.comments.map(comment => (
                        <div key={comment.id} className="glass-dark p-3 rounded-lg"> {/* Menggunakan glass-dark */}
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-sm">{comment.author}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                              </p>
                              {comment.author === currentUser && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEditCommentClick(comment)}
                                    aria-label={`Edit comment by ${comment.author}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive/80"
                                    onClick={() => handleDeleteCommentClick(comment.id)}
                                    aria-label={`Delete comment by ${comment.author}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedCommentText}
                                onChange={(e) => setEditedCommentText(e.target.value)}
                                className="glass min-h-[60px]"
                                aria-label="Edit comment text"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={handleCancelEditingComment} className="glass hover:glass-dark">Cancel</Button>
                                <Button size="sm" onClick={handleSaveEditedComment} variant="gradient" className="btn-gradient-effect">Save</Button> {/* Menggunakan varian gradient */}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{comment.text}</p>
                          )}
                          {comment.imageUrl && (
                            <div className="mt-2 relative group">
                              <img 
                                src={comment.imageUrl} 
                                alt={`Attachment for comment by ${comment.author}`} 
                                className="w-full h-32 object-cover rounded cursor-pointer"
                                onClick={() => setZoomedImage(comment.imageUrl!)}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setZoomedImage(comment.imageUrl!)}
                                aria-label="Maximize comment image"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="glass"
                      rows={2}
                      aria-label="New comment text input"
                    />
                    {commentImage && (
                      <div className="relative w-24 h-24 object-cover rounded-lg overflow-hidden border border-border">
                        <img src={commentImage} alt="Comment image preview" className="w-full h-full object-cover" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                          onClick={() => setCommentImage("")}
                          aria-label="Remove comment image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCommentImageUpload}
                        className="glass flex-1"
                        aria-label="Upload image for comment"
                      />
                      <Button onClick={handleAddComment} size="sm" variant="gradient" className="btn-gradient-effect" aria-label="Send comment"> {/* Menggunakan varian gradient */}
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageViewer 
        imageUrl={zoomedImage} 
        open={!!zoomedImage} 
        onOpenChange={(open) => !open && setZoomedImage(null)} 
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog for deleting comments */}
      <AlertDialog open={showDeleteCommentAlert} onOpenChange={setShowDeleteCommentAlert}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}