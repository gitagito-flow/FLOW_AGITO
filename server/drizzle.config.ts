import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://postgres.bodfzmcibtogbpeybxyr:%25mUGq6Cn%2AC%2FV%236F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres",
    },
});
