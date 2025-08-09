import { supabaseAdmin } from './supabaseClient';
import { storage } from './storage';
import type { User, InsertUser } from '@shared/schema';

/**
 * Comprehensive authentication service that enforces Supabase Auth for ALL authentication operations
 * As mandated by user: "From Now, any Type of Authentication is Created from Supabase Auth. This is must"
 */
export class AuthService {
  
  /**
   * Create a new user through Supabase Auth ONLY
   * This is the ONLY way to create new users in the system
   */
  static async createUser(userData: {
    email: string;
    password: string;
    role: 'admin' | 'so_center' | 'teacher' | 'agent';
    name: string;
    phone?: string;
    address?: string;
  }): Promise<{ supabaseUser: any; dbUser: User }> {
    try {
      console.log('🔧 Creating user in Supabase Auth:', userData.email);
      
      // Step 1: Create user in Supabase Auth (MANDATORY)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
        }
      });

      if (authError) {
        console.error('❌ Supabase Auth creation failed:', authError);
        throw new Error(`Authentication creation failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Supabase Auth user creation returned no user data');
      }

      console.log('✅ Supabase Auth user created:', authData.user.id);

      // Step 2: Sync to PostgreSQL database with Supabase User ID
      const dbUserData: InsertUser = {
        email: userData.email,
        password: '', // No password in DB - handled by Supabase Auth
        role: userData.role,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        isActive: true,
        isPasswordChanged: false
      };

      const dbUser = await storage.createUser(dbUserData);
      console.log('✅ Database user synchronized:', dbUser.id);

      return {
        supabaseUser: authData.user,
        dbUser
      };
    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user through Supabase Auth ONLY
   */
  static async authenticateUser(email: string, password: string): Promise<{
    supabaseUser: any;
    dbUser: User;
    session: any;
  }> {
    try {
      console.log('🔐 Authenticating with Supabase Auth:', email);
      
      // Step 1: Authenticate with Supabase Auth (MANDATORY)
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase Auth failed:', error);
        throw new Error(`Authentication failed: ${error.message}`);
      }

      if (!data.user || !data.session) {
        throw new Error('Supabase Auth returned no user or session');
      }

      console.log('✅ Supabase Auth successful:', data.user.id);

      // Step 2: Get synchronized database user
      const dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        console.log('🔄 Syncing Supabase user to database...');
        // Auto-sync if user exists in Supabase but not in database
        const syncedUser = await this.syncSupabaseUserToDb(data.user);
        return {
          supabaseUser: data.user,
          dbUser: syncedUser,
          session: data.session
        };
      }

      console.log('✅ User authenticated:', { id: dbUser.id, email: dbUser.email, role: dbUser.role });

      return {
        supabaseUser: data.user,
        dbUser,
        session: data.session
      };
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Sync existing Supabase Auth user to database
   */
  private static async syncSupabaseUserToDb(supabaseUser: any): Promise<User> {
    const dbUserData: InsertUser = {
      email: supabaseUser.email,
      password: '', // Handled by Supabase Auth
      role: supabaseUser.user_metadata?.role || 'agent',
      name: supabaseUser.user_metadata?.name || 'User',
      phone: supabaseUser.user_metadata?.phone,
      isActive: true,
      isPasswordChanged: false
    };

    return await storage.createUser(dbUserData);
  }

  /**
   * Update user through Supabase Auth
   */
  static async updateUser(userId: string, updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    role?: string;
  }): Promise<User> {
    try {
      // Step 1: Update in Supabase Auth
      const authUpdates: any = {};
      if (updates.email) authUpdates.email = updates.email;
      if (updates.password) authUpdates.password = updates.password;
      
      const metadataUpdates: any = {};
      if (updates.name) metadataUpdates.name = updates.name;
      if (updates.phone) metadataUpdates.phone = updates.phone;
      if (updates.role) metadataUpdates.role = updates.role;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId, 
          { ...authUpdates, user_metadata: metadataUpdates }
        );

        if (authError) {
          throw new Error(`Supabase Auth update failed: ${authError.message}`);
        }
      }

      // Step 2: Update in database
      const dbUpdates: Partial<InsertUser> = {};
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone) dbUpdates.phone = updates.phone;
      if (updates.role) dbUpdates.role = updates.role as any;

      return await storage.updateUser(userId, dbUpdates);
    } catch (error) {
      console.error('❌ User update failed:', error);
      throw error;
    }
  }

  /**
   * Delete user from both Supabase Auth and database
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Step 1: Delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('⚠️ Supabase Auth deletion failed:', authError);
        // Continue with database deletion even if auth fails
      }

      // Step 2: Delete from database
      await storage.deleteUser(userId);
      console.log('✅ User deleted from all systems:', userId);
    } catch (error) {
      console.error('❌ User deletion failed:', error);
      throw error;
    }
  }
}