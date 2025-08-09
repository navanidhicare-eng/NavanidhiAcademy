import { createClient } from '@supabase/supabase-js';

// Use environment variables directly from the backend secrets
const supabaseUrl = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.warn('VITE_NEXT_PUBLIC_SUPABASE_URL not properly configured');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.warn('VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY not properly configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);