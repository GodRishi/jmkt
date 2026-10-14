import { createClient } from '@supabase/supabase-js';

// Support both Next.js (NEXT_PUBLIC_*) and Vite (VITE_*) prefixes:
const supabaseUrl =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.NEXT_SUPABASE_URL)) ||
  (typeof import.meta !== 'undefined' && (
    import.meta?.env?.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta?.env?.NEXT_SUPABASE_URL ||
    import.meta?.env?.VITE_SUPABASE_URL
  )) ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.NEXT_SUPABASE_ANON_KEY)) ||
  (typeof import.meta !== 'undefined' && (
    import.meta?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta?.env?.NEXT_SUPABASE_ANON_KEY ||
    import.meta?.env?.VITE_SUPABASE_ANON_KEY
  )) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
