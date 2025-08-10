import { supabaseAdmin } from './supabaseClient';
import { storage } from './storage';
import type { User, InsertUser, SoCenter, InsertSoCenter } from '@shared/schema';

/**
 * Comprehensive authentication service that enforces Supabase Auth for ALL authentication operations
 * As mandated by user: "From Now, any Type of Authentication is Created from Supabase Auth. This is must"
 */
export class AuthService {
  
  /**
   * Login user through Supabase Auth ONLY
   * This is the ONLY way to authenticate users in the system
   */
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log('🔐 Authenticating with Supabase Auth:', email);
      
      // Step 1: Authenticate with Supabase Auth (MANDATORY)
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError || !authData.user) {
        console.error('❌ Supabase Auth failed:', authError?.message);
        throw new Error('Invalid credentials');
      }
      
      console.log('✅ Supabase Auth successful:', authData.user.id);
      
      // Step 2: Get or sync user from our database
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // User exists in Supabase but not in our database - sync them
        console.log('🔄 Syncing user from Supabase to database:', email);
        const userMetadata = authData.user.user_metadata;
        user = await storage.createUser({
          email: email,
          role: (userMetadata?.role || 'agent') as any,
          name: userMetadata?.name || authData.user.email?.split('@')[0] || 'User',
          phone: userMetadata?.phone,
          isActive: true,
          password: '' // We use Supabase Auth, no local password needed
        });
        console.log('✅ User synced to database:', user.id);
      }
      
      console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });

      // Step 3: Create JWT token for API access
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        user,
        token
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

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
        isActive: true
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
      isActive: true
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

  /**
   * Create SO Center with Supabase Auth integration
   * SO Centers are also users in the system with 'so_center' role
   */
  static async createSoCenter(soCenterData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
    centerId: string;
    centerName: string;
    location?: string;
    managerName?: string;
    rentAmount?: string;
    rentalAdvance?: string;
    electricityAmount?: string;
    internetAmount?: string;
    facilities?: string[];
    capacity?: number;
    roomSize?: string;
    landmarks?: string;
    ownerName?: string;
    ownerLastName?: string;
    ownerPhone?: string;
    dateOfHouseTaken?: string;
    monthlyRentDate?: number;
    monthlyInternetDate?: number;
    internetServiceProvider?: string;
    electricBillAccountNumber?: string;
    internetBillAccountNumber?: string;
    villageId?: string;
  }, nearbySchools?: any[], nearbyTuitions?: any[], equipment?: any[]): Promise<{ supabaseUser: any; dbUser: User; soCenter: SoCenter }> {
    try {
      console.log('🔧 Creating SO Center with Supabase Auth:', soCenterData.email);
      console.log('📊 SO Center Data:', { 
        name: soCenterData.name, 
        centerName: soCenterData.centerName,
        email: soCenterData.email,
        centerId: soCenterData.centerId 
      });
      
      // Step 1: Create user in Supabase Auth with 'so_center' role
      const userResult = await this.createUser({
        email: soCenterData.email,
        password: soCenterData.password,
        role: 'so_center',
        name: soCenterData.name,
        phone: soCenterData.phone,
        address: soCenterData.address
      });

      // Step 2: Create SO Center record linked to the user
      const soCenterRecord: InsertSoCenter = {
        centerId: soCenterData.centerId,
        name: soCenterData.name || soCenterData.centerName,
        email: soCenterData.email,
        address: soCenterData.address,
        villageId: soCenterData.villageId,
        phone: soCenterData.phone,
        ownerName: soCenterData.ownerName,
        ownerLastName: soCenterData.ownerLastName,
        ownerPhone: soCenterData.ownerPhone,
        landmarks: soCenterData.landmarks,
        roomSize: soCenterData.roomSize,
        rentAmount: soCenterData.rentAmount,
        rentalAdvance: soCenterData.rentalAdvance,
        dateOfHouseTaken: soCenterData.dateOfHouseTaken,
        monthlyRentDate: soCenterData.monthlyRentDate,
        electricBillAccountNumber: soCenterData.electricBillAccountNumber,
        internetBillAccountNumber: soCenterData.internetBillAccountNumber,
        capacity: soCenterData.capacity,
        facilities: soCenterData.facilities || [],
        walletBalance: '0',
        admissionFeeApplicable: soCenterData.admissionFeeApplicable !== false,
        isActive: true
      };

      console.log('📝 SO Center Record to be inserted:', soCenterRecord);

      const soCenter = await storage.createSoCenter(soCenterRecord, nearbySchools, nearbyTuitions, equipment);
      console.log('✅ SO Center created with Supabase Auth:', soCenter.id);

      return {
        supabaseUser: userResult.supabaseUser,
        dbUser: userResult.dbUser,
        soCenter
      };
    } catch (error) {
      console.error('❌ SO Center creation failed:', error);
      throw error;
    }
  }

  /**
   * Update SO Center through Supabase Auth
   */
  static async updateSoCenter(userId: string, updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    centerName?: string;
    location?: string;
    managerName?: string;
  }): Promise<{ user: User; soCenter?: SoCenter }> {
    try {
      // Step 1: Update user through Supabase Auth
      const userUpdates: any = {};
      if (updates.email) userUpdates.email = updates.email;
      if (updates.password) userUpdates.password = updates.password;
      if (updates.name) userUpdates.name = updates.name;
      if (updates.phone) userUpdates.phone = updates.phone;

      const updatedUser = await this.updateUser(userId, userUpdates);

      // Step 2: Update SO Center record if needed
      let soCenter;
      const soCenterUpdates: any = {};
      if (updates.centerName) soCenterUpdates.centerName = updates.centerName;
      if (updates.location) soCenterUpdates.location = updates.location;
      if (updates.managerName) soCenterUpdates.managerName = updates.managerName;
      if (updates.email) soCenterUpdates.managerEmail = updates.email;
      if (updates.phone) soCenterUpdates.managerPhone = updates.phone;

      if (Object.keys(soCenterUpdates).length > 0) {
        soCenter = await storage.updateSoCenterByUserId(userId, soCenterUpdates);
      }

      console.log('✅ SO Center updated through Supabase Auth:', userId);
      
      return {
        user: updatedUser,
        soCenter
      };
    } catch (error) {
      console.error('❌ SO Center update failed:', error);
      throw error;
    }
  }

  /**
   * Delete SO Center from both Supabase Auth and database
   */
  static async deleteSoCenter(userId: string): Promise<void> {
    try {
      // Step 1: Delete SO Center record
      await storage.deleteSoCenterByUserId(userId);

      // Step 2: Delete user from Supabase Auth and database
      await this.deleteUser(userId);

      console.log('✅ SO Center deleted from all systems:', userId);
    } catch (error) {
      console.error('❌ SO Center deletion failed:', error);
      throw error;
    }
  }
}