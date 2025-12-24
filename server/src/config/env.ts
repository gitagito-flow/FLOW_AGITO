import { config } from "dotenv";
import { resolve } from "path";

// Load .env from server root (where npm run dev is executed)
config({ path: resolve(process.cwd(), ".env") });

export const env = {
    // Server
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",
    databaseUrl: process.env.DATABASE_URL || "",

    // JWT
    jwtSecret: process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:8080",
} as const;

// Validate required environment variables
export function validateEnv() {
    const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL", "JWT_SECRET"];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missing.join(", ")}`);
        console.warn("Please copy .env.example to .env and fill in the values");
    }
}
