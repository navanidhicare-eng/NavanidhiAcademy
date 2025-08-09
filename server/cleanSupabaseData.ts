import { supabaseAdmin } from './supabaseClient.js';
import { db } from './db.js';

/**
 * Clean all data from Supabase Auth and PostgreSQL database
 * Preserves table structures and logic, removes only data
 */
export async function cleanAllSupabaseData() {
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
        console.log(`✅ Deleted Supabase Auth user: ${user.email}`);
      }
    }
    
    // Step 2: Clean all PostgreSQL tables
    console.log('🗑️ Cleaning all PostgreSQL tables...');
    
    await db.transaction(async (tx) => {
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // Student and academic related data
      await tx.execute({ sql: 'DELETE FROM topic_progress' });
      await tx.execute({ sql: 'DELETE FROM tuition_progress' });  
      await tx.execute({ sql: 'DELETE FROM homework_activities' });
      await tx.execute({ sql: 'DELETE FROM attendance' });
      await tx.execute({ sql: 'DELETE FROM student_siblings' });
      await tx.execute({ sql: 'DELETE FROM students' });
      
      // Teaching and academic data
      await tx.execute({ sql: 'DELETE FROM teacher_daily_records' });
      await tx.execute({ sql: 'DELETE FROM teacher_classes' });
      await tx.execute({ sql: 'DELETE FROM teacher_subjects' });
      await tx.execute({ sql: 'DELETE FROM teachers' });
      
      // Payment and transaction data
      await tx.execute({ sql: 'DELETE FROM payments' });
      await tx.execute({ sql: 'DELETE FROM wallet_transactions' });
      await tx.execute({ sql: 'DELETE FROM withdrawal_requests' });
      await tx.execute({ sql: 'DELETE FROM commission_transactions' });
      await tx.execute({ sql: 'DELETE FROM commission_wallets' });
      await tx.execute({ sql: 'DELETE FROM product_orders' });
      
      // Fee management data
      await tx.execute({ sql: 'DELETE FROM class_fees' });
      await tx.execute({ sql: 'DELETE FROM monthly_fee_schedule' });
      await tx.execute({ sql: 'DELETE FROM fee_calculation_history' });
      
      // SO Centers and Users
      await tx.execute({ sql: 'DELETE FROM so_centers' });
      await tx.execute({ sql: 'DELETE FROM users' });
      
      // Academic structure
      await tx.execute({ sql: 'DELETE FROM topics' });
      await tx.execute({ sql: 'DELETE FROM chapters' });
      await tx.execute({ sql: 'DELETE FROM subjects' });
      await tx.execute({ sql: 'DELETE FROM classes' });
      
      // Address hierarchy
      await tx.execute({ sql: 'DELETE FROM villages' });
      await tx.execute({ sql: 'DELETE FROM mandals' });
      await tx.execute({ sql: 'DELETE FROM districts' });
      await tx.execute({ sql: 'DELETE FROM states' });
      
      // Products and settings
      await tx.execute({ sql: 'DELETE FROM products' });
      await tx.execute({ sql: 'DELETE FROM system_settings' });
      await tx.execute({ sql: 'DELETE FROM student_counter' });
      await tx.execute({ sql: 'DELETE FROM nearby_schools' });
      await tx.execute({ sql: 'DELETE FROM nearby_tuitions' });
      
      console.log('✅ All PostgreSQL tables cleaned');
    });
    
    console.log('🎉 Complete Supabase data cleanup successful!');
    console.log('📝 All table structures and logic preserved');
    console.log('🔑 Ready for fresh admin user creation');
    
    return {
      success: true,
      message: 'All Supabase data cleaned successfully',
      usersDeleted: users.users.length
    };
    
  } catch (error) {
    console.error('❌ Supabase data cleanup failed:', error);
    throw error;
  }
}