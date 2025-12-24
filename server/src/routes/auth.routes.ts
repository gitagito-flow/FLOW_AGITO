import { Router } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const input = registerSchema.parse(req.body);
        const result = await authService.registerUser(input);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const input = loginSchema.parse(req.body);
        const result = await authService.loginUser(input);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const user = await authService.getUserById(req.user!.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/auth/me
router.patch("/me", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const updates = z
            .object({
                name: z.string().min(2).optional(),
                avatarUrl: z.string().url().optional(),
            })
            .parse(req.body);

        const user = await authService.updateUser(req.user!.userId, updates);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

export default router;
