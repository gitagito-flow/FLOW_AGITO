export type ProjectType = "Project" | "Pitching";

export type TaskType =
  | "CLIP"
  | "PRESENTATION"
  | "BUMPER"
  | "BACKGROUND"
  | "MINOR_ITEMS_ANIMATION"
  | "BRANDING"
  | "ADVERTISING"
  | "MICROSITE_UI_DESIGN"
  | "DIGITAL_MEDIA"
  | "PRINTED_MEDIA_MINOR_DESIGN"
  | "PRINTED_INFORMATION"
  | "PRINTED_DECORATION"
  | "CUTTING_MAL_RESIZE";

export type ColumnId =
  | "todo-graphics"
  | "wip-graphics"
  | "qc-graphics"
  | "revision-graphics"
  | "done-graphics"
  | "todo-motion"
  | "wip-motion"
  | "qc-motion"
  | "revision-motion"
  | "final";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export interface MemberAssignment {
  memberId: string;
  percentage: number; // Percentage of total task points assigned to this member (0-100)
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  imageUrl?: string;
  createdAt: string;
}

// New interface for Concerns
export interface Concern {
  id: string;
  text: string;
  author: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  points: number;
  deadline: string;
  graphicLink?: string;
  animationLink?: string;
  musicLink?: string;
  assignedGraphic: string[];
  assignedMotion: string[];
  assignedMusic: string[];
  memberAssignments: MemberAssignment[]; // New field for point distribution
  imageUrl?: string;
  columnId: ColumnId;
  comments: Comment[];
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  eventTeamName: string;
  brief: string;
  eventStartDate: string; // New field
  eventEndDate: string; // Renamed from deadline
  deckLink?: string;
  graphicAssetsLink?: string;
  threeDAssetsLink?: string;
  videoAssetsLink?: string;
  finalAnimationLink?: string;
  decorLink?: string; // New field for Decor Link
  graphicTeams: string[];
  motionTeams: string[];
  musicTeams: string[];
  backgroundUrl?: string;
  tasks: Task[];
  comments: Comment[]; // Existing comments for project level
  concerns: Concern[]; // New field for project-level concerns
  status: "active" | "archived"; // New field
  updatedAt: string; // New field
  createdAt: string;
}

// New interface for Daily Activity Log Entry
export interface ActivityLogEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberDivision: "graphic" | "motion" | "music" | null;
  projectId: string; // NEW: ID of the project
  projectTitle: string; // NEW: Title of the project
  taskId: string;
  taskTitle: string;
  taskType: TaskType; // NEW FIELD
  taskColumnId: ColumnId;
  checkInTime: string; // ISO string
  checkInDateOnly: string; // NEW FIELD: YYYY-MM-DD format
}