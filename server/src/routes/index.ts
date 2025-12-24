import authRoutes from "./auth.routes.js";
import projectsRoutes from "./projects.routes.js";
import tasksRoutes from "./tasks.routes.js";
import uploadRoutes from "./upload.routes.js";
import { Router } from "express";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/projects", projectsRoutes);
router.use("/projects/:projectId/tasks", tasksRoutes);
router.use("/upload", uploadRoutes);

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
