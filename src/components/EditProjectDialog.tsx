import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, ProjectType } from "@/lib/types";
import { graphicTeams, motionTeams, musicTeam } from "@/lib/teams";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { TeamSelectionButton } from "./TeamSelectionButton";

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate: (project: Project) => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onProjectUpdate }: EditProjectDialogProps) {
  const [formData, setFormData] = useState<Partial<Project>>({});

  useEffect(() => {
    if (project) {
      const initialStartDate = project.eventStartDate ? new Date(project.eventStartDate) : undefined;
      const initialEndDate = project.eventEndDate ? new Date(project.eventEndDate) : undefined;

      setFormData({
        ...project,
        eventStartDate: initialStartDate as any,
        eventEndDate: initialEndDate as any,
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !formData.title || !formData.type || !formData.eventStartDate || !formData.eventEndDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const updatedProject: Project = {
      ...project,
      title: formData.title,
      type: formData.type as ProjectType,
      eventTeamName: formData.eventTeamName || "",
      brief: formData.brief || "",
      eventStartDate: new Date(formData.eventStartDate as any).toISOString(),
      eventEndDate: new Date(formData.eventEndDate as any).toISOString(),
      deckLink: formData.deckLink || "",
      graphicAssetsLink: formData.graphicAssetsLink || "",
      threeDAssetsLink: formData.threeDAssetsLink || "",
      videoAssetsLink: formData.videoAssetsLink || "",
      finalAnimationLink: formData.finalAnimationLink || "",
      decorLink: formData.decorLink || "",
      graphicTeams: formData.graphicTeams || [],
      motionTeams: formData.motionTeams || [],
      musicTeams: formData.musicTeams || [],
    };

    onProjectUpdate(updatedProject);
    onOpenChange(false);
  };

  const toggleTeam = (teamId: string, category: "graphic" | "motion" | "music") => {
    const key = `${category}Teams` as keyof Pick<Project, "graphicTeams" | "motionTeams" | "musicTeams">;
    const currentTeams = (formData[key] || []) as string[];
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter((id) => id !== teamId)
      : [...currentTeams, teamId];
    setFormData({ ...formData, [key]: newTeams });
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Project Type *</Label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) => setFormData({ ...formData, type: value as ProjectType })}
              >
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Pitching">Pitching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartDate">Event Start Date *</Label>
                <DatePicker
                  date={formData.eventStartDate as any}
                  setDate={(date) => setFormData({ ...formData, eventStartDate: date as any })}
                  placeholder="Select start date"
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventEndDate">Event End Date *</Label>
                <DatePicker
                  date={formData.eventEndDate as any}
                  setDate={(date) => setFormData({ ...formData, eventEndDate: date as any })}
                  placeholder="Select end date"
                  className="glass"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTeamName">Event Team Name *</Label>
              <Input
                id="eventTeamName"
                value={formData.eventTeamName || ""}
                onChange={(e) => setFormData({ ...formData, eventTeamName: e.target.value })}
                className="glass"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brief">Brief Link *</Label>
              <Input
                id="brief"
                type="url"
                value={formData.brief || ""}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                className="glass"
                placeholder="https://"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deckLink">Deck Link</Label>
                <Input
                  id="deckLink"
                  type="url"
                  value={formData.deckLink || ""}
                  onChange={(e) => setFormData({ ...formData, deckLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graphicAssetsLink">Graphic Assets Link</Label>
                <Input
                  id="graphicAssetsLink"
                  type="url"
                  value={formData.graphicAssetsLink || ""}
                  onChange={(e) => setFormData({ ...formData, graphicAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threeDAssetsLink">3D Assets Link</Label>
                <Input
                  id="threeDAssetsLink"
                  type="url"
                  value={formData.threeDAssetsLink || ""}
                  onChange={(e) => setFormData({ ...formData, threeDAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoAssetsLink">Video Assets Link</Label>
                <Input
                  id="videoAssetsLink"
                  type="url"
                  value={formData.videoAssetsLink || ""}
                  onChange={(e) => setFormData({ ...formData, videoAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalAnimationLink">Final Animation Link</Label>
                <Input
                  id="finalAnimationLink"
                  type="url"
                  value={formData.finalAnimationLink || ""}
                  onChange={(e) => setFormData({ ...formData, finalAnimationLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decorLink">Decor Link</Label>
                <Input
                  id="decorLink"
                  type="url"
                  value={formData.decorLink || ""}
                  onChange={(e) => setFormData({ ...formData, decorLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Graphic</Label>
                <div className="glass-dark p-4 rounded-lg space-y-2">
                  {graphicTeams.map((team) => (
                    <TeamSelectionButton
                      key={team.id}
                      teamId={team.id}
                      teamName={team.name}
                      isSelected={(formData.graphicTeams || []).includes(team.id)}
                      onToggle={(id) => toggleTeam(id, "graphic")}
                      category="graphic"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motion</Label>
                <div className="glass-dark p-4 rounded-lg space-y-2">
                  {motionTeams.map((team) => (
                    <TeamSelectionButton
                      key={team.id}
                      teamId={team.id}
                      teamName={team.name}
                      isSelected={(formData.motionTeams || []).includes(team.id)}
                      onToggle={(id) => toggleTeam(id, "motion")}
                      category="motion"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Music</Label>
              <div className="glass-dark p-4 rounded-lg space-y-2">
                <TeamSelectionButton
                  teamId={musicTeam.id}
                  teamName={musicTeam.name}
                  isSelected={(formData.musicTeams || []).includes(musicTeam.id)}
                  onToggle={(id) => toggleTeam(id, "music")}
                  category="music"
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="glass">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}