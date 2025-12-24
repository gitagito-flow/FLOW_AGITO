import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as storageService from "../services/storage.service.js";
import { STORAGE_BUCKETS } from "../config/supabase.js";

const router = Router();

// POST /api/upload/project-background
router.post(
    "/project-background",
    authMiddleware,
    upload.single("file"),
    async (req: AuthenticatedRequest, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const url = await storageService.uploadFile(
                STORAGE_BUCKETS.PROJECT_BACKGROUNDS,
                req.file,
                "projects"
            );
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/upload/task-image
router.post(
    "/task-image",
    authMiddleware,
    upload.single("file"),
    async (req: AuthenticatedRequest, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const url = await storageService.uploadFile(
                STORAGE_BUCKETS.TASK_IMAGES,
                req.file,
                "tasks"
            );
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/upload/comment-attachment
router.post(
    "/comment-attachment",
    authMiddleware,
    upload.single("file"),
    async (req: AuthenticatedRequest, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const url = await storageService.uploadFile(
                STORAGE_BUCKETS.COMMENT_ATTACHMENTS,
                req.file,
                "comments"
            );
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/upload/user-avatar
router.post(
    "/user-avatar",
    authMiddleware,
    upload.single("file"),
    async (req: AuthenticatedRequest, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const url = await storageService.uploadFile(
                STORAGE_BUCKETS.USER_AVATARS,
                req.file,
                req.user!.userId
            );
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/upload/:bucket/:filename
router.delete("/:bucket/:filename", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
    try {
        const { bucket, filename } = req.params;
        // Reconstruct URL for deletion
        const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
        await storageService.deleteFile(bucket as any, url);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
