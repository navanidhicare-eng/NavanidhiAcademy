import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { students, classFees, ClassFee } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from "@shared/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });

interface FeeCalculationResult {
  totalDueAmount: number;
  monthlyBreakdown: Array<{
    month: string;
    year: number;
    amount: number;
    reason: string;
  }>;
  admissionFee: number;
  totalMonthlyFees: number;
}

/**
 * Calculate retroactive fees based on enrollment date
 * 
 * Logic:
 * - Enrollment 1st-10th: Full fee for enrollment month + all subsequent months
 * - Enrollment 11th-20th: Half fee for enrollment month + full fee for subsequent months  
 * - Enrollment 21st+: No fee for enrollment month + full fee for subsequent months
 */
export class FeeCalculationService {
  
  /**
   * Calculate total due amount based on enrollment date and current date
   */
  static async calculateRetroactiveFees(
    enrollmentDate: Date,
    classId: string,
    courseType: 'monthly' | 'yearly',
    admissionFeePaid: boolean = false
  ): Promise<FeeCalculationResult> {
    
    console.log('📊 Starting retroactive fee calculation:', {
      enrollmentDate: enrollmentDate.toISOString(),
      classId,
      courseType,
      admissionFeePaid
    });

    // Get class fee structure
    const classFee = await this.getClassFee(classId, courseType);
    if (!classFee) {
      throw new Error(`No fee structure found for class ${classId} with course type ${courseType}`);
    }

    const admissionFee = parseFloat(classFee.admissionFee || '0');
    const monthlyFeeAmount = parseFloat(classFee.monthlyFee || '0');
    
    console.log('💰 Fee structure:', {
      admissionFee,
      monthlyFeeAmount,
      yearlyFee: classFee.yearlyFee
    });

    // Calculate monthly fees from enrollment to current month
    const monthlyBreakdown = this.calculateMonthlyBreakdown(
      enrollmentDate,
      monthlyFeeAmount
    );

    const totalMonthlyFees = monthlyBreakdown.reduce((sum, month) => sum + month.amount, 0);
    const totalDueAmount = (admissionFeePaid ? 0 : admissionFee) + totalMonthlyFees;

    console.log('📋 Fee calculation complete:', {
      totalDueAmount,
      admissionFee: admissionFeePaid ? 0 : admissionFee,
      totalMonthlyFees,
      monthCount: monthlyBreakdown.length
    });

    return {
      totalDueAmount,
      monthlyBreakdown,
      admissionFee: admissionFeePaid ? 0 : admissionFee,
      totalMonthlyFees
    };
  }

  /**
   * Get class fee structure from database
   */
  private static async getClassFee(classId: string, courseType: string): Promise<ClassFee | null> {
    const [classFee] = await db
      .select()
      .from(schema.classFees)
      .where(
        and(
          eq(schema.classFees.classId, classId),
          eq(schema.classFees.courseType, courseType)
        )
      )
      .limit(1);

    return classFee || null;
  }

  /**
   * Calculate monthly fee breakdown from enrollment date to current month
   */
  private static calculateMonthlyBreakdown(
    enrollmentDate: Date,
    monthlyFeeAmount: number
  ): Array<{ month: string; year: number; amount: number; reason: string }> {
    
    const breakdown: Array<{ month: string; year: number; amount: number; reason: string }> = [];
    const currentDate = new Date();
    
    // Start from enrollment month
    const currentMonth = new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth(), 1);
    const endMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    console.log('📅 Calculating monthly breakdown from', currentMonth.toISOString(), 'to', endMonth.toISOString());

    while (currentMonth <= endMonth) {
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const year = currentMonth.getFullYear();
      
      let amount = 0;
      let reason = '';
      
      // Check if this is the enrollment month
      if (currentMonth.getMonth() === enrollmentDate.getMonth() && 
          currentMonth.getFullYear() === enrollmentDate.getFullYear()) {
        
        const enrollmentDay = enrollmentDate.getDate();
        
        if (enrollmentDay <= 10) {
          amount = monthlyFeeAmount;
          reason = `Full monthly fee - enrolled on ${enrollmentDay}th (1st-10th: full fee)`;
        } else if (enrollmentDay <= 20) {
          amount = monthlyFeeAmount / 2;
          reason = `Half monthly fee - enrolled on ${enrollmentDay}th (11th-20th: half fee)`;
        } else {
          amount = 0;
          reason = `No fee - enrolled on ${enrollmentDay}th (21st+: no fee for enrollment month)`;
        }
      } else {
        // Subsequent months always get full fee
        amount = monthlyFeeAmount;
        reason = `Full monthly fee - subsequent month`;
      }
      
      breakdown.push({
        month: monthName,
        year,
        amount,
        reason
      });
      
      console.log(`📆 ${monthName} ${year}: ₹${amount} (${reason})`);
      
      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return breakdown;
  }

  /**
   * Update student's fee amounts in database based on calculation
   */
  static async updateStudentFeeAmounts(
    studentId: string,
    feeCalculation: FeeCalculationResult
  ): Promise<void> {
    
    console.log('💾 Updating student fee amounts in database:', {
      studentId,
      totalDueAmount: feeCalculation.totalDueAmount
    });

    await db
      .update(schema.students)
      .set({
        totalFeeAmount: feeCalculation.totalDueAmount.toString(),
        pendingAmount: feeCalculation.totalDueAmount.toString(),
        paidAmount: '0.00',
        paymentStatus: feeCalculation.totalDueAmount > 0 ? 'pending' : 'paid'
      })
      .where(eq(schema.students.id, studentId));

    console.log('✅ Student fee amounts updated successfully');
  }

  /**
   * Calculate and update fees for existing student (useful for enrollment date changes)
   */
  static async recalculateStudentFees(studentId: string): Promise<FeeCalculationResult> {
    
    console.log('🔄 Recalculating fees for existing student:', studentId);

    // Get student details
    const [student] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    if (!student.enrollmentDate) {
      throw new Error(`No enrollment date found for student: ${studentId}`);
    }

    // Calculate fees
    const feeCalculation = await this.calculateRetroactiveFees(
      new Date(student.enrollmentDate),
      student.classId,
      student.courseType,
      student.admissionFeePaid || false
    );

    // Update student record
    await this.updateStudentFeeAmounts(studentId, feeCalculation);

    return feeCalculation;
  }
}