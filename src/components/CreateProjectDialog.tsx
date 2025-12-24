import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { graphicTeams, motionTeams, musicTeam } from "@/lib/teams";
import { ProjectType } from "@/lib/types";
import { projectApi } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { TeamSelectionButton } from "./TeamSelectionButton";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "Project" as ProjectType,
    eventTeamName: "",
    brief: "",
    eventStartDate: undefined as Date | undefined,
    eventEndDate: undefined as Date | undefined,
    deckLink: "",
    graphicAssetsLink: "",
    threeDAssetsLink: "",
    videoAssetsLink: "",
    finalAnimationLink: "",
    decorLink: "",
    graphicTeams: [] as string[],
    motionTeams: [] as string[],
    musicTeams: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.eventStartDate || !formData.eventEndDate) {
      toast.error("Please fill in all required fields: Project Title, Event Start Date, and Event End Date.");
      return;
    }

    if (formData.eventStartDate > formData.eventEndDate) {
      toast.error("Event Start Date cannot be after Event End Date.");
      return;
    }

    try {
      await projectApi.create(formData);
      toast.success("Project created successfully!");
      onProjectCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "Project",
      eventTeamName: "",
      brief: "",
      eventStartDate: undefined,
      eventEndDate: undefined,
      deckLink: "",
      graphicAssetsLink: "",
      threeDAssetsLink: "",
      videoAssetsLink: "",
      finalAnimationLink: "",
      decorLink: "",
      graphicTeams: [],
      motionTeams: [],
      musicTeams: [],
    });
  };

  const toggleTeam = (teamId: string, category: "graphicTeams" | "motionTeams" | "musicTeams") => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(teamId)
        ? prev[category].filter(id => id !== teamId)
        : [...prev[category], teamId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Project</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6 pr-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Project Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProjectType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Pitching">Pitching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventTeamName">Event Team Name</Label>
                <Input
                  id="eventTeamName"
                  value={formData.eventTeamName}
                  onChange={(e) => setFormData({ ...formData, eventTeamName: e.target.value })}
                  className="glass"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartDate">Event Start Date *</Label>
                <DatePicker
                  date={formData.eventStartDate}
                  setDate={(date) => setFormData({ ...formData, eventStartDate: date || undefined })}
                  placeholder="Select start date"
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventEndDate">Event End Date *</Label>
                <DatePicker
                  date={formData.eventEndDate}
                  setDate={(date) => setFormData({ ...formData, eventEndDate: date || undefined })}
                  placeholder="Select end date"
                  className="glass"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brief">Brief Link</Label>
              <Input
                id="brief"
                type="url"
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                className="glass"
                placeholder="https://"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deckLink">Deck Link</Label>
                <Input
                  id="deckLink"
                  type="url"
                  value={formData.deckLink}
                  onChange={(e) => setFormData({ ...formData, deckLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graphicAssetsLink">Graphic Assets</Label>
                <Input
                  id="graphicAssetsLink"
                  type="url"
                  value={formData.graphicAssetsLink}
                  onChange={(e) => setFormData({ ...formData, graphicAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threeDAssetsLink">3D Assets</Label>
                <Input
                  id="threeDAssetsLink"
                  type="url"
                  value={formData.threeDAssetsLink}
                  onChange={(e) => setFormData({ ...formData, threeDAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoAssetsLink">Video Assets</Label>
                <Input
                  id="videoAssetsLink"
                  type="url"
                  value={formData.videoAssetsLink}
                  onChange={(e) => setFormData({ ...formData, videoAssetsLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalAnimationLink">Final Animation</Label>
                <Input
                  id="finalAnimationLink"
                  type="url"
                  value={formData.finalAnimationLink}
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
                  value={formData.decorLink}
                  onChange={(e) => setFormData({ ...formData, decorLink: e.target.value })}
                  className="glass"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Graphic</Label>
                  <div className="space-y-2 glass-dark p-4 rounded-lg">
                    {graphicTeams.map((team) => (
                      <TeamSelectionButton
                        key={team.id}
                        teamId={team.id}
                        teamName={team.name}
                        isSelected={formData.graphicTeams.includes(team.id)}
                        onToggle={(id) => toggleTeam(id, "graphicTeams")}
                        category="graphic"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Motion</Label>
                  <div className="space-y-2 glass-dark p-4 rounded-lg">
                    {motionTeams.map((team) => (
                      <TeamSelectionButton
                        key={team.id}
                        teamId={team.id}
                        teamName={team.name}
                        isSelected={formData.motionTeams.includes(team.id)}
                        onToggle={(id) => toggleTeam(id, "motionTeams")}
                        category="motion"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Music</Label>
                <div className="space-y-2 glass-dark p-4 rounded-lg">
                  <TeamSelectionButton
                    teamId={musicTeam.id}
                    teamName={musicTeam.name}
                    isSelected={formData.musicTeams.includes(musicTeam.id)}
                    onToggle={(id) => toggleTeam(id, "musicTeams")}
                    category="music"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 glass hover:glass-dark"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1 btn-gradient-effect"
              >
                Create Project
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}