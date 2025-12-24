import express from "express";
import cors from "cors";
import { env, validateEnv } from "./config/env.js";
import { initializeStorageBuckets } from "./config/supabase.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

// Validate environment variables
validateEnv();

const app = express();

// Middleware
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
    try {
        // Initialize Supabase storage buckets
        await initializeStorageBuckets();

        app.listen(env.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 OneFlow API Server                                    ║
║                                                            ║
║   Environment: ${env.nodeEnv.padEnd(40)}║
║   Port: ${String(env.port).padEnd(47)}║
║   CORS Origin: ${env.corsOrigin.padEnd(40)}║
║                                                            ║
║   Endpoints:                                               ║
║   • GET  /api/health         - Health check                ║
║   • POST /api/auth/register  - Register user               ║
║   • POST /api/auth/login     - Login                       ║
║   • GET  /api/projects       - List projects               ║
║   • POST /api/upload/*       - File uploads                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

start();
