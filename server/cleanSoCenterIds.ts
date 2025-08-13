
import { db, storage } from './storage';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

async function cleanAndReorganizeSoCenterIds() {
  console.log('🧹 Starting SO Center ID cleanup and reorganization...');
  
  try {
    // Get all SO Centers ordered by creation date
    const allSoCenters = await db.select()
      .from(schema.soCenters)
      .orderBy(schema.soCenters.createdAt);
    
    console.log(`📋 Found ${allSoCenters.length} SO Centers to reorganize`);
    
    // Get all users with so_center role
    const soCenterUsers = await db.select()
      .from(schema.users)
      .where(sql`role = 'so_center'`);
    
    console.log(`👥 Found ${soCenterUsers.length} SO Center users`);
    
    const updates = [];
    
    // Process each SO Center and assign new sequential IDs
    for (let i = 0; i < allSoCenters.length; i++) {
      const center = allSoCenters[i];
      const newNumber = i + 1;
      const newCenterId = `NNASOC${String(newNumber).padStart(5, '0')}`;
      const newEmail = `nnasoc${String(newNumber).padStart(5, '0')}@navanidhi.org`;
      
      updates.push({
        oldId: center.id,
        oldCenterId: center.centerId,
        oldEmail: center.email,
        newCenterId: newCenterId,
        newEmail: newEmail,
        centerName: center.name
      });
      
      console.log(`🔄 Planning update: ${center.centerId} → ${newCenterId}`);
    }
    
    // Confirm before proceeding
    console.log('\n⚠️  IMPORTANT: This will update all SO Center IDs and emails!');
    console.log('📋 Planned updates:');
    updates.forEach(update => {
      console.log(`   ${update.oldCenterId} → ${update.newCenterId} (${update.centerName})`);
    });
    
    // Perform the updates
    console.log('\n🚀 Starting database updates...');
    
    for (const update of updates) {
      console.log(`\n📝 Updating ${update.oldCenterId} to ${update.newCenterId}...`);
      
      // Update SO Center record
      await db.update(schema.soCenters)
        .set({
          centerId: update.newCenterId,
          email: update.newEmail
        })
        .where(sql`id = ${update.oldId}`);
      
      console.log(`✅ SO Center updated: ${update.newCenterId}`);
      
      // Update corresponding user record if exists
      if (update.oldEmail) {
        const userUpdateResult = await db.update(schema.users)
          .set({
            email: update.newEmail
          })
          .where(sql`email = ${update.oldEmail}`);
        
        console.log(`✅ User email updated: ${update.oldEmail} → ${update.newEmail}`);
      }
      
      // Update any students linked to this SO Center (no ID change needed, just referential)
      const linkedStudentsCount = await db.select({ count: sql`count(*)` })
        .from(schema.students)
        .where(sql`so_center_id = ${update.oldId}`);
      
      console.log(`📊 Found ${linkedStudentsCount[0]?.count || 0} students linked to this center`);
    }
    
    console.log('\n🎉 SO Center ID cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Updated ${updates.length} SO Centers`);
    console.log(`   - New ID range: NNASOC00001 to NNASOC${String(updates.length).padStart(5, '0')}`);
    console.log(`   - New email range: nnasoc00001@navanidhi.org to nnasoc${String(updates.length).padStart(5, '0')}@navanidhi.org`);
    
    // Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const updatedCenters = await db.select()
      .from(schema.soCenters)
      .orderBy(schema.soCenters.centerId);
    
    console.log('✅ Current SO Center IDs after cleanup:');
    updatedCenters.forEach((center, index) => {
      console.log(`   ${index + 1}. ${center.centerId} - ${center.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during SO Center ID cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  cleanAndReorganizeSoCenterIds()
    .then(() => {
      console.log('🎯 Cleanup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup process failed:', error);
      process.exit(1);
    });
}

export { cleanAndReorganizeSoCenterIds };
