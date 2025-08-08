import { createClient } from '@supabase/supabase-js'

// Supabase configuration - using the same database URL for auth
const supabaseUrl = 'https://gbydqtftpmftdojpylls.supabase.co'
// For now, we'll implement a hybrid approach - Supabase for database, custom auth for simplicity
// This can be fully migrated to Supabase Auth later when environment variables are properly configured
const supabaseAnonKey = 'temporary_placeholder' // Will be updated with proper env vars

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-client-name': 'navanidhi-academy' },
  },
})

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, options?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}