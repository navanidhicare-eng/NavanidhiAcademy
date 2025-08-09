import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { students, classFees } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from "@shared/schema";

const sqlConn = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sqlConn, { schema });

/**
 * Monthly Fee Scheduler
 * 
 * This service automatically adds monthly fees to student pending amounts
 * Should be run every month at midnight (via cron job or scheduled task)
 */
export class MonthlyFeeScheduler {

  /**
   * Add monthly fees to all active students' pending amounts
   * Run this function every month at midnight
   */
  static async addMonthlyFeesToAllStudents(): Promise<void> {
    try {
      console.log('🕛 Starting monthly fee update process...');
      
      // Get all active students with their class information
      const activeStudents = await db
        .select({
          id: students.id,
          name: students.name,
          studentId: students.studentId,
          classId: students.classId,
          courseType: students.courseType,
          pendingAmount: students.pendingAmount,
          isActive: students.isActive
        })
        .from(students)
        .where(eq(students.isActive, true));

      console.log(`📊 Found ${activeStudents.length} active students to process`);

      let updatedCount = 0;
      let totalFeesAdded = 0;

      for (const student of activeStudents) {
        try {
          // Get monthly fee for this student's class and course type
          const [classFee] = await db
            .select()
            .from(classFees)
            .where(
              and(
                eq(classFees.classId, student.classId),
                eq(classFees.courseType, student.courseType)
              )
            )
            .limit(1);

          if (!classFee) {
            console.warn(`⚠️ No fee structure found for student ${student.studentId} (Class: ${student.classId}, Type: ${student.courseType})`);
            continue;
          }

          const monthlyFee = parseFloat(classFee.monthlyFee);
          const currentPending = parseFloat(student.pendingAmount || '0');
          const newPendingAmount = currentPending + monthlyFee;

          // Update student's pending amount
          await db
            .update(students)
            .set({
              pendingAmount: newPendingAmount.toString(),
              paymentStatus: newPendingAmount > 0 ? 'pending' : 'paid'
            })
            .where(eq(students.id, student.id));

          console.log(`✅ Updated ${student.studentId} (${student.name}): Added ₹${monthlyFee}, New pending: ₹${newPendingAmount}`);
          
          updatedCount++;
          totalFeesAdded += monthlyFee;

        } catch (studentError) {
          console.error(`❌ Error updating student ${student.studentId}:`, studentError);
        }
      }

      console.log(`🎉 Monthly fee update completed!`);
      console.log(`📈 Summary: ${updatedCount} students updated, ₹${totalFeesAdded.toLocaleString()} total fees added`);

    } catch (error) {
      console.error('❌ Monthly fee update failed:', error);
      throw error;
    }
  }

  /**
   * Preview what the monthly fee update would do (without actually updating)
   * Useful for testing and verification
   */
  static async previewMonthlyFeeUpdate(): Promise<{
    studentsToUpdate: number;
    totalFeesToAdd: number;
    studentDetails: Array<{
      studentId: string;
      name: string;
      currentPending: number;
      monthlyFee: number;
      newPending: number;
    }>;
  }> {
    try {
      console.log('👀 Previewing monthly fee update...');
      
      const activeStudents = await db
        .select({
          id: students.id,
          name: students.name,
          studentId: students.studentId,
          classId: students.classId,
          courseType: students.courseType,
          pendingAmount: students.pendingAmount
        })
        .from(students)
        .where(eq(students.isActive, true));

      const preview = {
        studentsToUpdate: 0,
        totalFeesToAdd: 0,
        studentDetails: [] as Array<{
          studentId: string;
          name: string;
          currentPending: number;
          monthlyFee: number;
          newPending: number;
        }>
      };

      for (const student of activeStudents) {
        const [classFee] = await db
          .select()
          .from(classFees)
          .where(
            and(
              eq(classFees.classId, student.classId),
              eq(classFees.courseType, student.courseType)
            )
          )
          .limit(1);

        if (classFee) {
          const monthlyFee = parseFloat(classFee.monthlyFee);
          const currentPending = parseFloat(student.pendingAmount || '0');
          const newPending = currentPending + monthlyFee;

          preview.studentsToUpdate++;
          preview.totalFeesToAdd += monthlyFee;
          preview.studentDetails.push({
            studentId: student.studentId,
            name: student.name,
            currentPending,
            monthlyFee,
            newPending
          });
        }
      }

      console.log(`📋 Preview complete: ${preview.studentsToUpdate} students, ₹${preview.totalFeesToAdd.toLocaleString()} total fees`);
      return preview;

    } catch (error) {
      console.error('❌ Preview failed:', error);
      throw error;
    }
  }
}

/**
 * Cron job function - call this from your scheduling system
 * Example usage in production:
 * 
 * // Using node-cron
 * cron.schedule('0 0 1 * *', async () => {
 *   console.log('Running monthly fee update...');
 *   await MonthlyFeeScheduler.addMonthlyFeesToAllStudents();
 * });
 * 
 * // Or using a scheduled task service
 * export const monthlyFeeUpdateHandler = async () => {
 *   await MonthlyFeeScheduler.addMonthlyFeesToAllStudents();
 * };
 */
export const runMonthlyFeeUpdate = async () => {
  return await MonthlyFeeScheduler.addMonthlyFeesToAllStudents();
};

export const previewMonthlyFeeUpdate = async () => {
  return await MonthlyFeeScheduler.previewMonthlyFeeUpdate();
};