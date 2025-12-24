import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { ActivityLogEntry } from "@/lib/types";
import { getActivityLog } from "@/lib/activityLogStorage";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { allTeams } from "@/lib/teams";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

type Division = "graphic" | "motion" | "music";
type TabValue = "all" | "inactive"; // Simplified TabValue

interface CurrentlyWorkingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberActivitySummary {
  memberId: string;
  memberName: string;
  division: Division | null;
  teamName: string;
  tasksCheckedIn: {
    taskId: string;
    taskTitle: string;
    projectTitle: string;
    checkInTime: string;
  }[];
}

interface TeamGroup {
  teamName: string;
  members: MemberActivitySummary[];
}

export function CurrentlyWorkingPanel({ open, onOpenChange }: CurrentlyWorkingPanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [activeMembers, setActiveMembers] = useState<MemberActivitySummary[]>([]);
  const [inactiveMembers, setInactiveMembers] = useState<MemberActivitySummary[]>([]);

  const allMembersList = useMemo(() => {
    const list: MemberActivitySummary[] = [];
    allTeams.forEach(team => {
      const division: Division | null = team.id.includes("graphic") ? "graphic" : team.id.includes("motion") ? "motion" : team.id.includes("music") ? "music" : null;
      team.members.forEach(member => {
        list.push({
          memberId: member.id,
          memberName: member.name,
          division,
          teamName: team.name,
          tasksCheckedIn: [],
        });
      });
    });
    return list;
  }, []);

  useEffect(() => {
    if (!open) return;

    const todayDateOnly = format(new Date(), "yyyy-MM-dd");
    const allLogs = getActivityLog();
    const todayLogs = allLogs.filter(log => log.checkInDateOnly === todayDateOnly);

    const activeMemberIds = new Set<string>();
    const memberMap = new Map<string, MemberActivitySummary>();

    // 1. Aggregate active members from today's logs
    todayLogs.forEach(log => {
      activeMemberIds.add(log.memberId);
      
      if (!memberMap.has(log.memberId)) {
        const memberInfo = allMembersList.find(m => m.memberId === log.memberId);
        if (memberInfo) {
          memberMap.set(log.memberId, { ...memberInfo, tasksCheckedIn: [] });
        } else {
          // Fallback for unknown member (shouldn't happen if allTeams is comprehensive)
          memberMap.set(log.memberId, {
            memberId: log.memberId,
            memberName: log.memberName,
            division: log.memberDivision as Division | null,
            teamName: "Unknown Team",
            tasksCheckedIn: [],
          });
        }
      }

      const memberSummary = memberMap.get(log.memberId)!;
      
      if (!memberSummary.tasksCheckedIn.some(t => t.taskId === log.taskId)) {
        memberSummary.tasksCheckedIn.push({
          taskId: log.taskId,
          taskTitle: log.taskTitle,
          projectTitle: log.projectTitle,
          checkInTime: log.checkInTime,
        });
      }
    });

    // Sort active members by division and then name
    const sortedActive = Array.from(memberMap.values()).sort((a, b) => {
      // Custom sort order: Graphic, Motion, Music, then null
      const order = { graphic: 1, motion: 2, music: 3, null: 4 };
      const divisionA = a.division || 'null';
      const divisionB = b.division || 'null';

      if (divisionA !== divisionB) {
        return order[divisionA] - order[divisionB];
      }
      return a.memberName.localeCompare(b.memberName);
    });

    setActiveMembers(sortedActive);

    // 2. Determine inactive members
    const inactive = allMembersList
      .filter(member => !activeMemberIds.has(member.memberId))
      .sort((a, b) => a.memberName.localeCompare(b.memberName));
    setInactiveMembers(inactive);

  }, [open, allMembersList]);

  const getDivisionBadgeClass = (division: string | null) => {
    switch (division) {
      case 'graphic': return 'bg-primary/20 text-primary';
      case 'motion': return 'bg-secondary/20 text-secondary';
      case 'music': return 'bg-accent/20 text-accent';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  // Group members by team name
  const getFilteredAndGroupedMembers = (tab: TabValue): TeamGroup[] => {
    let membersToProcess: MemberActivitySummary[];

    if (tab === "all") {
      membersToProcess = activeMembers;
    } else if (tab === "inactive") {
      membersToProcess = inactiveMembers;
    } else {
      // Should not happen with new TabValue, but keep for safety
      return [];
    }

    // Group by team name
    const teamGroups = new Map<string, MemberActivitySummary[]>();
    membersToProcess.forEach(member => {
        if (!teamGroups.has(member.teamName)) {
            teamGroups.set(member.teamName, []);
        }
        teamGroups.get(member.teamName)!.push(member);
    });

    return Array.from(teamGroups.entries()).map(([teamName, members]) => ({
        teamName,
        members: members.sort((a, b) => a.memberName.localeCompare(b.memberName)),
    })).sort((a, b) => a.teamName.localeCompare(b.teamName));
  };

  const renderMemberCard = (member: MemberActivitySummary, isActive: boolean) => (
    <div key={member.memberId} className="glass-dark p-3 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0">
          <span className="font-bold text-base">{member.memberName}</span>
          <Badge variant="secondary" className="text-xs w-fit mt-1">
            {member.teamName}
          </Badge>
        </div>
        {/* Modified Badge logic */}
        <Badge className={cn("text-xs font-semibold", isActive ? getDivisionBadgeClass(member.division) : 'bg-destructive/20 text-destructive')}>
          {isActive 
            ? (member.division ? member.division.toUpperCase() : '') // Display division or empty string if null
            : 'INACTIVE'
          }
        </Badge>
      </div>
      
      {isActive && member.tasksCheckedIn.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground">Checked In Tasks ({member.tasksCheckedIn.length}):</p>
          {member.tasksCheckedIn.map((task) => (
            <div key={task.taskId} className="glass p-2 rounded-md flex justify-between items-center text-xs">
              <div className="truncate">
                <p className="font-medium truncate">{task.taskTitle}</p>
                <p className="text-xs text-muted-foreground truncate">({task.projectTitle})</p>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                {format(new Date(task.checkInTime), "HH:mm")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = (tab: TabValue) => {
    const groupedMembers = getFilteredAndGroupedMembers(tab);
    const isActive = tab !== "inactive";

    if (groupedMembers.length === 0) {
      return (
        <div className="glass p-6 rounded-lg text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {tab === "inactive" ? "All members are currently active today!" : "No active members found today."}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(90vh-250px)] pr-4">
        <div className="space-y-6">
          {groupedMembers.map(teamGroup => (
            <div key={teamGroup.teamName} className="space-y-3">
              <h4 className="text-lg font-bold text-primary border-b border-border/50 pb-1">
                {teamGroup.teamName} ({teamGroup.members.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamGroup.members.map(member => renderMemberCard(member, isActive))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const totalActiveMembers = activeMembers.length;
  const totalInactiveMembers = inactiveMembers.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Clock className="h-6 w-6 text-primary" />
            Currently Working Today
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4 flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-dark p-3 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Active:</p>
              <span className="text-2xl font-bold text-primary">{totalActiveMembers}</span>
            </Card>
            <Card className="glass-dark p-3 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Inactive:</p>
              <span className="text-2xl font-bold text-destructive">{totalInactiveMembers}</span>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 glass">
              <TabsTrigger value="all" className="glass-dark data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Active</TabsTrigger>
              <TabsTrigger value="inactive" className="glass-dark data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Inactive ({totalInactiveMembers})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderTabContent("all")}
            </TabsContent>
            <TabsContent value="inactive" className="mt-4">
              {renderTabContent("inactive")}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}