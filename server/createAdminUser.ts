import { supabaseAdmin } from './supabaseClient';
import { storage } from './storage';

export async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user in Supabase Auth...');
    
    const adminEmail = 'navanidhi.care@gmail.com';
    const adminPassword = 'Psd@1986';
    
    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(user => user.email === adminEmail);
    
    let supabaseUser;
    
    if (existingUser) {
      console.log('✅ Admin user already exists in Supabase Auth:', existingUser.id);
      supabaseUser = existingUser;
    } else {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Admin User',
          role: 'admin'
        }
      });
      
      if (authError) {
        console.error('❌ Error creating admin user in Supabase Auth:', authError);
        throw authError;
      }
      
      supabaseUser = authUser.user;
      console.log('✅ Admin user created in Supabase Auth:', supabaseUser?.id);
    }
    
    if (!supabaseUser?.id) {
      throw new Error('Failed to get Supabase user ID');
    }
    
    // Check if user exists in our database
    const existingDbUser = await storage.getUserByEmail(adminEmail);
    
    if (!existingDbUser) {
      console.log('🔧 Creating admin user in database...');
      
      // Create user in our database
      const adminUser = await storage.createUser({
        email: adminEmail,
        role: 'admin',
        name: 'Admin User',
        isActive: true,
        passwordHash: '' // Will use Supabase Auth
      });
      
      console.log('✅ Admin user created in database:', adminUser.id);
    } else {
      console.log('✅ Admin user already exists in database:', existingDbUser.id);
    }
    
    console.log('🎉 Admin user setup complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}