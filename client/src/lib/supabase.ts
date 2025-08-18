import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('❌ Supabase URL not configured. Please set VITE_NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Supabase URL is required');
}

if (!supabaseAnonKey) {
  console.error('❌ Supabase anon key not configured. Please set VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Supabase anon key is required');
}

console.log('✅ Supabase client configured:', supabaseUrl.slice(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);