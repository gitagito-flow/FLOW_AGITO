import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiquidBackground } from "@/components/LiquidBackground";
import { Search, Filter, CalendarDays, Users, ArrowLeft, ChevronDown, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityLogEntry, ColumnId, TaskType, Project as ProjectType } from "@/lib/types";
import { getActivityLog, deleteActivityLogEntriesByMemberAndTask } from "@/lib/activityLogStorage";
import { getProjects } from "@/lib/storage";
import { allTeams, getTeamById } from "@/lib/teams";
import { columns as allColumns } from "@/lib/columns";
import { format, parseISO, getMonth } from "date-fns";
import { isGraphicOnlyTaskType, isDecorTaskType, isGraphicMotionTaskType } from "@/lib/taskPoints";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ActivityLogSidebar } from "@/components/ActivityLogSidebar";
import { CheckInHistoryDialog } from "@/components/CheckInHistoryDialog";
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
import { toast } from "sonner";

interface CheckInHistoryDetail {
  date: Date;
  status: ColumnId;
}

interface TableRowData {
  id: string; // Unique ID for the row (e.g., memberId-taskId)
  no: number;
  taskName: string;
  taskType: TaskType;
  projectName: string;
  projectId: string;
  memberName: string;
  memberId: string;
  memberDivision: "graphic" | "motion" | "music" | null;
  mostAdvancedStatus: ColumnId;
  firstCheckInDate: Date;
  totalCheckInsCount: number;
  allCheckInsDetails: CheckInHistoryDetail[]; // For the horizontal list
}

interface MemberActivity {
  memberId: string;
  memberName: string;
  division: "graphic" | "motion" | "music" | null;
  activities: TableRowData[];
}

interface DivisionActivity {
  division: "graphic" | "motion" | "music";
  members: MemberActivity[];
}

export default function DailyActivityLogPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedProjectId = (location.state as { projectId?: string } | null)?.projectId;

  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectType[]>([]);
  const [allMembers, setAllMembers] = useState<{ id: string; name: string; division: string | null }[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<"all" | string>("all");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<"all" | string>("all");
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<"all" | string>("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<"all" | number>(new Date().getMonth());
  
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<"all" | "graphic" | "motion" | "music">("all");
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);

  // State for deletion confirmation (REMOVED: showDeleteAlert, logToDelete)
  
  // State for Check-in History Dialog
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyDialogData, setHistoryDialogData] = useState<TableRowData | null>(null);

  const loadLogs = () => {
    const logs = getActivityLog();
    setActivityLogs(logs);
  };

  useEffect(() => {
    loadLogs();

    const projects = getProjects();
    setAllProjects(projects);

    const uniqueMembers = new Map<string, { id: string; name: string; division: string | null }>();
    allTeams.forEach(team => {
      const division = team.id.includes("graphic") ? "graphic" : team.id.includes("motion") ? "motion" : "music";
      team.members.forEach(member => {
        if (!uniqueMembers.has(member.id)) {
          uniqueMembers.set(member.id, {
            id: member.id,
            name: member.name,
            division: division,
          });
        }
      });
    });
    setAllMembers(Array.from(uniqueMembers.values()));

    // Set initial project filter if passed from ProjectView
    if (passedProjectId) {
        setSelectedProjectFilter(passedProjectId);
    } else {
        setSelectedProjectFilter("all");
    }
  }, [passedProjectId]);

  // REMOVED: handleDeleteClick function

  const handleViewHistory = (row: TableRowData) => {
    setHistoryDialogData(row);
    setShowHistoryDialog(true);
  };

  // REMOVED: confirmDelete function

  const getStatusTitle = (columnId: ColumnId) => {
    return allColumns.find(col => col.id === columnId)?.title || columnId.replace(/-/g, ' ');
  };

  const getTaskTitleColorClass = (taskType: TaskType, columnId: ColumnId | undefined, memberDivision: "graphic" | "motion" | "music" | null) => {
    if (!columnId || !memberDivision) return "bg-gray-500 text-white";

    if (memberDivision === "graphic") {
      if (isGraphicOnlyTaskType(taskType) || isDecorTaskType(taskType)) {
        if (["todo-graphics", "wip-graphics"].includes(columnId)) return "bg-red-500 text-white";
        if (["qc-graphics", "revision-graphics"].includes(columnId)) return "bg-yellow-500 text-black";
        if (columnId === "done-graphics") return "bg-green-500 text-white";
      } else if (isGraphicMotionTaskType(taskType)) {
        if (["todo-graphics", "wip-graphics"].includes(columnId)) return "bg-red-500 text-white";
        if (["qc-graphics", "revision-graphics"].includes(columnId)) return "bg-yellow-500 text-black";
        if (["done-graphics", "todo-motion", "wip-motion", "qc-motion", "revision-motion", "final"].includes(columnId)) return "bg-green-500 text-white";
      }
    } else if (memberDivision === "motion" || memberDivision === "music") {
      if (isGraphicMotionTaskType(taskType)) {
        if (["todo-graphics", "wip-graphics", "qc-graphics", "revision-graphics", "done-graphics", "todo-motion", "wip-motion"].includes(columnId)) return "bg-red-500 text-white";
        if (["qc-motion", "revision-motion"].includes(columnId)) return "bg-yellow-500 text-black";
        if (columnId === "final") return "bg-green-500 text-white";
      }
    }
    return "bg-gray-500 text-white";
  };

  const filteredAndGroupedData = useMemo(() => {
    let currentLogs = activityLogs;

    // Filter by Month
    if (selectedMonthFilter !== "all") {
      const targetMonth = selectedMonthFilter;
      currentLogs = currentLogs.filter(log => {
        const logDate = parseISO(log.checkInTime);
        return getMonth(logDate) === targetMonth;
      });
    }

    // Filter by Project
    if (selectedProjectFilter !== "all") {
      currentLogs = currentLogs.filter(log => log.projectId === selectedProjectFilter);
    }

    // Filter by Team
    if (selectedTeamFilter !== "all") {
      const team = getTeamById(selectedTeamFilter);
      if (team) {
        const teamMemberIds = new Set(team.members.map(m => m.id));
        currentLogs = currentLogs.filter(log => teamMemberIds.has(log.memberId));
      }
    }

    // Filter by Member
    if (selectedMemberFilter !== "all") {
      currentLogs = currentLogs.filter(log => log.memberId === selectedMemberFilter);
    }
    
    // Filter by Division (from sidebar)
    if (selectedDivisionFilter !== "all") {
        currentLogs = currentLogs.filter(log => log.memberDivision === selectedDivisionFilter);
    }

    const aggregated = new Map<string, TableRowData>(); // Key: memberId-taskId

    currentLogs.forEach(log => {
      const key = `${log.memberId}-${log.taskId}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          id: key,
          no: 0, // Will be set later
          taskName: log.taskTitle,
          taskType: log.taskType,
          projectName: log.projectTitle,
          projectId: log.projectId,
          memberName: log.memberName,
          memberId: log.memberId,
          memberDivision: log.memberDivision,
          mostAdvancedStatus: log.taskColumnId, // Initial status, will update
          firstCheckInDate: parseISO(log.checkInTime),
          totalCheckInsCount: 0,
          allCheckInsDetails: [],
        });
      }

      const row = aggregated.get(key)!;
      row.totalCheckInsCount++;
      row.allCheckInsDetails.push({ date: parseISO(log.checkInTime), status: log.taskColumnId });

      // Determine most advanced status
      const currentStatusIndex = allColumns.findIndex(col => col.id === row.mostAdvancedStatus);
      const newStatusIndex = allColumns.findIndex(col => col.id === log.taskColumnId);
      if (newStatusIndex > currentStatusIndex) {
        row.mostAdvancedStatus = log.taskColumnId;
      }

      // Keep track of the earliest check-in date
      if (parseISO(log.checkInTime) < row.firstCheckInDate) {
        row.firstCheckInDate = parseISO(log.checkInTime);
      }
    });

    let result = Array.from(aggregated.values());

    // Apply Search Query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(row =>
        row.taskName.toLowerCase().includes(lowerCaseQuery) ||
        row.projectName.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Sort by firstCheckInDate (newest first)
    result.sort((a, b) => b.firstCheckInDate.getTime() - a.firstCheckInDate.getTime());

    // Group by Member (Division grouping is now handled by the sidebar filter)
    const groupedByMember = new Map<string, TableRowData[]>();

    result.forEach(row => {
        if (!groupedByMember.has(row.memberId)) {
            groupedByMember.set(row.memberId, []);
        }
        groupedByMember.get(row.memberId)!.push(row);
    });

    // Final structure conversion (simplified as division is filtered by sidebar)
    const finalGroupedData: MemberActivity[] = Array.from(groupedByMember.entries()).map(([memberId, activities]) => ({
        memberId,
        memberName: activities[0].memberName,
        division: activities[0].memberDivision,
        activities: activities.map((act, index) => ({ ...act, no: index + 1 })),
    })).sort((a, b) => a.memberName.localeCompare(b.memberName));

    // Re-group by division for display, but only include the selected division if filtered
    const divisionGroups: DivisionActivity[] = [];
    const divisions = selectedDivisionFilter === "all" ? ["graphic", "motion", "music"] : [selectedDivisionFilter];

    divisions.forEach(division => {
        const membersInDivision = finalGroupedData.filter(m => m.division === division);
        if (membersInDivision.length > 0) {
            divisionGroups.push({ division, members: membersInDivision });
        }
    });

    return divisionGroups;
  }, [activityLogs, searchQuery, selectedProjectFilter, selectedTeamFilter, selectedMemberFilter, selectedMonthFilter, selectedDivisionFilter]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedProject = allProjects.find(p => p.id === selectedProjectFilter);
  const backPath = passedProjectId ? `/project/${passedProjectId}` : "/dashboard";
  const backButtonLabel = passedProjectId ? "Back to Project" : "Back to Dashboard";

  return (
    <>
      <div className="min-h-screen relative flex">
        <LiquidBackground />

        {/* Left Sidebar */}
        <ActivityLogSidebar
          onBackToDashboard={() => navigate(backPath)}
          selectedDivision={selectedDivisionFilter}
          onSelectDivision={setSelectedDivisionFilter}
          isExpanded={isLeftSidebarExpanded}
          onToggleExpand={() => setIsLeftSidebarExpanded(!isLeftSidebarExpanded)}
          backButtonLabel={backButtonLabel}
        />

        {/* Main content wrapper */}
        <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out overflow-x-hidden",
          isLeftSidebarExpanded ? "ml-64" : "ml-16"
        )}>
          {/* Header (Simplified) */}
          <header className="glass sticky top-0 z-50 border-b border-border/50">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Flow Logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Daily Activity Log
                </h1>
              </div>
            </div>
          </header>

          {/* Selected Project Title */}
          {selectedProject && selectedProjectFilter !== "all" && (
            <div className="glass sticky top-[72px] z-40 border-b border-border/50 py-2 px-6">
              <div className="container mx-auto">
                <h2 className="text-lg font-semibold text-primary">
                  Filtering by Project: {selectedProject.title}
                </h2>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className={cn(
            "glass sticky z-40 border-b border-border/50 py-4 px-6",
            selectedProjectFilter !== "all" ? "top-[116px]" : "top-[72px]"
          )}>
            <div className="container mx-auto flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>

              <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
                <SelectTrigger className="glass w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="all">All Projects</SelectItem>
                  {allProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                <SelectTrigger className="glass w-full sm:w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Team" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="all">All Teams</SelectItem>
                  {allTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMemberFilter} onValueChange={setSelectedMemberFilter}>
                <SelectTrigger className="glass w-full sm:w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Member" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="all">All Members</SelectItem>
                  {allMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonthFilter.toString()} onValueChange={(value) => setSelectedMonthFilter(value === "all" ? "all" : parseInt(value, 10))}>
                <SelectTrigger className="glass w-full sm:w-[180px]">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Month">
                    {selectedMonthFilter === "all" ? "All Months" : months[selectedMonthFilter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((monthName, index) => (
                    <SelectItem key={index} value={index.toString()}>{monthName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Table (Grouped by Member) */}
          <main className="flex-1 px-6 py-8 overflow-hidden">
            <div className="container mx-auto h-full">
              {filteredAndGroupedData.length === 0 ? (
                <div className="glass p-8 rounded-lg text-center">
                  <p className="text-muted-foreground text-lg font-medium">No activity logs found matching your filters.</p>
                </div>
              ) : (
                <ScrollArea className={cn(
                  "h-full",
                  selectedProjectFilter !== "all" ? "max-h-[calc(100vh-240px)]" : "max-h-[calc(100vh-196px)]"
                )}>
                  <div className="space-y-6">
                    {filteredAndGroupedData.map((divisionGroup) => (
                      <Collapsible key={divisionGroup.division} defaultOpen={true}>
                        <CollapsibleTrigger className="w-full glass p-4 rounded-lg flex items-center justify-between text-xl font-bold text-primary hover:glass-dark transition-colors">
                          <span>{divisionGroup.division.toUpperCase()} Division ({divisionGroup.members.length} Members)</span>
                          <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4 space-y-4">
                          {divisionGroup.members.map((memberGroup) => (
                            <div key={memberGroup.memberId} className="glass p-4 rounded-lg"> {/* Member Base Panel */}
                              <Collapsible defaultOpen={true}>
                                <CollapsibleTrigger className="w-full glass-dark p-3 rounded-lg flex items-center justify-between text-lg font-semibold hover:bg-muted/50 transition-colors">
                                  <span>{memberGroup.memberName} ({memberGroup.activities.length} Tasks)</span>
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-3">
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader className="sticky top-0 bg-background glass-dark z-30">
                                        <TableRow>
                                          <TableHead className="w-[50px]">No</TableHead>
                                          <TableHead className="w-[150px]">Project</TableHead>
                                          <TableHead className="w-[200px]">Task Name</TableHead>
                                          <TableHead className="w-[150px]">Task Type</TableHead>
                                          <TableHead className="w-[120px]">Status</TableHead>
                                          <TableHead className="w-[120px]">Date</TableHead>
                                          <TableHead className="w-[120px] text-center">History</TableHead>
                                          {/* REMOVED: Actions TableHead */}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {memberGroup.activities.map((row) => (
                                          <TableRow key={row.id} className="hover:glass-dark transition-colors">
                                            <TableCell>{row.no}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{row.projectName}</TableCell>
                                            <TableCell className="font-medium">
                                              <span className={cn("inline-block p-1 rounded", getTaskTitleColorClass(row.taskType, row.mostAdvancedStatus, row.memberDivision))}>
                                                {row.taskName}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground font-medium">
                                                {row.taskType}
                                            </TableCell>
                                            <TableCell>{getStatusTitle(row.mostAdvancedStatus)}</TableCell>
                                            <TableCell>{format(row.firstCheckInDate, "dd MMM yyyy")}</TableCell>
                                            
                                            {/* View History Button */}
                                            <TableCell className="text-center">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewHistory(row)}
                                                className="glass hover:glass-dark h-10 w-10 p-0 relative overflow-hidden group"
                                              >
                                                {/* Total Check-ins Count */}
                                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary transition-opacity duration-200 group-hover:opacity-0">
                                                  {row.totalCheckInsCount}
                                                </span>
                                                {/* Eye Icon */}
                                                <Eye className="h-4 w-4 absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                              </Button>
                                            </TableCell>

                                            {/* REMOVED: Actions TableCell */}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Check-in History Dialog */}
      {historyDialogData && (
        <CheckInHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          taskName={historyDialogData.taskName}
          memberName={historyDialogData.memberName}
          taskType={historyDialogData.taskType}
          memberDivision={historyDialogData.memberDivision}
          history={historyDialogData.allCheckInsDetails}
          totalCheckIns={historyDialogData.totalCheckInsCount}
        />
      )}

      {/* REMOVED: Delete Confirmation Dialog */}
    </>
  );
}