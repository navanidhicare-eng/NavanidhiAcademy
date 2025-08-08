import { supabase, signInWithEmail, signUpWithEmail, signOut, getCurrentUser } from './supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

class SupabaseAuthService {
  private currentUser: User | null = null;
  private session: Session | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.session = session;
      
      if (session?.user) {
        // Fetch user profile from our database
        await this.fetchUserProfile(session.user.id);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        if (session?.user) {
          this.fetchUserProfile(session.user.id);
        } else {
          this.currentUser = null;
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  private async fetchUserProfile(userId: string): Promise<void> {
    try {
      // Get user profile from our users table
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      this.currentUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed: No user or session returned');
      }

      this.session = data.session;
      await this.fetchUserProfile(data.user.id);

      if (!this.currentUser) {
        throw new Error('User profile not found in database');
      }

      return {
        user: this.currentUser,
        session: data.session,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    villageId?: string;
  }): Promise<User> {
    try {
      // First, create the auth user
      const { data, error } = await signUpWithEmail(userData.email, userData.password, {
        data: {
          name: userData.name,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Registration failed: No user returned');
      }

      // Create user profile in our database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          village_id: userData.villageId,
          password: 'supabase_managed', // Placeholder since Supabase manages auth
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await signOut();
      if (error) {
        throw new Error(error.message);
      }
      
      this.currentUser = null;
      this.session = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session && !!this.currentUser;
  }

  getAccessToken(): string | null {
    return this.session?.access_token || null;
  }

  // Method to sync user data if needed
  async syncUserData(): Promise<void> {
    const supabaseUser = await getCurrentUser();
    if (supabaseUser) {
      await this.fetchUserProfile(supabaseUser.id);
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();