import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/lib/types";

interface MemberAssignmentSectionProps {
  projectMembers: {
    graphic: TeamMember[];
    motion: TeamMember[];
    music: TeamMember[];
  };
  assignedMembers: string[];
  memberPercentages: Record<string, number>;
  toggleMemberAssignment: (memberId: string, category: "graphic" | "motion" | "music") => void;
  handlePercentageChange: (memberId: string, value: string) => void;
}

const categoryMap = {
  graphic: "Graphic",
  motion: "Motion",
  music: "Music",
};

export function MemberAssignmentSection({
  projectMembers,
  assignedMembers,
  memberPercentages,
  toggleMemberAssignment,
  handlePercentageChange,
}: MemberAssignmentSectionProps) {

  // Calculate individual category totals
  const graphicAssignedMembers = projectMembers.graphic.filter(m => assignedMembers.includes(m.id));
  const graphicTotal = graphicAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isGraphicValid = graphicAssignedMembers.length === 0 || graphicTotal === 100;

  const motionAssignedMembers = projectMembers.motion.filter(m => assignedMembers.includes(m.id));
  const motionTotal = motionAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isMotionValid = motionAssignedMembers.length === 0 || motionTotal === 100;

  const musicAssignedMembers = projectMembers.music.filter(m => assignedMembers.includes(m.id));
  const musicTotal = musicAssignedMembers.reduce((sum, member) => sum + (memberPercentages[member.id] || 0), 0);
  const isMusicValid = musicAssignedMembers.length === 0 || musicTotal === 100;


  const renderDivisionSection = (members: TeamMember[], categoryKey: keyof typeof categoryMap, categoryTotal: number, isValid: boolean) => {
    const categoryName = categoryMap[categoryKey];
    
    const assignedInThisCategory = members.filter(m => assignedMembers.includes(m.id));

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-bold text-primary">{categoryName} Team Members</Label>
          {assignedInThisCategory.length > 0 && (
            <span className={cn(
              "text-sm font-bold",
              isValid ? "text-success" : "text-destructive"
            )}>
              {categoryTotal}% / 100%
            </span>
          )}
        </div>
        <div className="glass p-3 rounded-lg space-y-3">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">No {categoryName.toLowerCase()} team members available for this task type.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map(member => (
                <Button
                  key={member.id}
                  type="button"
                  size="sm"
                  variant={assignedMembers.includes(member.id) ? "default" : "outline"} // Menggunakan varian default atau outline
                  onClick={() => toggleMemberAssignment(member.id, categoryKey)}
                  className={cn(
                    "transition-all",
                    assignedMembers.includes(member.id) ? "" : "glass hover:glass-dark" // Hapus bg-primary/90, gunakan default
                  )}
                >
                  {member.name}
                </Button>
              ))}
            </div>
          )}
          
          {/* Percentage Input for Assigned Members in this category */}
          {assignedInThisCategory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Point Distribution</p>
              {assignedInThisCategory.map(member => (
                <div key={member.id} className="flex items-center gap-3 glass-dark p-3 rounded-lg"> {/* Menggunakan glass-dark */}
                  <Label htmlFor={`percent-${member.id}`} className="flex-1 truncate">
                    {member.name}
                  </Label>
                  <div className="flex items-center w-24">
                    <Input
                      id={`percent-${member.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={memberPercentages[member.id] || 0}
                      onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                      className="glass w-16 text-right p-2 h-8"
                    />
                    <span className="ml-1">%</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => toggleMemberAssignment(member.id, categoryKey)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Team Assignment & Point Distribution</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderDivisionSection(projectMembers.graphic, "graphic", graphicTotal, isGraphicValid)}
        {renderDivisionSection(projectMembers.motion, "motion", motionTotal, isMotionValid)}
      </div>
      {renderDivisionSection(projectMembers.music, "music", musicTotal, isMusicValid)}
    </div>
  );
}