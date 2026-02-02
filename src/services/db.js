// src/services/db.js
import { createClient } from "@supabase/supabase-js";

// Placeholder keys - In production, these must be in .env
// User will need to replace these or provide them via VITE_SUPABASE_URL / KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xyzcompany.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "public-anon-key";

let supabase = null;

try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.warn("Supabase client failed to initialize. Cloud save disabled.", error);
}

export const db = {
    async saveProgress(userId, level, score) {
        if (!supabase) return { error: "No DB connection" };

        // Upsert progress
        const { data, error } = await supabase
            .from('progress')
            .upsert({ user_id: userId, level, score, updated_at: new Date() })
            .select();

        return { data, error };
    },

    async loadProgress(userId) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', userId)
            .single();

        return { data, error };
    },

    // Simple auth wrapper
    async signInAnonymously() {
        if (!supabase) return { user: { id: 'local-user' } };
        // For now, return a mock user or implement real auth if needed
        // Here we just check local session or sign in
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) return { user: session.user };

        // Anonymous sign-in isn't default in Supabase (requires config), 
        // so we might default to no-op or just return a generated ID for this demo
        return { user: { id: 'demo-user-' + Math.floor(Math.random() * 10000) } };
    }
};
