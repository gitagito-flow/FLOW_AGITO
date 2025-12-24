import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects, projectTeams, tasks, NewProject } from "../db/schema.js";

export interface CreateProjectInput {
    title: string;
    type: "Project" | "Pitching";
    eventTeamName?: string;
    brief?: string;
    eventStartDate: Date;
    eventEndDate: Date;
    backgroundUrl?: string;
    assetLinks?: {
        deckLink?: string;
        graphicAssetsLink?: string;
        threeDAssetsLink?: string;
        videoAssetsLink?: string;
        finalAnimationLink?: string;
        decorLink?: string;
    };
    graphicTeamIds?: string[];
    motionTeamIds?: string[];
    musicTeamIds?: string[];
}

export async function createProject(input: CreateProjectInput) {
    // Start transaction
    return await db.transaction(async (tx) => {
        // Create project
        const [project] = await tx
            .insert(projects)
            .values({
                title: input.title,
                type: input.type,
                eventTeamName: input.eventTeamName,
                brief: input.brief,
                eventStartDate: input.eventStartDate,
                eventEndDate: input.eventEndDate,
                backgroundUrl: input.backgroundUrl,
                assetLinks: input.assetLinks,
            })
            .returning();

        // Add team assignments
        const teamAssignments = [
            ...(input.graphicTeamIds?.map((id) => ({ projectId: project.id, teamId: id, role: "graphic" as const })) || []),
            ...(input.motionTeamIds?.map((id) => ({ projectId: project.id, teamId: id, role: "motion" as const })) || []),
            ...(input.musicTeamIds?.map((id) => ({ projectId: project.id, teamId: id, role: "music" as const })) || []),
        ];

        if (teamAssignments.length > 0) {
            await tx.insert(projectTeams).values(teamAssignments);
        }

        return project;
    });
}

export async function getProjects(filters?: {
    status?: "active" | "archived";
    month?: number; // 0-11
    year?: number;
}) {
    let query = db.query.projects.findMany({
        with: {
            teams: {
                with: {
                    team: true,
                },
            },
            tasks: true,
        },
        orderBy: [desc(projects.eventStartDate)],
    });

    const result = await query;

    // Apply filters in memory (for simplicity)
    let filtered = result;

    if (filters?.status) {
        filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters?.month !== undefined && filters?.year !== undefined) {
        filtered = filtered.filter((p) => {
            const start = new Date(p.eventStartDate);
            const end = new Date(p.eventEndDate);
            return (
                (start.getMonth() === filters.month && start.getFullYear() === filters.year) ||
                (end.getMonth() === filters.month && end.getFullYear() === filters.year)
            );
        });
    }

    return filtered;
}

export async function getProjectById(projectId: string) {
    return await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
            teams: {
                with: {
                    team: true,
                },
            },
            tasks: {
                with: {
                    assignments: {
                        with: {
                            user: true,
                        },
                    },
                    comments: {
                        with: {
                            author: true,
                        },
                    },
                },
            },
            comments: {
                with: {
                    author: true,
                },
            },
            concerns: {
                with: {
                    author: true,
                },
            },
        },
    });
}

export async function updateProject(
    projectId: string,
    updates: Partial<CreateProjectInput>
) {
    return await db.transaction(async (tx) => {
        // Update project
        const [updated] = await tx
            .update(projects)
            .set({
                title: updates.title,
                type: updates.type,
                eventTeamName: updates.eventTeamName,
                brief: updates.brief,
                eventStartDate: updates.eventStartDate,
                eventEndDate: updates.eventEndDate,
                backgroundUrl: updates.backgroundUrl,
                assetLinks: updates.assetLinks,
                updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId))
            .returning();

        // Update team assignments if provided
        if (updates.graphicTeamIds || updates.motionTeamIds || updates.musicTeamIds) {
            // Remove existing teams
            await tx.delete(projectTeams).where(eq(projectTeams.projectId, projectId));

            // Add new teams
            const teamAssignments = [
                ...(updates.graphicTeamIds?.map((id) => ({ projectId, teamId: id, role: "graphic" as const })) || []),
                ...(updates.motionTeamIds?.map((id) => ({ projectId, teamId: id, role: "motion" as const })) || []),
                ...(updates.musicTeamIds?.map((id) => ({ projectId, teamId: id, role: "music" as const })) || []),
            ];

            if (teamAssignments.length > 0) {
                await tx.insert(projectTeams).values(teamAssignments);
            }
        }

        return updated;
    });
}

export async function deleteProject(projectId: string) {
    await db.delete(projects).where(eq(projects.id, projectId));
}

export async function archiveProject(projectId: string) {
    const [updated] = await db
        .update(projects)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();
    return updated;
}
