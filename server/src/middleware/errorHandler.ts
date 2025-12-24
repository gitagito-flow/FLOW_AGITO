import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error("Error:", err);

    // Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
    }

    // Multer errors
    if (err.name === "MulterError") {
        return res.status(400).json({
            error: err.message,
        });
    }

    // Generic errors
    return res.status(500).json({
        error: err.message || "Internal server error",
    });
}
