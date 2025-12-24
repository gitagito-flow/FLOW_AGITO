import { Router } from "express";
import { z } from "zod";
import * as taskService from "../services/task.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router({ mergeParams: true }); // To access :projectId from parent

// Validation schemas
const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.string(),
    points: z.string(),
    columnId: z.string(),
    deadline: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
    imageUrl: z.string().url().optional(),
    graphicLink: z.string().url().optional(),
    animationLink: z.string().url().optional(),
    musicLink: z.string().url().optional(),
    assignments: z
        .array(
            z.object({
                userId: z.string().uuid(),
                role: z.string(),
                percentage: z.number().min(0).max(100),
            })
        )
        .optional(),
});

const moveTaskSchema = z.object({
    columnId: z.string(),
});

// GET /api/projects/:projectId/tasks
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const tasks = await taskService.getTasksByProject(req.params.projectId);
        res.json(tasks);
    } catch (error) {
        next(error);
    }
});

// POST /api/projects/:projectId/tasks
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const input = createTaskSchema.parse(req.body);
        const task = await taskService.createTask({
            ...input,
            projectId: req.params.projectId,
        });
        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
});

// GET /api/projects/:projectId/tasks/:taskId
router.get("/:taskId", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const task = await taskService.getTaskById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/projects/:projectId/tasks/:taskId
router.patch("/:taskId", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const input = createTaskSchema.partial().parse(req.body);
        const task = await taskService.updateTask(req.params.taskId, input);
        res.json(task);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/projects/:projectId/tasks/:taskId/move
router.patch("/:taskId/move", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const { columnId } = moveTaskSchema.parse(req.body);
        const task = await taskService.moveTask(req.params.taskId, columnId);
        res.json(task);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete("/:taskId", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        await taskService.deleteTask(req.params.taskId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
