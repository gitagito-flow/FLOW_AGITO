import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hmthbjboffpzowncpmmp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGhiamJvZmZwem93bmNwbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzg0ODksImV4cCI6MjA4MjE1NDQ4OX0.j8bMuDe0mZZeEzyvsXhbPjjOp8GLYFW8UVK9m07HTuU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);