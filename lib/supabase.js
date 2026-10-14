import { createClient } from '@supabase/supabase-js';

// Support both Next.js and Vite env prefixes:
const databaseUrl =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.NEXT_SUPABASE_URL)) ||
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta?.env?.NEXT_SUPABASE_URL ||
  import.meta?.env?.VITE_SUPABASE_URL ||
  '';

const databaseAnonKey =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.NEXT_SUPABASE_ANON_KEY)) ||
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta?.env?.NEXT_SUPABASE_ANON_KEY ||
  import.meta?.env?.VITE_SUPABASE_ANON_KEY ||
  '';

export const isDatabaseConfigured = Boolean(
  databaseUrl &&
  databaseAnonKey &&
  !databaseUrl.includes('placeholder') &&
  databaseUrl.startsWith('http')
);

export const isSupabaseConfigured = isDatabaseConfigured;

export const supabase = createClient(
  databaseUrl || 'https://placeholder.supabase.co',
  databaseAnonKey || 'placeholder-anon-key'
);
