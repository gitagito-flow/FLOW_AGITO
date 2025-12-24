import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Lazy initialization - client is created on first access
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        if (!env.supabaseUrl || !env.supabaseServiceKey) {
            throw new Error("Supabase credentials not configured. Check your .env file.");
        }
        _supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return _supabase;
}

// For backward compatibility
export const supabase = {
    get storage() {
        return getSupabase().storage;
    },
};

// Storage bucket names
export const STORAGE_BUCKETS = {
    PROJECT_BACKGROUNDS: "project-backgrounds",
    TASK_IMAGES: "task-images",
    COMMENT_ATTACHMENTS: "comment-attachments",
    USER_AVATARS: "user-avatars",
} as const;

// Initialize storage buckets (call once on server start)
export async function initializeStorageBuckets() {
    const client = getSupabase();
    const buckets = Object.values(STORAGE_BUCKETS);

    for (const bucket of buckets) {
        const { data, error } = await client.storage.getBucket(bucket);

        if (error && error.message.includes("not found")) {
            const { error: createError } = await client.storage.createBucket(bucket, {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            });

            if (createError) {
                console.error(`Failed to create bucket ${bucket}:`, createError.message);
            } else {
                console.log(`✅ Created storage bucket: ${bucket}`);
            }
        } else if (data) {
            console.log(`✅ Storage bucket exists: ${bucket}`);
        }
    }
}

