import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

// Create Supabase client with service role key for server-side operations
// NOTE: Environment variables are swapped - NEXT_PUBLIC_SUPABASE_ANON_KEY contains URL
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This actually contains the URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create public client for regular operations
// NOTE: Environment variables are swapped - NEXT_PUBLIC_SUPABASE_URL contains anon key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This actually contains the URL
  process.env.NEXT_PUBLIC_SUPABASE_URL! // This actually contains the anon key
);