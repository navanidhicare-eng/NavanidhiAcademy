import { createClient } from '@supabase/supabase-js';

// Use the correct environment variables in their proper roles
const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('VITE_NEXT_PUBLIC_SUPABASE_URL not configured');
}

if (!supabaseAnonKey) {
  console.error('VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);