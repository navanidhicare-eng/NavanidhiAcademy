import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is required (NEXT_PUBLIC_SUPABASE_URL or VITE_NEXT_PUBLIC_SUPABASE_URL)');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

if (!supabaseAnonKey) {
  throw new Error('Supabase anon key is required (NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}

console.log('🔗 Supabase URL configured:', supabaseUrl.slice(0, 30) + '...');

// Create Supabase client with service role key for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create public client for regular operations  
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);