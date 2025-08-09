import { createClient } from '@supabase/supabase-js';

// Environment variables are swapped, so we need to swap them back
const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // This is actually the URL
const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || ''; // This is actually the anon key

if (!supabaseUrl) {
  console.error('VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY (URL) not configured');
}

if (!supabaseAnonKey) {
  console.error('VITE_NEXT_PUBLIC_SUPABASE_URL (anon key) not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);