import { createClient } from '@supabase/supabase-js';

declare const process: any;

// Support both Next.js and Vite env prefixes safely:
const databaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const databaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

export const isDatabaseConfigured = Boolean(
  databaseUrl && 
  databaseAnonKey && 
  !databaseUrl.includes('placeholder') &&
  databaseUrl.startsWith('http')
);

// Backward-compatible alias
export const isSupabaseConfigured = isDatabaseConfigured;

// Fallback dummy URL so module evaluation never throws if env vars are unset
export const supabase = createClient(
  databaseUrl || 'https://placeholder.supabase.co',
  databaseAnonKey || 'placeholder-anon-key'
);
