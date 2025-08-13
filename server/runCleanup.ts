
import { cleanAllSupabaseData } from './cleanSupabaseData';

async function runCompleteCleanup() {
  try {
    console.log('🚀 Starting complete system cleanup...');
    console.log('⚠️  This will remove ALL dummy data from Supabase!');
    console.log('🔒 Admin user will be preserved');
    
    const result = await cleanAllSupabaseData();
    
    console.log('\n🎉 CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - Users deleted: ${result.usersDeleted}`);
    console.log(`   - Admin preserved: ${result.adminPreserved}`);
    console.log('   - All student data removed');
    console.log('   - All SO Centers removed');
    console.log('   - All payment data removed');
    console.log('   - All academic structure removed');
    console.log('   - All address data removed');
    console.log('\n✅ System is now clean and ready for fresh data!');
    console.log('🔑 Login with: navanidhi.care@gmail.com / Psd@1986');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
runCompleteCleanup();
