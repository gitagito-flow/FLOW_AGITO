import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    decimal,
    integer,
    jsonb,
    date,
    primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    initials: varchar("initials", { length: 5 }),
    role: varchar("role", { length: 20 }).default("member").notNull(), // admin, member
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    teamMembers: many(teamMembers),
    taskAssignments: many(taskAssignments),
    comments: many(comments),
    concerns: many(concerns),
    activityLogs: many(activityLogs),
}));

// ============================================================================
// TEAMS
// ============================================================================
export const teams = pgTable("teams", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // graphic, motion, music
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
    members: many(teamMembers),
    projectTeams: many(projectTeams),
}));

// ============================================================================
// TEAM MEMBERS (Junction)
// ============================================================================
export const teamMembers = pgTable(
    "team_members",
    {
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        teamId: uuid("team_id")
            .references(() => teams.id, { onDelete: "cascade" })
            .notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.userId, t.teamId] }),
    })
);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
    user: one(users, {
        fields: [teamMembers.userId],
        references: [users.id],
    }),
    team: one(teams, {
        fields: [teamMembers.teamId],
        references: [teams.id],
    }),
}));

// ============================================================================
// PROJECTS
// ============================================================================
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // Project, Pitching
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, archived
    eventTeamName: varchar("event_team_name", { length: 100 }),
    brief: text("brief"),
    eventStartDate: timestamp("event_start_date").notNull(),
    eventEndDate: timestamp("event_end_date").notNull(),
    backgroundUrl: text("background_url"),
    assetLinks: jsonb("asset_links").$type<{
        deckLink?: string;
        graphicAssetsLink?: string;
        threeDAssetsLink?: string;
        videoAssetsLink?: string;
        finalAnimationLink?: string;
        decorLink?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
    teams: many(projectTeams),
    tasks: many(tasks),
    comments: many(comments),
    concerns: many(concerns),
    activityLogs: many(activityLogs),
}));

// ============================================================================
// PROJECT TEAMS (Junction)
// ============================================================================
export const projectTeams = pgTable(
    "project_teams",
    {
        projectId: uuid("project_id")
            .references(() => projects.id, { onDelete: "cascade" })
            .notNull(),
        teamId: uuid("team_id")
            .references(() => teams.id)
            .notNull(),
        role: varchar("role", { length: 20 }).notNull(), // graphic, motion, music
    },
    (t) => ({
        pk: primaryKey({ columns: [t.projectId, t.teamId] }),
    })
);

export const projectTeamsRelations = relations(projectTeams, ({ one }) => ({
    project: one(projects, {
        fields: [projectTeams.projectId],
        references: [projects.id],
    }),
    team: one(teams, {
        fields: [projectTeams.teamId],
        references: [teams.id],
    }),
}));

// ============================================================================
// TASKS
// ============================================================================
export const tasks = pgTable("tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // TaskType enum values
    points: decimal("points", { precision: 5, scale: 2 }).notNull(),
    columnId: varchar("column_id", { length: 30 }).notNull(), // ColumnId enum values
    deadline: timestamp("deadline"),
    imageUrl: text("image_url"),
    graphicLink: text("graphic_link"),
    animationLink: text("animation_link"),
    musicLink: text("music_link"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    assignments: many(taskAssignments),
    comments: many(comments),
    activityLogs: many(activityLogs),
}));

// ============================================================================
// TASK ASSIGNMENTS
// ============================================================================
export const taskAssignments = pgTable("task_assignments", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
        .references(() => tasks.id, { onDelete: "cascade" })
        .notNull(),
    userId: uuid("user_id")
        .references(() => users.id)
        .notNull(),
    role: varchar("role", { length: 20 }).notNull(), // graphic, motion, music
    percentage: integer("percentage").default(100).notNull(), // Point distribution
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
    task: one(tasks, {
        fields: [taskAssignments.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [taskAssignments.userId],
        references: [users.id],
    }),
}));

// ============================================================================
// COMMENTS
// ============================================================================
export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
        .references(() => users.id)
        .notNull(),
    text: text("text").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
    project: one(projects, {
        fields: [comments.projectId],
        references: [projects.id],
    }),
    task: one(tasks, {
        fields: [comments.taskId],
        references: [tasks.id],
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id],
    }),
}));

// ============================================================================
// CONCERNS
// ============================================================================
export const concerns = pgTable("concerns", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    authorId: uuid("author_id")
        .references(() => users.id)
        .notNull(),
    text: text("text").notNull(),
    resolved: boolean("resolved").default(false).notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const concernsRelations = relations(concerns, ({ one }) => ({
    project: one(projects, {
        fields: [concerns.projectId],
        references: [projects.id],
    }),
    author: one(users, {
        fields: [concerns.authorId],
        references: [users.id],
    }),
}));

// ============================================================================
// ACTIVITY LOGS
// ============================================================================
export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id)
        .notNull(),
    projectId: uuid("project_id")
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    taskId: uuid("task_id")
        .references(() => tasks.id, { onDelete: "cascade" })
        .notNull(),
    taskColumnId: varchar("task_column_id", { length: 30 }).notNull(),
    checkInTime: timestamp("check_in_time").defaultNow().notNull(),
    checkInDate: date("check_in_date").notNull(), // For easy daily queries (YYYY-MM-DD)
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    user: one(users, {
        fields: [activityLogs.userId],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [activityLogs.projectId],
        references: [projects.id],
    }),
    task: one(tasks, {
        fields: [activityLogs.taskId],
        references: [tasks.id],
    }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Concern = typeof concerns.$inferSelect;
export type NewConcern = typeof concerns.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
