import { supabase, STORAGE_BUCKETS } from "../config/supabase.js";
import { randomUUID } from "crypto";

export type BucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export async function uploadFile(
    bucket: BucketName,
    file: Express.Multer.File,
    folder?: string
): Promise<string> {
    // Generate unique filename
    const ext = file.originalname.split(".").pop();
    const filename = `${randomUUID()}.${ext}`;
    const path = folder ? `${folder}/${filename}` : filename;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });

    if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return urlData.publicUrl;
}

export async function deleteFile(bucket: BucketName, fileUrl: string): Promise<void> {
    // Extract path from full URL
    const urlParts = fileUrl.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length !== 2) {
        throw new Error("Invalid file URL");
    }

    const path = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

export async function getPublicUrl(bucket: BucketName, path: string): Promise<string> {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
