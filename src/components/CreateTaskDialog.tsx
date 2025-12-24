import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskType, MemberAssignment, TeamMember } from "@/lib/types";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getProjectMembers } from "@/lib/teams";
import { 
  getTaskPoints, 
  isGraphicOnlyTaskType, 
  isDecorTaskType, 
  isGraphicMotionTaskType 
} from "@/lib/taskPoints";
import { Project } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemberAssignmentSection } from "./MemberAssignmentSection";

interface CreateTaskDialogProps {
  project: Project;
  onTaskCreate: (task: Task) => void;
  open: boolean; // Added
  onOpenChange: (open: boolean) => void; // Added
}

export function CreateTaskDialog({ project, onTaskCreate, open, onOpenChange }: CreateTaskDialogProps) { // Updated props
  // const [open, setOpen] = useState(false); // Removed local state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("CLIP");
  const [graphicLink, setGraphicLink] = useState("");
  const [animationLink, setAnimationLink] = useState("");
  const [musicLink, setMusicLink] = useState("");
  
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [memberPercentages, setMemberPercentages] = useState<Record<string, number>>({});
  const [imageUrl, setImageUrl] = useState("");

  const projectMembers = getProjectMembers(project);

  // Filter project members based on selected task type
  const getFilteredProjectMembers = (currentTaskType: TaskType) => {
    const filtered = { graphic: [] as TeamMember[], motion: [] as TeamMember[], music: [] as TeamMember[] };
    
    if (isGraphicOnlyTaskType(currentTaskType) || isDecorTaskType(currentTaskType)) {
      filtered.graphic = projectMembers.graphic;
      // Music team members should be excluded for Graphic Only and Decor tasks
    } else if (isGraphicMotionTaskType(currentTaskType)) {
      filtered.graphic = projectMembers.graphic;
      filtered.motion = projectMembers.motion;
      filtered.music = projectMembers.music; // Music team is available for Graphic-Motion tasks
    }
    return filtered;
  };

  const filteredProjectMembers = getFilteredProjectMembers(taskType);

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

  // Overall validity check
  const isOverallAssignmentValid = isGraphicValid && isMotionValid && isMusicValid;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTaskType("CLIP");
    setGraphicLink("");
    setAnimationLink("");
    setMusicLink("");
    setAssignedMembers([]);
    setImageUrl("");
    setMemberPercentages({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error("Please fill in the task title.");
      return;
    }

    if (!isOverallAssignmentValid) {
      let errorMessage = "Point distribution for assigned members must total 100% in each category: ";
      if (graphicAssignedMembers.length > 0 && !isGraphicValid) errorMessage += "Graphic Team ";
      if (motionAssignedMembers.length > 0 && !isMotionValid) errorMessage += "Motion Team ";
      if (musicAssignedMembers.length > 0 && !isMusicValid) errorMessage += "Music Team ";
      toast.error(errorMessage.trim());
      return;
    }

    const graphicIds = assignedMembers.filter(id => filteredProjectMembers.graphic.some(m => m.id === id));
    const motionIds = assignedMembers.filter(id => filteredProjectMembers.motion.some(m => m.id === id));
    const musicIds = assignedMembers.filter(id => filteredProjectMembers.music.some(m => m.id === id));

    // Always set initial column to "todo-graphics"
    const initialColumnId: Task["columnId"] = "todo-graphics";

    const memberAssignments: MemberAssignment[] = assignedMembers.map(memberId => ({
      memberId,
      percentage: memberPercentages[memberId] || 0,
    }));

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      type: taskType,
      points: getTaskPoints(taskType),
      deadline: "", 
      graphicLink,
      animationLink,
      musicLink,
      assignedGraphic: graphicIds,
      assignedMotion: motionIds,
      assignedMusic: musicIds,
      memberAssignments,
      imageUrl,
      columnId: initialColumnId,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    onTaskCreate(newTask);
    toast.success("Task created successfully");
    
    resetForm();
    onOpenChange(false); // Close dialog after creation
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMemberAssignment = (memberId: string, category: "graphic" | "motion" | "music") => {
    setAssignedMembers(prevAssigned => {
      const isAssigned = prevAssigned.includes(memberId);
      let newAssigned: string[];

      // Check if the member's category is allowed for the current task type
      const isAllowedCategory = 
        (category === "graphic" && (isGraphicOnlyTaskType(taskType) || isDecorTaskType(taskType) || isGraphicMotionTaskType(taskType))) ||
        (category === "motion" && isGraphicMotionTaskType(taskType)) ||
        (category === "music" && isGraphicMotionTaskType(taskType)); // Music is only allowed for Graphic-Motion tasks

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}> {/* Use props for open/onOpenChange */}
      {/* Removed DialogTrigger */}
      <DialogContent className="glass max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taskType">Task Type *</Label>
                <Select 
                  value={taskType} 
                  onValueChange={(v: TaskType) => {
                    setTaskType(v);
                    // Reset assigned members and percentages when task type changes
                    setAssignedMembers([]);
                    setMemberPercentages({});
                  }}
                >
                  <SelectTrigger className="glass">
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
                <Label htmlFor="graphicLink">Graphic Link</Label>
                <Input
                  id="graphicLink"
                  type="url"
                  value={graphicLink}
                  onChange={(e) => setGraphicLink(e.target.value)}
                  className="glass"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animationLink">Animation Link</Label>
                <Input
                  id="animationLink"
                  type="url"
                  value={animationLink}
                  onChange={(e) => setAnimationLink(e.target.value)}
                  className="glass"
                />
              </div>
              <div>
                <Label htmlFor="musicLink">Music Link</Label>
                <Input
                  id="musicLink"
                  type="url"
                  value={musicLink}
                  onChange={(e) => setMusicLink(e.target.value)}
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
              <Label htmlFor="image">Upload Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="glass"
              />
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                variant="gradient" // Menggunakan varian gradient
                className="flex-1 btn-gradient-effect" // Menerapkan efek gradient
                disabled={!title || !isOverallAssignmentValid}
              >
                Create Task
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="glass hover:glass-dark"> {/* Use onOpenChange */}
                Cancel
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}