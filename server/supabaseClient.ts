import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

// Create Supabase client with service role key for server-side operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This is actually the URL (swapped)
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create public client for regular operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // This is actually the URL (swapped)
  process.env.NEXT_PUBLIC_SUPABASE_URL! // This is actually the anon key (swapped)
);