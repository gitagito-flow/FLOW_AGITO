import { Router } from "express";
import { z } from "zod";
import * as projectService from "../services/project.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
    title: z.string().min(1),
    type: z.enum(["Project", "Pitching"]),
    eventTeamName: z.string().optional(),
    brief: z.string().optional(),
    eventStartDate: z.string().transform((s) => new Date(s)),
    eventEndDate: z.string().transform((s) => new Date(s)),
    backgroundUrl: z.string().url().optional(),
    assetLinks: z
        .object({
            deckLink: z.string().url().optional(),
            graphicAssetsLink: z.string().url().optional(),
            threeDAssetsLink: z.string().url().optional(),
            videoAssetsLink: z.string().url().optional(),
            finalAnimationLink: z.string().url().optional(),
            decorLink: z.string().url().optional(),
        })
        .optional(),
    graphicTeamIds: z.array(z.string().uuid()).optional(),
    motionTeamIds: z.array(z.string().uuid()).optional(),
    musicTeamIds: z.array(z.string().uuid()).optional(),
});

// GET /api/projects
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const { status, month, year } = req.query;
        const projects = await projectService.getProjects({
            status: status as "active" | "archived" | undefined,
            month: month ? parseInt(month as string, 10) : undefined,
            year: year ? parseInt(year as string, 10) : undefined,
        });
        res.json(projects);
    } catch (error) {
        next(error);
    }
});

// GET /api/projects/:id
router.get("/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        next(error);
    }
});

// POST /api/projects
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const input = createProjectSchema.parse(req.body);
        const project = await projectService.createProject(input);
        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/projects/:id
router.patch("/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const input = createProjectSchema.partial().parse(req.body);
        const project = await projectService.updateProject(req.params.id, input);
        res.json(project);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/projects/:id
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        await projectService.deleteProject(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// POST /api/projects/:id/archive
router.post("/:id/archive", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const project = await projectService.archiveProject(req.params.id);
        res.json(project);
    } catch (error) {
        next(error);
    }
});

export default router;
