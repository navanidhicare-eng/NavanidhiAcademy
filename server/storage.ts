import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, asc, sql as sqlQuery, inArray, gte, lte, like } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Student,
  InsertStudent,
  StudentSibling,
  InsertStudentSibling,
  ClassFee,
  InsertClassFee,
  StudentCounter,
  InsertStudentCounter,
  SoCenter,
  InsertSoCenter,
  Class,
  InsertClass,
  Subject,
  InsertSubject,
  Chapter,
  InsertChapter,
  Topic,
  InsertTopic,
  TopicProgress,
  InsertTopicProgress,
  Payment,
  InsertPayment,
  WalletTransaction,
  InsertWalletTransaction,
  Attendance,
  InsertAttendance,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });

// Initialize database with default data
async function initializeDatabase() {
  try {
    // Check if states exist
    const existingStates = await db.select().from(schema.states);
    
    if (existingStates.length === 0) {
      console.log('Initializing database with default states...');
      
      // Add default states
      const defaultStates = [
        { name: 'Andhra Pradesh', code: 'AP' },
        { name: 'Telangana', code: 'TS' },
        { name: 'Karnataka', code: 'KA' },
        { name: 'Tamil Nadu', code: 'TN' },
        { name: 'Kerala', code: 'KL' }
      ];
      
      for (const state of defaultStates) {
        await db.insert(schema.states).values(state);
      }
      
      console.log('Database initialized with default states');
    }
    
    // Check if classes exist
    const existingClasses = await db.select().from(schema.classes);
    
    if (existingClasses.length === 0) {
      console.log('Initializing database with default classes...');
      
      // Add default classes
      const defaultClasses = [
        { name: '1st Class', description: 'First standard' },
        { name: '2nd Class', description: 'Second standard' },
        { name: '3rd Class', description: 'Third standard' },
        { name: '4th Class', description: 'Fourth standard' },
        { name: '5th Class', description: 'Fifth standard' },
        { name: '6th Class', description: 'Sixth standard' },
        { name: '7th Class', description: 'Seventh standard' },
        { name: '8th Class', description: 'Eighth standard' },
        { name: '9th Class', description: 'Ninth standard' },
        { name: '10th Class', description: 'Tenth standard' }
      ];
      
      for (const classData of defaultClasses) {
        await db.insert(schema.classes).values(classData);
      }
      
      console.log('Database initialized with default classes');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // SO Center methods
  getSoCenter(id: string): Promise<SoCenter | undefined>;
  getAllSoCenters(): Promise<SoCenter[]>;
  createSoCenter(center: InsertSoCenter): Promise<SoCenter>;
  updateSoCenterWallet(id: string, amount: number): Promise<SoCenter>;

  // Academic structure methods
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  getSubjectsByClass(classId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  getChaptersBySubject(subjectId: string): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  getTopicsByChapter(chapterId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;

  // Student methods
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByQr(qrCode: string): Promise<Student | undefined>;
  getStudentsBySoCenter(soCenterId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student>;

  // Progress methods
  getStudentProgress(studentId: string): Promise<TopicProgress[]>;
  updateTopicProgress(progress: InsertTopicProgress): Promise<TopicProgress>;
  getProgressByTopic(topicId: string, studentId: string): Promise<TopicProgress | undefined>;

  // Payment methods
  getStudentPayments(studentId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySoCenter(soCenterId: string): Promise<Payment[]>;
  getPaymentsByDateRange(soCenterId: string, startDate: Date, endDate: Date): Promise<Payment[]>;
  
  // Payment processing and history
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  processStudentPayment(paymentData: {
    studentId: string;
    amount: number;
    feeType: 'monthly' | 'yearly';
    receiptNumber: string;
    expectedFeeAmount: number;
  }): Promise<{
    payment: Payment;
    transactionId: string;
    walletUpdated: boolean;
  }>;

  // Attendance methods
  submitAttendance(attendanceData: {
    date: string;
    classId: string;
    soCenterId: string;
    markedBy: string;
    records: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'holiday';
    }>;
  }): Promise<{ presentCount: number; absentCount: number; holidayCount: number }>;

  getMonthlyAttendanceReport(params: {
    soCenterId: string;
    month: string;
    classId: string;
  }): Promise<{
    students: Array<{
      id: string;
      name: string;
      studentId: string;
      attendanceRecords: Array<{
        date: string;
        status: 'present' | 'absent' | 'holiday';
      }>;
    }>;
  }>;
  
  getAttendanceStats(params: {
    soCenterId: string;
    month: string;
    classId?: string;
  }): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalHolidays: number;
    classWiseStats: Array<{
      className: string;
      present: number;
      absent: number;
      total: number;
      percentage: number;
    }>;
  }>;
  
  getStudentAttendanceReport(studentId: string, month: string): Promise<{
    studentId: string;
    studentName: string;
    attendanceRecords: Array<{
      date: string;
      status: 'present' | 'absent' | 'holiday';
    }>;
    attendancePercentage: number;
    totalPresent: number;
    totalAbsent: number;
    totalDays: number;
  }>;

  // Wallet methods
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getWalletTransactions(soCenterId: string): Promise<WalletTransaction[]>;

  // Address hierarchy methods
  getAllStates(): Promise<any[]>;
  getAllDistricts(): Promise<any[]>;
  getAllMandals(): Promise<any[]>;
  getAllVillages(): Promise<any[]>;
  getDistrictsByState(stateId: string): Promise<any[]>;
  getMandalsByDistrict(districtId: string): Promise<any[]>;
  getVillagesByMandal(mandalId: string): Promise<any[]>;
  createState(data: any): Promise<any>;
  createDistrict(data: any): Promise<any>;
  createMandal(data: any): Promise<any>;
  createVillage(data: any): Promise<any>;

  // Products methods (for commission calculation)
  getAllProducts(): Promise<any[]>;
  createProduct(data: any): Promise<any>;

  // Enhanced SO Center methods
  getNextSoCenterId(): Promise<string>;
  getSoCenterByCenterId(centerId: string): Promise<SoCenter | undefined>;
  getAvailableManagers(): Promise<User[]>;
  updateSoCenter(id: string, updates: Partial<InsertSoCenter>): Promise<SoCenter>;
  deleteSoCenter(id: string): Promise<void>;

  // Enhanced User methods
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Enhanced Academic structure methods
  updateClass(id: string, updates: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: string): Promise<void>;
  updateSubject(id: string, updates: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  updateChapter(id: string, updates: Partial<InsertChapter>): Promise<Chapter>;
  deleteChapter(id: string): Promise<void>;
  updateTopic(id: string, updates: Partial<InsertTopic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
  getAllSubjects(): Promise<Subject[]>;
  getAllChapters(): Promise<Chapter[]>;
  getAllTopics(): Promise<Topic[]>;

  // Fee Structure methods
  getAllFeeStructures(): Promise<any[]>;
  createFeeStructure(fee: any): Promise<any>;
  updateFeeStructure(id: string, updates: any): Promise<any>;
  deleteFeeStructure(id: string): Promise<void>;

  // Enhanced Student methods
  getAllStudents(): Promise<Student[]>;
  deleteStudent(id: string): Promise<void>;
  generateStudentId(): Promise<string>;
  createStudentWithSiblings(studentData: InsertStudent, siblings?: InsertStudentSibling[]): Promise<Student>;
  validateAadharNumber(aadharNumber: string): Promise<boolean>;
  getStudentSiblings(studentId: string): Promise<StudentSibling[]>;
  
  // Homework Activity methods
  createHomeworkActivity(activities: InsertHomeworkActivity[]): Promise<HomeworkActivity[]>;
  getHomeworkActivities(params: {
    classId?: string;
    subjectId?: string;
    date?: string;
    soCenterId?: string;
  }): Promise<HomeworkActivity[]>;

  // Tuition Progress methods
  createTuitionProgress(progress: InsertTuitionProgress): Promise<TuitionProgress>;
  getTuitionProgress(params: {
    classId?: string;
    topicId?: string;
    studentId?: string;
    soCenterId?: string;
  }): Promise<TuitionProgress[]>;
  updateTuitionProgress(id: string, updates: Partial<InsertTuitionProgress>): Promise<TuitionProgress>;

  // Class Fees methods
  getClassFees(classId: string, courseType: string): Promise<ClassFee | undefined>;
  getAllClassFees(): Promise<ClassFee[]>;
  createClassFee(classFee: InsertClassFee): Promise<ClassFee>;
  updateClassFee(id: string, updates: Partial<InsertClassFee>): Promise<ClassFee>;
  deleteClassFee(id: string): Promise<void>;

  // Enhanced Payment methods
  getAllPayments(): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getSoCenter(id: string): Promise<SoCenter | undefined> {
    const result = await db.select().from(schema.soCenters).where(eq(schema.soCenters.id, id));
    return result[0];
  }

  async getAllSoCenters(): Promise<any[]> {
    // Get SO Centers with manager info and student counts
    const centers = await db
      .select({
        id: schema.soCenters.id,
        name: schema.soCenters.name,
        email: schema.soCenters.email,
        centerId: schema.soCenters.centerId,
        address: schema.soCenters.address,
        phone: schema.soCenters.phone,
        managerId: schema.soCenters.managerId,
        ownerName: schema.soCenters.ownerName,
        ownerLastName: schema.soCenters.ownerLastName,
        ownerPhone: schema.soCenters.ownerPhone,
        walletBalance: schema.soCenters.walletBalance,
        isActive: schema.soCenters.isActive,
        createdAt: schema.soCenters.createdAt,
        villageId: schema.soCenters.villageId,
        // Manager information
        managerName: schema.users.name,
        managerEmail: schema.users.email,
        // Village information  
        villageName: schema.villages.name,
        mandalName: schema.mandals.name,
        districtName: schema.districts.name,
        stateName: schema.states.name,
      })
      .from(schema.soCenters)
      .leftJoin(schema.users, eq(schema.soCenters.managerId, schema.users.id))
      .leftJoin(schema.villages, eq(schema.soCenters.villageId, schema.villages.id))
      .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
      .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
      .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
      .where(eq(schema.soCenters.isActive, true))
      .orderBy(desc(schema.soCenters.createdAt));

    // Get student counts for each center
    const centerIds = centers.map(c => c.id);
    const studentCounts = centerIds.length > 0 ? await db
      .select({
        centerId: schema.students.soCenterId,
        count: sqlQuery<number>`count(*)::int`
      })
      .from(schema.students)
      .where(and(
        inArray(schema.students.soCenterId, centerIds),
        eq(schema.students.isActive, true)
      ))
      .groupBy(schema.students.soCenterId) : [];

    // Combine center data with student counts
    return centers.map(center => ({
      ...center,
      studentCount: studentCounts.find(sc => sc.centerId === center.id)?.count || 0
    }));
  }

  async createSoCenter(center: InsertSoCenter): Promise<SoCenter> {
    console.log('🏢 Creating SO Center with data:', {
      name: center.name,
      email: center.email,
      centerId: center.centerId
    });
    
    return await db.transaction(async (tx) => {
      // Create the SO Center record
      console.log('📝 Inserting SO Center record...');
      const [newCenter] = await tx.insert(schema.soCenters).values(center).returning();
      console.log('✅ SO Center created with ID:', newCenter.id);
      
      // Check if user with this email already exists
      const existingUser = await tx.select()
        .from(schema.users)
        .where(eq(schema.users.email, center.email!))
        .limit(1);
      
      if (existingUser.length > 0) {
        console.log('⚠️  User with email already exists, updating user role to so_center');
        // Update existing user to have so_center role and link to this center
        await tx.update(schema.users)
          .set({ 
            role: 'so_center' as const,
            name: center.name,
            phone: center.phone,
            villageId: center.villageId,
            isActive: true
          })
          .where(eq(schema.users.email, center.email!));
        console.log('✅ Existing user updated with SO Center role');
      } else {
        console.log('👤 Creating new user authentication record...');
        // Create corresponding user authentication record
        const userData: schema.InsertUser = {
          email: center.email || `${center.centerId}@navanidhi.com`,
          name: center.name,
          role: 'so_center' as const,
          password: center.password || '12345678',
          phone: center.phone,
          villageId: center.villageId,
          isActive: true
        };
        
        await tx.insert(schema.users).values(userData);
        console.log('✅ New user authentication created');
      }
      
      console.log('🎉 SO Center creation completed successfully');
      return newCenter;
    });
  }

  async updateSoCenterWallet(id: string, amount: number): Promise<SoCenter> {
    // Add the amount to existing wallet balance, don't replace it
    const numericAmount = Number(amount);
    console.log('💰 Wallet update - ID:', id, 'Amount:', amount, 'Parsed:', numericAmount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Invalid amount for wallet update: ${amount} (parsed: ${numericAmount})`);
    }
    
    // Use direct SQL update with proper numeric conversion
    const [updatedCenter] = await db.update(schema.soCenters)
      .set({ 
        walletBalance: sqlQuery`CAST(${schema.soCenters.walletBalance} AS NUMERIC) + CAST(${numericAmount} AS NUMERIC)`
      })
      .where(eq(schema.soCenters.id, id))
      .returning();
    console.log('✅ Wallet updated successfully to:', updatedCenter?.walletBalance);
    return updatedCenter;
  }

  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(schema.classes).where(eq(schema.classes.isActive, true));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(schema.classes).values(classData).returning();
    return result[0];
  }

  async getSubjectsByClass(classId: string): Promise<Subject[]> {
    return await db.select().from(schema.subjects)
      .where(and(eq(schema.subjects.classId, classId), eq(schema.subjects.isActive, true)));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(schema.subjects).values(subject).returning();
    return result[0];
  }

  async getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return await db.select().from(schema.chapters)
      .where(and(eq(schema.chapters.subjectId, subjectId), eq(schema.chapters.isActive, true)))
      .orderBy(asc(schema.chapters.orderIndex));
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const result = await db.insert(schema.chapters).values(chapter).returning();
    return result[0];
  }

  async getTopicsByChapter(chapterId: string): Promise<Topic[]> {
    return await db.select().from(schema.topics)
      .where(and(eq(schema.topics.chapterId, chapterId), eq(schema.topics.isActive, true)))
      .orderBy(asc(schema.topics.orderIndex));
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const result = await db.insert(schema.topics).values(topic).returning();
    return result[0];
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(schema.students).where(eq(schema.students.id, id));
    return result[0];
  }

  async getStudentByQr(qrCode: string): Promise<Student | undefined> {
    const result = await db.select().from(schema.students).where(eq(schema.students.qrCode, qrCode));
    return result[0];
  }

  async getStudentsBySoCenter(soCenterId: string): Promise<any[]> {
    const results = await db.select({
      id: schema.students.id,
      name: schema.students.name,
      parentPhone: schema.students.parentPhone,
      fatherMobile: schema.students.fatherMobile,
      classId: schema.students.classId,
      className: schema.classes.name,
      soCenterId: schema.students.soCenterId,
      createdAt: schema.students.createdAt,
      qrCode: schema.students.qrCode,
      studentId: schema.students.studentId,
      aadharNumber: schema.students.aadharNumber,
      fatherName: schema.students.fatherName,
      motherName: schema.students.motherName,
      courseType: schema.students.courseType,
      villageId: schema.students.villageId,
      dateOfBirth: schema.students.dateOfBirth,
      gender: schema.students.gender,
      isActive: schema.students.isActive,
      paymentStatus: schema.students.paymentStatus,
      totalFeeAmount: schema.students.totalFeeAmount,
      paidAmount: schema.students.paidAmount,
      pendingAmount: schema.students.pendingAmount
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(eq(schema.students.soCenterId, soCenterId), eq(schema.students.isActive, true)))
    .orderBy(desc(schema.students.createdAt));
    
    return results;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const qrCode = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.insert(schema.students)
      .values({ ...student, qrCode } as any)
      .returning();
    return result[0];
  }

  async getAllStudents(): Promise<any[]> {
    const results = await db.select({
      id: schema.students.id,
      name: schema.students.name,
      parentPhone: schema.students.parentPhone,
      fatherMobile: schema.students.fatherMobile,
      classId: schema.students.classId,
      className: schema.classes.name,
      soCenterId: schema.students.soCenterId,
      createdAt: schema.students.createdAt,
      qrCode: schema.students.qrCode,
      studentId: schema.students.studentId,
      aadharNumber: schema.students.aadharNumber,
      fatherName: schema.students.fatherName,
      motherName: schema.students.motherName,
      courseType: schema.students.courseType,
      villageId: schema.students.villageId,
      dateOfBirth: schema.students.dateOfBirth,
      gender: schema.students.gender,
      isActive: schema.students.isActive,
      paymentStatus: schema.students.paymentStatus,
      totalFeeAmount: schema.students.totalFeeAmount,
      paidAmount: schema.students.paidAmount,
      pendingAmount: schema.students.pendingAmount
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(eq(schema.students.isActive, true))
    .orderBy(desc(schema.students.createdAt));
    
    return results;
  }

  async updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student> {
    const result = await db.update(schema.students)
      .set(updates)
      .where(eq(schema.students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<void> {
    await db.update(schema.students)
      .set({ isActive: false })
      .where(eq(schema.students.id, id));
  }

  async getStudentProgress(studentId: string): Promise<TopicProgress[]> {
    return await db.select().from(schema.topicProgress)
      .where(eq(schema.topicProgress.studentId, studentId))
      .orderBy(desc(schema.topicProgress.updatedAt));
  }

  async updateTopicProgress(progress: InsertTopicProgress): Promise<TopicProgress> {
    const existing = await this.getProgressByTopic(progress.topicId!, progress.studentId!);
    
    if (existing) {
      const result = await db.update(schema.topicProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(and(
          eq(schema.topicProgress.studentId, progress.studentId!),
          eq(schema.topicProgress.topicId, progress.topicId!)
        ))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.topicProgress).values(progress).returning();
      return result[0];
    }
  }

  async getProgressByTopic(topicId: string, studentId: string): Promise<TopicProgress | undefined> {
    const result = await db.select().from(schema.topicProgress)
      .where(and(
        eq(schema.topicProgress.topicId, topicId),
        eq(schema.topicProgress.studentId, studentId)
      ));
    return result[0];
  }

  async getStudentPayments(studentId: string): Promise<Payment[]> {
    return await db.select().from(schema.payments)
      .where(eq(schema.payments.studentId, studentId))
      .orderBy(desc(schema.payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(schema.payments).values(payment).returning();
    return result[0];
  }

  async getPaymentsBySoCenter(soCenterId: string): Promise<Payment[]> {
    const results = await db.select()
    .from(schema.payments)
    .innerJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
    .where(eq(schema.students.soCenterId, soCenterId))
    .orderBy(desc(schema.payments.createdAt));
    
    return results.map(result => result.payments);
  }

  async getPaymentsByDateRange(soCenterId: string, startDate: Date, endDate: Date): Promise<Payment[]> {
    const results = await db.select()
    .from(schema.payments)
    .innerJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
    .where(
      and(
        eq(schema.students.soCenterId, soCenterId),
        gte(schema.payments.createdAt, startDate),
        lte(schema.payments.createdAt, endDate)
      )
    )
    .orderBy(desc(schema.payments.createdAt));
    
    return results.map(result => result.payments);
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const result = await db.insert(schema.walletTransactions).values(transaction).returning();
    return result[0];
  }

  async getWalletTransactions(soCenterId: string): Promise<WalletTransaction[]> {
    return await db.select().from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.soCenterId, soCenterId))
      .orderBy(desc(schema.walletTransactions.createdAt));
  }

  // Get payments by student for payment history
  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return await db.select()
      .from(schema.payments)
      .where(eq(schema.payments.studentId, studentId))
      .orderBy(desc(schema.payments.createdAt));
  }

  // Process student payment with wallet update and transaction recording
  async processStudentPayment(paymentData: {
    studentId: string;
    amount: number;
    feeType: 'monthly' | 'yearly';
    receiptNumber: string;
    expectedFeeAmount: number;
  }): Promise<{
    payment: Payment;
    transactionId: string;
    walletUpdated: boolean;
    studentName: string;
    studentId: string;
    className: string;
    amount: number;
    receiptNumber: string;
    feeType: string;
    parentPhone: string;
    fatherMobile: string;
    newPaidAmount: number;
    newPendingAmount: number;
    totalFeeAmount: number;
  }> {
    const { studentId, amount, feeType, receiptNumber, expectedFeeAmount } = paymentData;
    const transactionId = `TXN-${Date.now()}-${studentId.slice(0, 8)}`;

    return await db.transaction(async (tx) => {
      // Get student to find SO Center
      const [student] = await tx.select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId));

      if (!student) {
        throw new Error('Student not found');
      }

      // Create payment record
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      const currentYear = new Date().getFullYear();

      const [payment] = await tx.insert(schema.payments).values({
        studentId,
        amount: amount.toString(),
        paymentMethod: 'cash',
        description: `${feeType} fee payment - Receipt: ${receiptNumber}`,
        month: feeType === 'monthly' ? currentMonth : null,
        year: feeType === 'monthly' ? currentYear : currentYear,
        receiptNumber,
        transactionId,
        recordedBy: student.soCenterId // Using SO center as recorder for now
      }).returning();

      // Update student payment tracking
      const numericAmount = Number(amount);
      const currentPaidAmount = Number(student.paidAmount || 0);
      let totalFeeAmount = Number(student.totalFeeAmount || 0);
      
      // Set total fee amount if not set
      if (totalFeeAmount === 0) {
        totalFeeAmount = expectedFeeAmount;
      }
      
      const newPaidAmount = currentPaidAmount + numericAmount;
      const newPendingAmount = Math.max(0, totalFeeAmount - newPaidAmount);

      await tx.update(schema.students)
        .set({
          paidAmount: newPaidAmount.toString(),
          pendingAmount: newPendingAmount.toString(),
          totalFeeAmount: totalFeeAmount.toString(),
          paymentStatus: newPendingAmount === 0 ? 'paid' : 'pending'
        })
        .where(eq(schema.students.id, studentId));

      // Update SO Center wallet - using proper numeric addition
      
      // Get current wallet balance first
      const [currentBalance] = await tx.select({ balance: schema.soCenters.walletBalance })
        .from(schema.soCenters)
        .where(eq(schema.soCenters.id, student.soCenterId));
      
      const newBalance = Number(currentBalance.balance) + numericAmount;
      
      await tx.update(schema.soCenters)
        .set({ 
          walletBalance: newBalance.toString()
        })
        .where(eq(schema.soCenters.id, student.soCenterId));

      // Create wallet transaction record
      await tx.insert(schema.walletTransactions).values({
        soCenterId: student.soCenterId,
        amount: amount.toString(),
        type: 'credit',
        description: `${feeType} fee payment from ${student.name} - Receipt: ${receiptNumber}`
      });

      // Get updated student details for invoice
      const [updatedStudent] = await tx.select()
        .from(schema.students)
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .where(eq(schema.students.id, studentId));

      return {
        payment,
        transactionId,
        walletUpdated: true,
        studentName: updatedStudent.students.name,
        studentId: updatedStudent.students.studentId,
        className: updatedStudent.classes?.name || 'Unknown Class',
        amount: amount,
        receiptNumber,
        feeType,
        parentPhone: updatedStudent.students.parentPhone,
        fatherMobile: updatedStudent.students.fatherMobile,
        newPaidAmount,
        newPendingAmount,
        totalFeeAmount
      };
    });
  }
  // Address hierarchy methods
  async getAllStates(): Promise<any[]> {
    return await db.select().from(schema.states).where(eq(schema.states.isActive, true)).orderBy(asc(schema.states.name));
  }

  async getAllDistricts(): Promise<any[]> {
    return await db.select().from(schema.districts).where(eq(schema.districts.isActive, true)).orderBy(asc(schema.districts.name));
  }

  async getAllMandals(): Promise<any[]> {
    return await db.select().from(schema.mandals).where(eq(schema.mandals.isActive, true)).orderBy(asc(schema.mandals.name));
  }

  async getAllVillages(): Promise<any[]> {
    return await db.select().from(schema.villages).where(eq(schema.villages.isActive, true)).orderBy(asc(schema.villages.name));
  }

  async getDistrictsByState(stateId: string): Promise<any[]> {
    return await db.select().from(schema.districts).where(
      and(eq(schema.districts.stateId, stateId), eq(schema.districts.isActive, true))
    ).orderBy(asc(schema.districts.name));
  }

  async getMandalsByDistrict(districtId: string): Promise<any[]> {
    return await db.select().from(schema.mandals).where(
      and(eq(schema.mandals.districtId, districtId), eq(schema.mandals.isActive, true))
    ).orderBy(asc(schema.mandals.name));
  }

  async getVillagesByMandal(mandalId: string): Promise<any[]> {
    return await db.select().from(schema.villages).where(
      and(eq(schema.villages.mandalId, mandalId), eq(schema.villages.isActive, true))
    ).orderBy(asc(schema.villages.name));
  }

  async createState(data: any): Promise<any> {
    const result = await db.insert(schema.states).values(data).returning();
    return result[0];
  }

  async createDistrict(data: any): Promise<any> {
    const result = await db.insert(schema.districts).values(data).returning();
    return result[0];
  }

  async createMandal(data: any): Promise<any> {
    const result = await db.insert(schema.mandals).values(data).returning();
    return result[0];
  }

  async createVillage(data: any): Promise<any> {
    const result = await db.insert(schema.villages).values(data).returning();
    return result[0];
  }

  // Products methods (for commission calculation)
  async getAllProducts(): Promise<any[]> {
    return await db.select().from(schema.products).where(eq(schema.products.isActive, true)).orderBy(asc(schema.products.name));
  }

  async createProduct(data: any): Promise<any> {
    const result = await db.insert(schema.products).values(data).returning();
    return result[0];
  }

  // Enhanced SO Center methods
  async getNextSoCenterId(): Promise<string> {
    // Get all existing center IDs
    const centers = await db.select().from(schema.soCenters);
    console.log('Existing centers:', centers.map(c => c.centerId));
    
    // Extract numeric parts and find maximum
    let maxNumber = 0;
    centers.forEach(center => {
      if (center.centerId) {
        const match = center.centerId.match(/NNASOC(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          console.log(`Found center ID: ${center.centerId}, extracted number: ${num}`);
          maxNumber = Math.max(maxNumber, num);
        }
      }
    });
    
    const nextId = `NNASOC${String(maxNumber + 1).padStart(5, '0')}`;
    console.log(`Next center ID will be: ${nextId}`);
    return nextId;
  }

  async getSoCenterByCenterId(centerId: string): Promise<SoCenter | undefined> {
    const result = await db.select().from(schema.soCenters).where(eq(schema.soCenters.centerId, centerId));
    return result[0];
  }

  async getAvailableManagers(): Promise<User[]> {
    return await db.select().from(schema.users).where(
      and(
        eq(schema.users.isActive, true),
        eq(schema.users.role, 'so_center')
      )
    ).orderBy(asc(schema.users.name));
  }

  async updateSoCenter(id: string, updates: Partial<InsertSoCenter>): Promise<SoCenter> {
    const result = await db.update(schema.soCenters)
      .set(updates)
      .where(eq(schema.soCenters.id, id))
      .returning();
    return result[0];
  }

  async deleteSoCenter(id: string): Promise<void> {
    await db.update(schema.soCenters)
      .set({ isActive: false })
      .where(eq(schema.soCenters.id, id));
  }

  // Enhanced User methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(eq(schema.users.isActive, true))
      .orderBy(asc(schema.users.name));
  }

  async deleteUser(id: string): Promise<void> {
    await db.update(schema.users)
      .set({ isActive: false })
      .where(eq(schema.users.id, id));
  }

  // Enhanced Academic structure methods
  async updateClass(id: string, updates: Partial<InsertClass>): Promise<Class> {
    const result = await db.update(schema.classes)
      .set(updates)
      .where(eq(schema.classes.id, id))
      .returning();
    return result[0];
  }

  async deleteClass(id: string): Promise<void> {
    await db.update(schema.classes)
      .set({ isActive: false })
      .where(eq(schema.classes.id, id));
  }

  async updateSubject(id: string, updates: Partial<InsertSubject>): Promise<Subject> {
    const result = await db.update(schema.subjects)
      .set(updates)
      .where(eq(schema.subjects.id, id))
      .returning();
    return result[0];
  }

  async deleteSubject(id: string): Promise<void> {
    await db.update(schema.subjects)
      .set({ isActive: false })
      .where(eq(schema.subjects.id, id));
  }

  async updateChapter(id: string, updates: Partial<InsertChapter>): Promise<Chapter> {
    const result = await db.update(schema.chapters)
      .set(updates)
      .where(eq(schema.chapters.id, id))
      .returning();
    return result[0];
  }

  async deleteChapter(id: string): Promise<void> {
    await db.update(schema.chapters)
      .set({ isActive: false })
      .where(eq(schema.chapters.id, id));
  }

  async updateTopic(id: string, updates: Partial<InsertTopic>): Promise<Topic> {
    const result = await db.update(schema.topics)
      .set(updates)
      .where(eq(schema.topics.id, id))
      .returning();
    return result[0];
  }

  async deleteTopic(id: string): Promise<void> {
    await db.update(schema.topics)
      .set({ isActive: false })
      .where(eq(schema.topics.id, id));
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(schema.subjects)
      .where(eq(schema.subjects.isActive, true))
      .orderBy(asc(schema.subjects.name));
  }

  async getAllChapters(): Promise<Chapter[]> {
    return await db.select().from(schema.chapters)
      .where(eq(schema.chapters.isActive, true))
      .orderBy(asc(schema.chapters.name));
  }

  async getAllTopics(): Promise<Topic[]> {
    return await db.select().from(schema.topics)
      .where(eq(schema.topics.isActive, true))
      .orderBy(asc(schema.topics.name));
  }

  // Fee Structure methods (using products table for now)
  async getAllFeeStructures(): Promise<any[]> {
    return await db.select().from(schema.products)
      .where(eq(schema.products.isActive, true))
      .orderBy(asc(schema.products.name));
  }

  async createFeeStructure(fee: any): Promise<any> {
    const result = await db.insert(schema.products).values(fee).returning();
    return result[0];
  }

  async updateFeeStructure(id: string, updates: any): Promise<any> {
    const result = await db.update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, id))
      .returning();
    return result[0];
  }

  async deleteFeeStructure(id: string): Promise<void> {
    await db.update(schema.products)
      .set({ isActive: false })
      .where(eq(schema.products.id, id));
  }

  // Enhanced Student methods

  // Enhanced Payment methods
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(schema.payments)
      .orderBy(desc(schema.payments.createdAt));
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const result = await db.update(schema.payments)
      .set(updates)
      .where(eq(schema.payments.id, id))
      .returning();
    return result[0];
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(schema.payments).where(eq(schema.payments.id, id));
  }

  // Student ID Generation with NNAS25000001 format
  async generateStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Get last 2 digits (e.g., 25 for 2025)
    
    return await db.transaction(async (tx) => {
      // Get or create counter for current year
      let counter = await tx.select()
        .from(schema.studentCounter)
        .where(eq(schema.studentCounter.year, currentYear))
        .limit(1);
      
      if (counter.length === 0) {
        // Create new counter for the year
        const [newCounter] = await tx.insert(schema.studentCounter)
          .values({
            year: currentYear,
            currentNumber: 1
          })
          .returning();
        
        const paddedNumber = String(1).padStart(7, '0');
        return `NNAS${yearSuffix}${paddedNumber}`;
      } else {
        // Increment existing counter
        const nextNumber = counter[0].currentNumber + 1;
        await tx.update(schema.studentCounter)
          .set({ 
            currentNumber: nextNumber,
            updatedAt: new Date()
          })
          .where(eq(schema.studentCounter.year, currentYear));
        
        const paddedNumber = String(nextNumber).padStart(7, '0');
        return `NNAS${yearSuffix}${paddedNumber}`;
      }
    });
  }

  // Validate Aadhar Number uniqueness
  async validateAadharNumber(aadharNumber: string): Promise<boolean> {
    const existing = await db.select()
      .from(schema.students)
      .where(eq(schema.students.aadharNumber, aadharNumber))
      .limit(1);
    
    return existing.length === 0; // Returns true if Aadhar is unique
  }

  // Create student with siblings in a transaction
  async createStudentWithSiblings(studentData: InsertStudent, siblings?: InsertStudentSibling[]): Promise<Student> {
    try {
      // Generate unique student ID first (outside transaction)
      const studentId = await this.generateStudentId();
      
      return await db.transaction(async (tx) => {
        console.log('Starting database transaction for student creation...');
        
        // Create the student record
        const [newStudent] = await tx.insert(schema.students)
          .values({
            ...studentData,
            studentId,
            qrCode: `QR_${studentId}_${Date.now()}`
          })
          .returning();
        
        console.log('Student record created, ID:', newStudent.id);
        
        // Create sibling records if provided
        if (siblings && siblings.length > 0) {
          const siblingsWithStudentId = siblings.map(sibling => ({
            ...sibling,
            studentId: newStudent.id
          }));
          
          await tx.insert(schema.studentSiblings)
            .values(siblingsWithStudentId);
          
          console.log('Sibling records created:', siblings.length);
        }
        
        console.log('Transaction completed successfully');
        return newStudent;
      });
    } catch (error: any) {
      console.error('Error in createStudentWithSiblings:', error);
      throw error;
    }
  }

  // Get student siblings
  async getStudentSiblings(studentId: string): Promise<StudentSibling[]> {
    return await db.select()
      .from(schema.studentSiblings)
      .where(eq(schema.studentSiblings.studentId, studentId))
      .orderBy(asc(schema.studentSiblings.createdAt));
  }

  // Class Fees Management
  async getClassFees(classId: string, courseType: string): Promise<ClassFee | undefined> {
    const result = await db.select()
      .from(schema.classFees)
      .where(and(
        eq(schema.classFees.classId, classId),
        eq(schema.classFees.courseType, courseType as any),
        eq(schema.classFees.isActive, true)
      ))
      .limit(1);
    
    return result[0];
  }

  async getAllClassFees(): Promise<ClassFee[]> {
    return await db.select()
      .from(schema.classFees)
      .where(eq(schema.classFees.isActive, true))
      .orderBy(asc(schema.classFees.createdAt));
  }

  async createClassFee(classFee: InsertClassFee): Promise<ClassFee> {
    const [result] = await db.insert(schema.classFees)
      .values(classFee)
      .returning();
    return result;
  }

  async updateClassFee(id: string, updates: Partial<InsertClassFee>): Promise<ClassFee> {
    const [result] = await db.update(schema.classFees)
      .set(updates)
      .where(eq(schema.classFees.id, id))
      .returning();
    return result;
  }

  async deleteClassFee(id: string): Promise<void> {
    await db.update(schema.classFees)
      .set({ isActive: false })
      .where(eq(schema.classFees.id, id));
  }

  async getStudentPaymentHistory(studentId: string): Promise<any[]> {
    try {
      const payments = await db
        .select({
          id: schema.payments.id,
          amount: schema.payments.amount,
          paymentMethod: schema.payments.paymentMethod,
          description: schema.payments.description,
          month: schema.payments.month,
          year: schema.payments.year,
          createdAt: schema.payments.createdAt
        })
        .from(schema.payments)
        .where(eq(schema.payments.studentId, studentId))
        .orderBy(desc(schema.payments.createdAt));
      
      return payments;
    } catch (error) {
      console.error('Error getting student payment history:', error);
      return [];
    }
  }

  // Attendance methods
  async submitAttendance(attendanceData: {
    date: string;
    classId: string;
    soCenterId: string;
    markedBy: string;
    records: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'holiday';
    }>;
  }): Promise<{ presentCount: number; absentCount: number; holidayCount: number }> {
    // Use UPSERT for each attendance record to prevent duplicates
    const results = [];
    for (const record of attendanceData.records) {
      const [result] = await db.insert(schema.attendance)
        .values({
          studentId: record.studentId,
          classId: attendanceData.classId,
          soCenterId: attendanceData.soCenterId,
          date: attendanceData.date,
          status: record.status,
          markedBy: attendanceData.markedBy
        })
        .onConflictDoUpdate({
          target: [schema.attendance.studentId, schema.attendance.date, schema.attendance.classId],
          set: {
            status: record.status,
            markedBy: attendanceData.markedBy,
            updatedAt: new Date(),
          },
        })
        .returning();
      results.push(result);
    }

    // Count the records
    const presentCount = attendanceData.records.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.records.filter(r => r.status === 'absent').length;
    const holidayCount = attendanceData.records.filter(r => r.status === 'holiday').length;

    return { presentCount, absentCount, holidayCount };
  }

  // Get existing attendance status for students on a specific date
  async getExistingAttendance(params: {
    date: string;
    studentIds: string[];
  }): Promise<Map<string, { status: string; id: string }>> {
    const results = await db.select({
      studentId: schema.attendance.studentId,
      status: schema.attendance.status,
      id: schema.attendance.id
    })
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.date, params.date),
        inArray(schema.attendance.studentId, params.studentIds)
      )
    );

    const attendanceMap = new Map();
    results.forEach(record => {
      attendanceMap.set(record.studentId, {
        status: record.status,
        id: record.id
      });
    });
    
    return attendanceMap;
  }

  async getAttendanceStats(params: {
    soCenterId: string;
    month: string;
    classId?: string;
  }): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalHolidays: number;
    classWiseStats: Array<{
      className: string;
      present: number;
      absent: number;
      total: number;
      percentage: number;
    }>;
  }> {
    const startDate = `${params.month}-01`;
    // Calculate the last day of the month to avoid invalid dates like 2025-09-31
    const year = parseInt(params.month.split('-')[0]);
    const month = parseInt(params.month.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate(); // month is 1-indexed, so this gets last day of the month
    const endDate = `${params.month}-${lastDay.toString().padStart(2, '0')}`;

    // Base query conditions
    let whereConditions = [
      eq(schema.attendance.soCenterId, params.soCenterId),
      gte(schema.attendance.date, startDate),
      lte(schema.attendance.date, endDate)
    ];

    if (params.classId) {
      whereConditions.push(eq(schema.attendance.classId, params.classId));
    }

    // Get overall stats
    const stats = await db.select({
      status: schema.attendance.status,
      count: sqlQuery<number>`count(*)`.as('count')
    })
    .from(schema.attendance)
    .where(and(...whereConditions))
    .groupBy(schema.attendance.status);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHolidays = 0;

    stats.forEach(stat => {
      const count = Number(stat.count);
      switch (stat.status) {
        case 'present':
          totalPresent = count;
          break;
        case 'absent':
          totalAbsent = count;
          break;
        case 'holiday':
          totalHolidays = count;
          break;
      }
    });

    // Get class-wise stats
    const classStats = await db.select({
      className: schema.classes.name,
      status: schema.attendance.status,
      count: sqlQuery<number>`count(*)`.as('count')
    })
    .from(schema.attendance)
    .innerJoin(schema.classes, eq(schema.attendance.classId, schema.classes.id))
    .where(and(...whereConditions))
    .groupBy(schema.classes.name, schema.attendance.status);

    // Process class-wise data
    const classWiseMap: Record<string, { present: number; absent: number; holiday: number }> = {};
    
    classStats.forEach(stat => {
      if (!classWiseMap[stat.className]) {
        classWiseMap[stat.className] = { present: 0, absent: 0, holiday: 0 };
      }
      const count = Number(stat.count);
      switch (stat.status) {
        case 'present':
          classWiseMap[stat.className].present = count;
          break;
        case 'absent':
          classWiseMap[stat.className].absent = count;
          break;
        case 'holiday':
          classWiseMap[stat.className].holiday = count;
          break;
      }
    });

    const classWiseStats = Object.entries(classWiseMap).map(([className, data]) => {
      const total = data.present + data.absent; // Exclude holidays from percentage calculation
      const percentage = total > 0 ? (data.present / total) * 100 : 0;
      
      return {
        className,
        present: data.present,
        absent: data.absent,
        total,
        percentage
      };
    });

    return {
      totalPresent,
      totalAbsent,
      totalHolidays,
      classWiseStats
    };
  }

  async getStudentAttendanceReport(studentId: string, month: string): Promise<{
    studentId: string;
    studentName: string;
    attendanceRecords: Array<{
      date: string;
      status: 'present' | 'absent' | 'holiday';
    }>;
    attendancePercentage: number;
    totalPresent: number;
    totalAbsent: number;
    totalDays: number;
  }> {
    const startDate = `${month}-01`;
    // Calculate the last day of the month to avoid invalid dates like 2025-09-31
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const lastDay = new Date(year, monthNum, 0).getDate(); // monthNum is 1-indexed, so this gets last day of the month
    const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

    // Get student details
    const student = await db.select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);

    if (!student[0]) {
      throw new Error('Student not found');
    }

    // Get attendance records
    const attendanceRecords = await db.select({
      date: schema.attendance.date,
      status: schema.attendance.status
    })
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.studentId, studentId),
        gte(schema.attendance.date, startDate),
        lte(schema.attendance.date, endDate)
      )
    )
    .orderBy(asc(schema.attendance.date));

    // Calculate statistics
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHolidays = 0;

    attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'present':
          totalPresent++;
          break;
        case 'absent':
          totalAbsent++;
          break;
        case 'holiday':
          totalHolidays++;
          break;
      }
    });

    const totalDays = totalPresent + totalAbsent; // Exclude holidays from calculation
    const attendancePercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

    return {
      studentId: student[0].id,
      studentName: student[0].name,
      attendanceRecords: attendanceRecords.map(record => ({
        date: record.date,
        status: record.status as 'present' | 'absent' | 'holiday'
      })),
      attendancePercentage,
      totalPresent,
      totalAbsent,
      totalDays
    };
  }

  async getMonthlyAttendanceReport(params: {
    soCenterId: string;
    month: string;
    classId: string;
  }): Promise<{
    students: Array<{
      id: string;
      name: string;
      studentId: string;
      attendanceRecords: Array<{
        date: string;
        status: 'present' | 'absent' | 'holiday';
      }>;
    }>;
  }> {
    console.log('📊 Monthly Report Request:', params);
    
    const startDate = `${params.month}-01`;
    // Calculate the last day of the month to avoid invalid dates like 2025-09-31
    const year = parseInt(params.month.split('-')[0]);
    const month = parseInt(params.month.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${params.month}-${lastDay.toString().padStart(2, '0')}`;

    console.log('📅 Date Range:', { startDate, endDate });

    // Get all students in the class
    const students = await db.select({
      id: schema.students.id,
      name: schema.students.name,
      studentId: schema.students.studentId
    })
    .from(schema.students)
    .where(
      and(
        eq(schema.students.soCenterId, params.soCenterId),
        eq(schema.students.classId, params.classId)
      )
    );

    console.log('👨‍🎓 Found Students:', students.length, students.map(s => ({ name: s.name, id: s.id })));

    // Get all attendance records for the month and class
    const attendanceRecords = await db.select({
      studentId: schema.attendance.studentId,
      date: schema.attendance.date,
      status: schema.attendance.status
    })
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.soCenterId, params.soCenterId),
        eq(schema.attendance.classId, params.classId),
        gte(schema.attendance.date, startDate),
        lte(schema.attendance.date, endDate)
      )
    )
    .orderBy(asc(schema.attendance.date));

    console.log('📋 Found Attendance Records:', attendanceRecords.length);

    // Organize attendance records by student
    const studentsWithAttendance = students.map(student => {
      const studentAttendanceRecords = attendanceRecords
        .filter(record => record.studentId === student.id)
        .map(record => ({
          date: record.date,
          status: record.status as 'present' | 'absent' | 'holiday'
        }));

      return {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        attendanceRecords: studentAttendanceRecords
      };
    });

    console.log('✅ Returning Monthly Report:', { studentCount: studentsWithAttendance.length });
    
    return {
      students: studentsWithAttendance
    };
  }

  // Homework Activity methods
  async createHomeworkActivity(activities: InsertHomeworkActivity[]): Promise<HomeworkActivity[]> {
    const results = [];
    for (const activity of activities) {
      const [result] = await db.insert(schema.homeworkActivities)
        .values(activity)
        .onConflictDoUpdate({
          target: [schema.homeworkActivities.studentId, schema.homeworkActivities.homeworkDate],
          set: {
            status: activity.status,
            completionType: activity.completionType,
            reason: activity.reason,
            updatedAt: new Date(),
          },
        })
        .returning();
      results.push(result);
    }
    return results;
  }

  async getHomeworkActivities(params: {
    classId?: string;
    date?: string;
    soCenterId?: string;
  }): Promise<HomeworkActivity[]> {
    let query = db.select().from(schema.homeworkActivities);

    const conditions = [];
    if (params.classId) {
      conditions.push(eq(schema.homeworkActivities.classId, params.classId));
    }
    if (params.date) {
      conditions.push(eq(schema.homeworkActivities.homeworkDate, params.date));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  // Tuition Progress methods
  async createTuitionProgress(progress: InsertTuitionProgress): Promise<TuitionProgress> {
    // Use proper UPSERT with onConflictDoUpdate for atomic operation
    const [result] = await db.insert(schema.tuitionProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [schema.tuitionProgress.studentId, schema.tuitionProgress.topicId],
        set: {
          status: progress.status,
          updatedBy: progress.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getTuitionProgress(params: {
    classId?: string;
    topicId?: string;
    studentId?: string;
    soCenterId?: string;
  }): Promise<TuitionProgress[]> {
    let query = db.select().from(schema.tuitionProgress);

    const conditions = [];
    if (params.topicId) {
      conditions.push(eq(schema.tuitionProgress.topicId, params.topicId));
    }
    if (params.studentId) {
      conditions.push(eq(schema.tuitionProgress.studentId, params.studentId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;
    console.log('getTuitionProgress query params:', params);
    console.log('getTuitionProgress result:', result);
    return result;
  }

  async updateTuitionProgress(id: string, updates: Partial<InsertTuitionProgress>): Promise<TuitionProgress> {
    const [result] = await db.update(schema.tuitionProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.tuitionProgress.id, id))
      .returning();
    return result;
  }
}

export const storage = new DrizzleStorage();
