import { defineConfig } from "drizzle-kit";
import "dotenv/config"; // Import dotenv to load environment variables

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!, // Use environment variable
    },
});