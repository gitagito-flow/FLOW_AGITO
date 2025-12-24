
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bodfzmcibtogbpeybxyr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZGZ6bWNpYnRvZ2JwZXlieHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjMxNDUsImV4cCI6MjA4MTczOTE0NX0.51ZYW6_9XqZkTvP61Fb6CCtaQGrh3f7YPHcB4JbGg7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
