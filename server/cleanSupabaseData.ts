import { supabaseAdmin } from './supabaseClient.js';
import { db } from './db.js';

/**
 * Clean all dummy data from Supabase Auth and PostgreSQL database
 * Preserves table structures and logic, removes only data
 * Keeps admin user for system functionality
 */
export async function cleanAllSupabaseData() {
  console.log('🧹 Starting complete Supabase dummy data cleanup...');
  
  try {
    // Step 1: Delete all non-admin users from Supabase Auth
    console.log('🔥 Deleting all non-admin users from Supabase Auth...');
    
    // Get all users from Supabase Auth
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing Supabase Auth users:', listError);
      throw listError;
    }
    
    console.log(`📊 Found ${users.users.length} users in Supabase Auth`);
    
    const adminEmail = 'navanidhi.care@gmail.com';
    let deletedCount = 0;
    
    // Delete each non-admin user from Supabase Auth
    for (const user of users.users) {
      if (user.email !== adminEmail) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteError);
        } else {
          console.log(`✅ Deleted Supabase Auth user: ${user.email}`);
          deletedCount++;
        }
      } else {
        console.log(`🔒 Preserved admin user: ${user.email}`);
      }
    }
    
    // Step 2: Clean all PostgreSQL tables
    console.log('🗑️ Cleaning all PostgreSQL tables...');
    
    await db.transaction(async (tx) => {
      console.log('🗑️ Cleaning PostgreSQL tables while preserving admin data...');
      
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // Student and academic related data (all dummy data)
      await tx.execute({ sql: 'DELETE FROM topic_progress' });
      await tx.execute({ sql: 'DELETE FROM tuition_progress' });  
      await tx.execute({ sql: 'DELETE FROM homework_activities' });
      await tx.execute({ sql: 'DELETE FROM attendance' });
      await tx.execute({ sql: 'DELETE FROM student_siblings' });
      await tx.execute({ sql: 'DELETE FROM students' });
      console.log('🔥 Student data cleaned');
      
      // Teaching and academic data (all dummy data)
      await tx.execute({ sql: 'DELETE FROM teacher_daily_records' });
      await tx.execute({ sql: 'DELETE FROM teacher_classes' });
      await tx.execute({ sql: 'DELETE FROM teacher_subjects' });
      await tx.execute({ sql: 'DELETE FROM teachers' });
      console.log('🔥 Teacher data cleaned');
      
      // Payment and transaction data (all dummy data)
      await tx.execute({ sql: 'DELETE FROM payments' });
      await tx.execute({ sql: 'DELETE FROM wallet_transactions' });
      await tx.execute({ sql: 'DELETE FROM withdrawal_requests' });
      await tx.execute({ sql: 'DELETE FROM commission_transactions' });
      await tx.execute({ sql: 'DELETE FROM commission_wallets' });
      await tx.execute({ sql: 'DELETE FROM product_orders' });
      console.log('🔥 Payment data cleaned');
      
      // Fee management data (all dummy data)
      await tx.execute({ sql: 'DELETE FROM class_fees' });
      await tx.execute({ sql: 'DELETE FROM monthly_fee_schedule' });
      await tx.execute({ sql: 'DELETE FROM fee_calculation_history' });
      console.log('🔥 Fee data cleaned');
      
      // SO Centers (all dummy data)
      await tx.execute({ sql: 'DELETE FROM so_centers' });
      console.log('🔥 SO Centers cleaned');
      
      // Delete non-admin users only
      const adminEmail = 'navanidhi.care@gmail.com';
      await tx.execute({ 
        sql: `DELETE FROM users WHERE email != '${adminEmail}'` 
      });
      console.log('🔥 Non-admin users cleaned');
      
      // Academic structure (keep some basic structure for admin functionality)
      await tx.execute({ sql: 'DELETE FROM topics' });
      await tx.execute({ sql: 'DELETE FROM chapters' });
      await tx.execute({ sql: 'DELETE FROM subjects' });
      await tx.execute({ sql: 'DELETE FROM classes' });
      console.log('🔥 Academic structure cleaned');
      
      // Address hierarchy (can be rebuilt from UI)
      await tx.execute({ sql: 'DELETE FROM villages' });
      await tx.execute({ sql: 'DELETE FROM mandals' });
      await tx.execute({ sql: 'DELETE FROM districts' });
      await tx.execute({ sql: 'DELETE FROM states' });
      console.log('🔥 Address data cleaned');
      
      // Products and settings (keep system settings)
      await tx.execute({ sql: 'DELETE FROM products' });
      await tx.execute({ sql: 'DELETE FROM student_counter' });
      await tx.execute({ sql: 'DELETE FROM nearby_schools' });
      await tx.execute({ sql: 'DELETE FROM nearby_tuitions' });
      console.log('🔥 Product data cleaned');
      
      console.log('✅ All dummy data cleaned from PostgreSQL tables');
    });
    
    console.log('🎉 Complete Supabase dummy data cleanup successful!');
    console.log('📝 All table structures and logic preserved');
    console.log('🔒 Admin user preserved for system access');
    console.log('🔑 Ready for fresh data entry');
    
    return {
      success: true,
      message: 'All Supabase dummy data cleaned successfully',
      usersDeleted: deletedCount,
      adminPreserved: true
    };
    
  } catch (error) {
    console.error('❌ Supabase data cleanup failed:', error);
    throw error;
  }
}