import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Link as LinkIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Import cn for utility classes

interface ProjectInfoDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectInfoDialog({ project, open, onOpenChange }: ProjectInfoDialogProps) {
  const renderLink = (label: string, url: string | undefined) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass p-3 rounded-lg hover:glass-dark transition-all flex items-center gap-3"
      >
        <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {/* Removed the URL display line */}
        </div>
      </a>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project Details Section */}
          <div className="glass p-5 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Project Type</p>
                <Badge variant="projectType">{project.type}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Event Team</p>
                <p className="font-medium">{project.eventTeamName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Event Start Date</p> {/* Changed label */}
                <p className="font-medium">
                  {project.eventStartDate ? format(new Date(project.eventStartDate), "PPP") : "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Event End Date</p> {/* Changed label */}
                <p className="font-medium">
                  {project.eventEndDate ? format(new Date(project.eventEndDate), "PPP") : "-"}
                </p>
              </div>
            </div>
            {renderLink("Brief Link", project.brief)}
          </div>

          {/* Project Links Section */}
          <div className="glass p-5 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-secondary">
              <LinkIcon className="h-5 w-5" />
              Project Links
            </h3>
            <div className="space-y-3">
              {renderLink("Deck Link", project.deckLink)}
              {renderLink("Graphic Assets Link", project.graphicAssetsLink)}
              {renderLink("3D Assets Link", project.threeDAssetsLink)}
              {renderLink("Video Assets Link", project.videoAssetsLink)}
              {renderLink("Final Animation Link", project.finalAnimationLink)}
              {renderLink("Decor Link", project.decorLink)}
            </div>
          </div>

          {/* Teams Section */}
          <div className="glass p-5 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-accent">
              <Users className="h-5 w-5" />
              Assigned Teams
            </h3>
            <div className="space-y-3">
              {project.graphicTeams.length > 0 && (
                <div className="glass-dark p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-primary">Graphic Teams</p>
                  <div className="flex flex-wrap gap-2">
                    {project.graphicTeams.map((team) => (
                      <Badge key={team} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.motionTeams.length > 0 && (
                <div className="glass-dark p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-secondary">Motion Teams</p>
                  <div className="flex flex-wrap gap-2">
                    {project.motionTeams.map((team) => (
                      <Badge key={team} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.musicTeams.length > 0 && (
                <div className="glass-dark p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-accent">Music Teams</p>
                  <div className="flex flex-wrap gap-2">
                    {project.musicTeams.map((team) => (
                      <Badge key={team} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.graphicTeams.length === 0 && project.motionTeams.length === 0 && project.musicTeams.length === 0 && (
                <p className="text-muted-foreground text-center py-2">No teams assigned to this project.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}