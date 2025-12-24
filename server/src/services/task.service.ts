import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks, taskAssignments, NewTask } from "../db/schema.js";

export interface CreateTaskInput {
    projectId: string;
    title: string;
    description?: string;
    type: string;
    points: string;
    columnId: string;
    deadline?: Date;
    imageUrl?: string;
    graphicLink?: string;
    animationLink?: string;
    musicLink?: string;
    assignments?: {
        userId: string;
        role: string;
        percentage: number;
    }[];
}

export async function createTask(input: CreateTaskInput) {
    return await db.transaction(async (tx) => {
        const [task] = await tx
            .insert(tasks)
            .values({
                projectId: input.projectId,
                title: input.title,
                description: input.description,
                type: input.type,
                points: input.points,
                columnId: input.columnId,
                deadline: input.deadline,
                imageUrl: input.imageUrl,
                graphicLink: input.graphicLink,
                animationLink: input.animationLink,
                musicLink: input.musicLink,
            })
            .returning();

        // Add assignments
        if (input.assignments && input.assignments.length > 0) {
            await tx.insert(taskAssignments).values(
                input.assignments.map((a) => ({
                    taskId: task.id,
                    userId: a.userId,
                    role: a.role,
                    percentage: a.percentage,
                }))
            );
        }

        return task;
    });
}

export async function getTasksByProject(projectId: string) {
    return await db.query.tasks.findMany({
        where: eq(tasks.projectId, projectId),
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
    });
}

export async function getTaskById(taskId: string) {
    return await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: {
            project: true,
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
    });
}

export async function updateTask(taskId: string, updates: Partial<CreateTaskInput>) {
    return await db.transaction(async (tx) => {
        const [updated] = await tx
            .update(tasks)
            .set({
                title: updates.title,
                description: updates.description,
                type: updates.type,
                points: updates.points,
                columnId: updates.columnId,
                deadline: updates.deadline,
                imageUrl: updates.imageUrl,
                graphicLink: updates.graphicLink,
                animationLink: updates.animationLink,
                musicLink: updates.musicLink,
                updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId))
            .returning();

        // Update assignments if provided
        if (updates.assignments) {
            await tx.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));

            if (updates.assignments.length > 0) {
                await tx.insert(taskAssignments).values(
                    updates.assignments.map((a) => ({
                        taskId,
                        userId: a.userId,
                        role: a.role,
                        percentage: a.percentage,
                    }))
                );
            }
        }

        return updated;
    });
}

export async function moveTask(taskId: string, columnId: string) {
    const [updated] = await db
        .update(tasks)
        .set({ columnId, updatedAt: new Date() })
        .where(eq(tasks.id, taskId))
        .returning();
    return updated;
}

export async function deleteTask(taskId: string) {
    await db.delete(tasks).where(eq(tasks.id, taskId));
}
