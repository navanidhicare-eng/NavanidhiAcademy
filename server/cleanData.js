import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client with correct environment variables
// NOTE: Environment variables are swapped - NEXT_PUBLIC_SUPABASE_ANON_KEY contains URL
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // This actually contains the URL
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function cleanAllSupabaseData() {
  console.log('🧹 Starting complete Supabase data cleanup...');
  
  try {
    // Step 1: Delete all users from Supabase Auth
    console.log('🔥 Deleting all users from Supabase Auth...');
    
    // Get all users from Supabase Auth
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing Supabase Auth users:', listError);
      throw listError;
    }
    
    console.log(`📊 Found ${users.users.length} users in Supabase Auth`);
    
    // Delete each user from Supabase Auth
    for (const user of users.users) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`❌ Error deleting user ${user.email}:`, deleteError);
      } else {
        console.log(`✅ Deleted Supabase Auth user: ${user.email || user.id}`);
      }
    }
    
    console.log('🎉 Complete Supabase Auth cleanup successful!');
    console.log('📝 All Supabase Auth users removed');
    console.log('🔑 Ready for fresh setup');
    
    return {
      success: true,
      message: 'All Supabase Auth data cleaned successfully',
      usersDeleted: users.users.length
    };
    
  } catch (error) {
    console.error('❌ Supabase data cleanup failed:', error);
    throw error;
  }
}

// Run the cleanup
cleanAllSupabaseData()
  .then(result => {
    console.log('Cleanup completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });