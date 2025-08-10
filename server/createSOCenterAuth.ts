// SO CENTER AUTHENTICATION CREATION SYSTEM
// Standardized flow for creating SO Center users in Supabase Auth
import { supabaseAdmin } from './supabaseClient';
import { storage } from './storage';

interface SOCenterData {
  centerId: string;
  centerName: string;
  password: string;
  phone?: string;
  address?: string;
}

export class SOCenterAuthManager {
  /**
   * Creates a new SO Center authentication user following standardized flow
   * @param centerData SO Center information
   * @returns Created user details
   */
  static async createSOCenterAuth(centerData: SOCenterData) {
    try {
      console.log(`🏢 Creating SO Center authentication for: ${centerData.centerId}`);
      
      // 1. Convert SO Center ID to email format
      const email = `${centerData.centerId.toLowerCase()}@navanidhi.org`;
      console.log(`📧 Email format: ${email}`);
      
      // 2. Create user in Supabase Auth with metadata
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: centerData.password,
        user_metadata: {
          role: 'so_center',
          name: centerData.centerName,
          center_id: centerData.centerId,
          phone: centerData.phone,
          address: centerData.address
        },
        email_confirm: true
      });
      
      if (authError) {
        console.error('❌ Supabase Auth user creation failed:', authError.message);
        throw new Error(`Supabase Auth failed: ${authError.message}`);
      }
      
      console.log('✅ SO Center user created in Supabase Auth:', authUser.user.id);
      
      // 3. Create corresponding user in database
      const dbUser = await storage.createUser({
        email: email,
        role: 'so_center',
        name: centerData.centerName,
        phone: centerData.phone,
        address: centerData.address,
        isActive: true,
        password: '' // Supabase Auth handles authentication
      });
      
      console.log('✅ SO Center user created in database:', dbUser.id);
      
      // 4. Return standardized response
      const result = {
        success: true,
        centerId: centerData.centerId,
        email: email,
        supabaseUserId: authUser.user.id,
        databaseUserId: dbUser.id,
        centerName: centerData.centerName,
        loginMethods: [
          `ID Format: ${centerData.centerId}`,
          `Email Format: ${email}`
        ],
        credentials: {
          id: centerData.centerId,
          email: email,
          password: centerData.password,
          role: 'so_center'
        }
      };
      
      console.log('🎉 SO Center authentication setup complete!');
      console.log('📋 Login Details:');
      console.log(`   Center ID: ${centerData.centerId}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${centerData.password}`);
      console.log(`   Role: so_center`);
      
      return result;
      
    } catch (error: any) {
      console.error('❌ SO Center authentication creation failed:', error.message);
      throw new Error(`Failed to create SO Center auth: ${error.message}`);
    }
  }
  
  /**
   * Batch create multiple SO Centers
   * @param centers Array of SO Center data
   * @returns Array of creation results
   */
  static async createMultipleSOCenters(centers: SOCenterData[]) {
    const results = [];
    
    for (const center of centers) {
      try {
        const result = await this.createSOCenterAuth(center);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          centerId: center.centerId,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Check if SO Center already exists
   * @param centerId SO Center ID to check
   * @returns Boolean indicating existence
   */
  static async checkSOCenterExists(centerId: string): Promise<boolean> {
    try {
      const email = `${centerId.toLowerCase()}@navanidhi.org`;
      const user = await storage.getUserByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }
}