import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, asc, sql as sqlQuery, sql, inArray, gte, lte, like, notInArray, isNotNull } from "drizzle-orm";
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
  Product,
  InsertProduct,
  ProductOrder,
  InsertProductOrder,
  CommissionWallet,
  InsertCommissionWallet,
  CommissionTransaction,
  InsertCommissionTransaction,
  WithdrawalRequest,
  InsertWithdrawalRequest,
  SystemSetting,
  InsertSystemSetting,
  HomeworkActivity,
  InsertHomeworkActivity,
  TuitionProgress,
  InsertTuitionProgress,
} from "@shared/schema";

// MANDATORY SUPABASE DATABASE CONNECTION - NEON COMPLETELY DISABLED  
if (!process.env.SUPABASE_DATABASE_URL) {
  throw new Error("SUPABASE_DATABASE_URL environment variable is required - Neon database disabled");
}

console.log('🔗 STORAGE: Using SUPABASE_DATABASE_URL exclusively');
const sql = postgres(process.env.SUPABASE_DATABASE_URL!, { 
  max: 5,
  idle_timeout: 20,
  connect_timeout: 30,
  statement_timeout: 30000, // 30 seconds
  query_timeout: 30000, // 30 seconds  
  connection: {
    options: '--statement_timeout=30s'
  }
});
export const db = drizzle(sql, { schema });

// Add method to get users by role
async function getUsersByRole(role: string) {
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.role, role as any));
    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
}

// Add method to execute raw queries
async function executeRawQuery(query: string, params: any[] = []) {
  try {
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }
}

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

// Initialize database on startup - DISABLED temporarily to fix login timeout
// initializeDatabase();

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
  getChaptersBySubjectAndClass(subjectId: string, classId: string): Promise<Chapter[]>;
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
    recordedBy: string; // Added parameter
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
  deleteState(id: string): Promise<void>;
  deleteDistrict(id: string): Promise<void>;
  deleteMandal(id: string): Promise<void>;
  deleteVillage(id: string): Promise<void>;
  getStudentsByVillage(villageId: string): Promise<Student[]>;
  getSoCentersByVillage(villageId: string): Promise<SoCenter[]>;

  // Products methods (for commission calculation)
  getAllProducts(): Promise<any[]>;
  createProduct(data: any): Promise<any>;

  // Enhanced SO Center methods
  getNextSoCenterId(): Promise<string>;
  getSoCenterByCenterId(centerId: string): Promise<SoCenter | undefined>;
  getAvailableManagers(): Promise<User[]>;
  getUnassignedManagers(): Promise<User[]>;
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
    console.log(`🔍 Storage: Starting getUserByEmail lookup for: ${email}`);
    try {
      // Add timeout to prevent hanging
      const queryPromise = db.select().from(schema.users).where(eq(schema.users.email, email));
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getUserByEmail query timeout')), 5000);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log(`🔍 Storage: Database query completed, found ${result.length} user(s)`);
      return result[0];
    } catch (error) {
      console.error(`❌ Storage: Error in getUserByEmail:`, error);

      // Try a simpler query as fallback
      try {
        console.log(`🔄 Storage: Attempting fallback query...`);
        const fallbackResult = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
        console.log(`✅ Storage: Fallback query completed, found ${fallbackResult.length} user(s)`);
        return fallbackResult[0] as User;
      } catch (fallbackError) {
        console.error(`❌ Storage: Fallback query also failed:`, fallbackError);
        throw error;
      }
    }
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
        ownerFatherName: schema.soCenters.ownerFatherName,
        ownerMotherName: schema.soCenters.ownerMotherName,
        ownerPhone: schema.soCenters.ownerPhone,
        landmarks: schema.soCenters.landmarks,
        roomSize: schema.soCenters.roomSize,
        rentAmount: schema.soCenters.rentAmount,
        rentalAdvance: schema.soCenters.rentalAdvance,
        dateOfHouseTaken: schema.soCenters.dateOfHouseTaken,
        monthlyRentDate: schema.soCenters.monthlyRentDate,
        electricBillAccountNumber: schema.soCenters.electricBillAccountNumber,
        internetBillAccountNumber: schema.soCenters.internetBillAccountNumber,
        capacity: schema.soCenters.capacity,
        facilities: schema.soCenters.facilities,
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

  async updateSoCenter(centerId: string, updateData: any): Promise<any> {
    try {
      console.log('🔄 Storage: Updating SO Center with ID:', centerId);

      // Convert string numbers to proper types where needed
      if (updateData.capacity) {
        updateData.capacity = parseInt(updateData.capacity);
      }
      if (updateData.monthlyRentDate) {
        updateData.monthlyRentDate = parseInt(updateData.monthlyRentDate);
      }

      const [updatedCenter] = await db
        .update(schema.soCenters)
        .set(updateData)
        .where(eq(schema.soCenters.id, centerId))
        .returning();

      if (!updatedCenter) {
        throw new Error('SO Center not found or update failed');
      }

      console.log('✅ Storage: SO Center updated successfully:', updatedCenter.id);
      return updatedCenter;
    } catch (error) {
      console.error('❌ Storage: Failed to update SO Center:', error);
      throw error;
    }
  }

  // SO Center Equipment Management
  async createSoCenterEquipment(soCenterId: string, equipment: any[]): Promise<void> {
    if (equipment && equipment.length > 0) {
      const equipmentData = equipment.map(item => ({
        soCenterId,
        itemName: item.itemName,
        serialNumber: item.serialNumber,
        warrantyYears: parseInt(item.warrantyYears),
        purchaseDate: item.purchaseDate,
        warrantyEndDate: this.calculateWarrantyEndDate(item.purchaseDate, parseInt(item.warrantyYears)),
        brandName: item.brandName,
      }));

      await db.insert(schema.soCenterEquipment).values(equipmentData);
    }
  }

  async getSoCenterEquipment(soCenterId: string) {
    return await db.select()
      .from(schema.soCenterEquipment)
      .where(and(
        eq(schema.soCenterEquipment.soCenterId, soCenterId),
        eq(schema.soCenterEquipment.isActive, true)
      ))
      .orderBy(asc(schema.soCenterEquipment.createdAt));
  }

  async updateSoCenterEquipment(equipmentId: string, data: any) {
    if (data.purchaseDate && data.warrantyYears) {
      data.warrantyEndDate = this.calculateWarrantyEndDate(data.purchaseDate, parseInt(data.warrantyYears));
    }

    return await db.update(schema.soCenterEquipment)
      .set(data)
      .where(eq(schema.soCenterEquipment.id, equipmentId))
      .returning();
  }

  async deleteSoCenterEquipment(equipmentId: string): Promise<void> {
    await db.update(schema.soCenterEquipment)
      .set({ isActive: false })
      .where(eq(schema.soCenterEquipment.id, equipmentId));
  }

  private calculateWarrantyEndDate(purchaseDate: string, warrantyYears: number): string {
    const purchase = new Date(purchaseDate);
    const warrantyEnd = new Date(purchase);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + warrantyYears);

    // Format as DD/MM/YYYY as required
    const day = warrantyEnd.getDate().toString().padStart(2, '0');
    const month = (warrantyEnd.getMonth() + 1).toString().padStart(2, '0');
    const year = warrantyEnd.getFullYear();

    return `${day}/${month}/${year}`;
  }

  async createSoCenter(center: InsertSoCenter, nearbySchools?: any[], nearbyTuitions?: any[], equipment?: any[]): Promise<SoCenter> {
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

      // Create nearby schools if provided
      if (nearbySchools && nearbySchools.length > 0) {
        const schoolsData = nearbySchools.map(school => ({
          soCenterId: newCenter.id,
          schoolName: school.schoolName,
          studentStrength: parseInt(school.studentStrength) || 0,
          schoolType: school.schoolType
        }));
        await tx.insert(schema.nearbySchools).values(schoolsData);
        console.log('✅ Nearby schools created');
      }

      // Create nearby tuitions if provided
      if (nearbyTuitions && nearbyTuitions.length > 0) {
        const tuitionsData = nearbyTuitions.map(tuition => ({
          soCenterId: newCenter.id,
          tuitionName: tuition.tuitionName,
          studentStrength: parseInt(tuition.studentStrength) || 0
        }));
        await tx.insert(schema.nearbyTuitions).values(tuitionsData);
        console.log('✅ Nearby tuitions created');
      }

      // Create equipment if provided
      if (equipment && equipment.length > 0) {
        const equipmentData = equipment.map(item => ({
          soCenterId: newCenter.id,
          itemName: item.itemName,
          serialNumber: item.serialNumber,
          warrantyYears: parseInt(item.warrantyYears),
          purchaseDate: item.purchaseDate,
          warrantyEndDate: this.calculateWarrantyEndDate(item.purchaseDate, parseInt(item.warrantyYears)),
          brandName: item.brandName,
        }));
        await tx.insert(schema.soCenterEquipment).values(equipmentData);
        console.log('✅ Equipment inventory created');
      }

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

  async getChaptersBySubjectAndClass(subjectId: string, classId: string): Promise<Chapter[]> {
    return await db.select().from(schema.chapters)
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .where(and(
        eq(schema.chapters.subjectId, subjectId),
        eq(schema.subjects.classId, classId),
        eq(schema.chapters.isActive, true)
      ))
      .then(results => results.map(result => result.chapters));
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
    try {
      console.log('🔍 Storage: Fetching students for SO Center:', soCenterId);

      // Use a simpler approach with raw SQL to avoid Drizzle ordering issues
      const students = await sql`
        SELECT 
          s.id,
          s.name,
          s.student_id as "studentId",
          s.email,
          s.phone,
          s.date_of_birth as "dateOfBirth",
          s.father_name as "fatherName",
          s.mother_name as "motherName",
          s.father_mobile as "fatherMobile",
          s.mother_mobile as "motherMobile",
          s.address,
          s.enrollment_date as "enrollmentDate",
          s.course_type as "courseType",
          s.class_id as "classId",
          c.name as "className",
          s.so_center_id as "soCenterId",
          s.village_id as "villageId",
          s.is_active as "isActive",
          s.total_fee_amount as "totalFeeAmount",
          s.paid_amount as "paidAmount",
          s.pending_amount as "pendingAmount",
          s.created_at as "createdAt",
          s.updated_at as "updatedAt"
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.so_center_id = ${soCenterId}
          AND s.is_active = true
        ORDER BY s.created_at DESC
      `;

      console.log('✅ Storage: Found', students.length, 'students for SO Center');

      // Ensure we always return an array
      return Array.isArray(students) ? students : [];
    } catch (error) {
      console.error('❌ Storage: Error fetching students by SO Center:', error);
      // Return empty array on error instead of throwing
      return [];
    }
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

  async getAllStudentsWithDetails(): Promise<any[]> {
    try {
      console.log('🔍 Storage: Fetching all students with comprehensive details...');

      // Main students query with joins for comprehensive data
      const students = await db
        .select({
          // Student basic info
          id: schema.students.id,
          studentId: schema.students.studentId,
          name: schema.students.name,
          dateOfBirth: schema.students.dateOfBirth,
          gender: schema.students.gender,
          aadharNumber: schema.students.aadharNumber,
          enrollmentDate: schema.students.enrollmentDate,
          courseType: schema.students.courseType,
          address: schema.students.address,
          isActive: schema.students.isActive,
          createdAt: schema.students.createdAt,

          // Parent information
          fatherName: schema.students.fatherName,
          fatherMobile: schema.students.fatherMobile,
          fatherOccupation: schema.students.fatherOccupation,
          motherName: schema.students.motherName,
          motherMobile: schema.students.motherMobile,
          motherOccupation: schema.students.motherOccupation,

          // Fee information
          totalFeeAmount: schema.students.totalFeeAmount,
          paidAmount: schema.students.paidAmount,
          pendingAmount: schema.students.pendingAmount,

          // Foreign keys
          classId: schema.students.classId,
          soCenterId: schema.students.soCenterId,
          villageId: schema.students.villageId,

          // Joined data
          className: schema.classes.name,
          soCenterName: schema.soCenters.name,
          soCenterCenterId: schema.soCenters.centerId,
          villageName: schema.villages.name,
          mandalName: schema.mandals.name,
          districtName: schema.districts.name,
          stateName: schema.states.name,
        })
        .from(schema.students)
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .leftJoin(schema.soCenters, eq(schema.students.soCenterId, schema.soCenters.id))
        .leftJoin(schema.villages, eq(schema.students.villageId, schema.villages.id))
        .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
        .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
        .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
        .where(eq(schema.students.isActive, true))
        .orderBy(desc(schema.students.createdAt));

      // Get siblings for each student
      const studentIds = students.map(s => s.id);
      const siblings = studentIds.length > 0 ? await db
        .select()
        .from(schema.siblings)
        .where(inArray(schema.siblings.studentId, studentIds)) : [];

      // Combine student data with siblings
      const studentsWithDetails = students.map(student => {
        const studentSiblings = siblings.filter(s => s.studentId === student.id);

        return {
          ...student,
          paymentStatus: parseFloat(student.pendingAmount || '0') <= 0 ? 'paid' : 'pending',
          progress: 0, // Initial progress
          siblings: studentSiblings,
        };
      });

      console.log('✅ Storage: Retrieved', studentsWithDetails.length, 'students with comprehensive details');
      return studentsWithDetails;
    } catch (error) {
      console.error('❌ Storage: Failed to fetch students with details:', error);
      throw error;
    }
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
    // Use the postgres client directly since the schema doesn't match the actual database
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Use the underlying postgres client for raw SQL
      const result = await sql`
        INSERT INTO wallet_transactions (user_id, transaction_id, type, amount, description, status, created_at)
        VALUES (${transaction.soCenterId}, ${transactionId}, ${transaction.type}, ${transaction.amount}, ${transaction.description}, 'completed', NOW())
        RETURNING *
      `;

      return result[0] as WalletTransaction;
    } catch (error) {
      console.error('Error creating wallet transaction:', error);
      throw new Error('Failed to create wallet transaction');
    }
  }

  async getWalletTransactions(soCenterId: string): Promise<WalletTransaction[]> {
    // Use raw SQL since the schema doesn't match the actual database structure
    try {
      const result = await sql`
        SELECT * FROM wallet_transactions 
        WHERE user_id = ${soCenterId}
        ORDER BY created_at DESC
      `;

      return result as WalletTransaction[];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
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
    recordedBy: string; // Added parameter
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
    const { studentId, amount, feeType, receiptNumber, expectedFeeAmount, recordedBy } = paymentData;
    const transactionId = `TXN-${Date.now()}-${studentId.slice(0, 8)}`;

    return await db.transaction(async (tx) => {
      // Get student to find SO Center
      const [student] = await tx.select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId));

      if (!student) {
        throw new Error('Student not found');
      }

      // Create payment record with proper invoice data
      const currentDate = new Date();
      const paymentRecord = await this.createPayment({
        studentId,
        amount: amount.toString(),
        paymentMethod: 'cash',
        description: `${feeType} fee payment - Receipt: ${receiptNumber}`,
        receiptNumber,
        recordedBy: recordedBy, // Use the authenticated user ID
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        transactionId: transactionId
      });

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

      // Create wallet transaction record using correct column name
      await this.createWalletTransaction({
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
        payment: paymentRecord,
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

  async deleteState(id: string): Promise<void> {
    await db.delete(schema.states).where(eq(schema.states.id, id));
  }

  async deleteDistrict(id: string): Promise<void> {
    await db.delete(schema.districts).where(eq(schema.districts.id, id));
  }

  async deleteMandal(id: string): Promise<void> {
    await db.delete(schema.mandals).where(eq(schema.mandals.id, id));
  }

  async deleteVillage(id: string): Promise<void> {
    await db.delete(schema.villages).where(eq(schema.villages.id, id));
  }

  async getStudentsByVillage(villageId: string): Promise<Student[]> {
    const result = await db.select().from(schema.students).where(eq(schema.students.villageId, villageId));
    return result;
  }

  async getSoCentersByVillage(villageId: string): Promise<SoCenter[]> {
    const result = await db.select().from(schema.soCenters).where(eq(schema.soCenters.villageId, villageId));
    return result;
  }

  // Products methods (for commission calculation)
  async getAllProducts(): Promise<any[]> {
    return await db.select().from(schema.products).where(eq(schema.products.isActive, true)).orderBy(asc(schema.products.name));
  }

  async createProduct(data: any): Promise<any> {
    const result = await db.insert(schema.products).values(data).returning();
    return result[0];
  }

  // Enhanced SO Center methods with sequential number gap detection
  async getNextAvailableSoCenterNumber(): Promise<{ centerId: string; email: string }> {
    // Get all existing center IDs and emails
    const centers = await db.select({
      centerId: schema.soCenters.centerId
    }).from(schema.soCenters);

    const users = await db.select({
      email: schema.users.email
    }).from(schema.users).where(like(schema.users.email, 'nnasoc%@navanidhi.org'));

    console.log('Existing center IDs:', centers.map(c => c.centerId));
    console.log('Existing SO Center emails:', users.map(u => u.email));

    // Extract numeric parts from both center IDs and emails
    const existingNumbers = new Set<number>();

    // From center IDs
    centers.forEach(center => {
      if (center.centerId) {
        const match = center.centerId.match(/NNASOC(\d+)/);
        if (match) {
          existingNumbers.add(parseInt(match[1], 10));
        }
      }
    });

    // From emails
    users.forEach(user => {
      if (user.email) {
        const match = user.email.match(/nnasoc(\d+)@navanidhi\.org/);
        if (match) {
          existingNumbers.add(parseInt(match[1], 10));
        }
      }
    });

    console.log('Existing SO Center numbers:', Array.from(existingNumbers).sort((a, b) => a - b));

    // Find the first available number starting from 1
    let nextNumber = 1;
    while (existingNumbers.has(nextNumber)) {
      nextNumber++;
    }

    const centerId = `NNASOC${String(nextNumber).padStart(5, '0')}`;
    const email = `nnasoc${String(nextNumber).padStart(5, '0')}@navanidhi.org`;

    console.log(`Next available SO Center number: ${nextNumber}`);
    console.log(`Generated center ID: ${centerId}`);
    console.log(`Generated email: ${email}`);

    return { centerId, email };
  }

  async getNextSoCenterId(): Promise<string> {
    const result = this.getNextAvailableSoCenterNumber();
    return result.centerId;
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

  async getSoCenterByEmail(email: string): Promise<SoCenter | undefined> {
    try {
      console.log('🔍 Storage: Starting getSoCenterByEmail lookup for:', email);

      // Use raw SQL to avoid potential Drizzle recursion issues
      const result = await sql`
        SELECT * FROM so_centers 
        WHERE email = ${email} 
        OR center_id = ${email.split('@')[0].toUpperCase()}
        LIMIT 1
      `;

      if (result.length > 0) {
        console.log('✅ Found SO Center:', result[0].center_id, '-', result[0].name);
        return {
          id: result[0].id,
          centerId: result[0].center_id,
          name: result[0].name,
          email: result[0].email,
          phone: result[0].phone,
          address: result[0].address,
          walletBalance: result[0].wallet_balance,
          isActive: result[0].is_active,
          createdAt: result[0].created_at,
          villageId: result[0].village_id
        };
      }

      console.log('❌ No SO Center found for email:', email);
      return null;
    } catch (error) {
      console.error('❌ Error in getSoCenterByEmail:', error);
      return null;
    }
  }

  async getSoCenterDashboardStats(soCenterId: string): Promise<any> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get students count for this SO Center this month
    const newStudentsThisMonth = await db.select({ count: sql`count(*)::integer` })
      .from(schema.students)
      .where(
        and(
          eq(schema.students.soCenterId, soCenterId),
          gte(schema.students.createdAt, thisMonth)
        )
      );

    // Get payments for this month and today
    const paymentsQuery = await db.select({
      amount: schema.payments.amount,
      date: schema.payments.createdAt
    }).from(schema.payments)
      .innerJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
      .where(
        and(
          eq(schema.students.soCenterId, soCenterId),
          gte(schema.payments.createdAt, thisMonth)
        )
      );

    const thisMonthCollection = paymentsQuery.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const todayCollection = paymentsQuery
      .filter(p => new Date(p.date).toDateString() === today.toDateString())
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Get today's attendance percentage
    const todayAttendanceQuery = await db.select({
      present: sql`count(case when status = 'present' then 1 end)::integer`,
      total: sql`count(*)::integer`
    }).from(schema.attendance)
      .innerJoin(schema.students, eq(schema.attendance.studentId, schema.students.id))
      .where(
        and(
          eq(schema.students.soCenterId, soCenterId),
          eq(schema.attendance.date, today.toISOString().split('T')[0])
        )
      );

    const attendanceData = todayAttendanceQuery[0];
    const todayAttendance = attendanceData?.total > 0 
      ? Math.round((attendanceData.present / attendanceData.total) * 100) 
      : 0;

    // Get product sales for this month
    const productSalesQuery = await db.select({
      amount: schema.productOrders.amount
    }).from(schema.productOrders)
      .where(
        and(
          eq(schema.productOrders.soCenterId, soCenterId),
          gte(schema.productOrders.createdAt, thisMonth)
        )
      );

    const thisMonthProductSales = productSalesQuery.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Generate sample chart data
    const collectionChart = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      collection: Math.floor(Math.random() * 5000) + 1000
    }));

    const attendanceChart = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      attendance: Math.floor(Math.random() * 30) + 70
    }));

    const productSalesChart = [
      { product: 'Books', sales: Math.floor(Math.random() * 15000) + 5000 },
      { product: 'Stationery', sales: Math.floor(Math.random() * 8000) + 2000 },
      { product: 'Digital', sales: Math.floor(Math.random() * 12000) + 3000 },
      { product: 'Exam Prep', sales: Math.floor(Math.random() * 20000) + 8000 }
    ];

    return {
      newStudentsThisMonth: parseInt(newStudentsThisMonth[0]?.count) || 0,
      thisMonthCollection,
      todayCollection,
      todayAttendance,
      thisMonthProductSales,
      collectionChart,
      attendanceChart,
      productSalesChart
    };
  }

  async getUnassignedManagers(): Promise<User[]> {
    try {
      // Since SO Centers don't have userId field anymore (they use separate auth),
      // return all so_center role users who don't have corresponding SO center records
      const users = await db.select().from(schema.users).where(
        and(
          eq(schema.users.isActive, true),
          eq(schema.users.role, 'so_center')
        )
      ).orderBy(asc(schema.users.name));

      return users;
    } catch (error) {
      console.error('Error in getUnassignedManagers:', error);
      return [];
    }
  }

  async updateSoCenter(id: string, updates: Partial<InsertSoCenter>): Promise<SoCenter> {
    const result = await db.update(schema.soCenters)
      .set(updates)
      .where(eq(schema.soCenters.id, id))
      .returning();
    return result[0];
  }

  async updateSoCenterByUserId(userId: string, updates: Partial<InsertSoCenter>): Promise<SoCenter> {
    const result = await db.update(schema.soCenters)
      .set(updates)
      .where(eq(schema.soCenters.userId, userId))
      .returning();
    return result[0];
  }

  async deleteSoCenter(id: string): Promise<void> {
    await db.update(schema.soCenters)
      .set({ isActive: false })
      .where(eq(schema.soCenters.id, id));
  }

  async deleteSoCenterByUserId(userId: string): Promise<void> {
    await db.update(schema.soCenters)
      .set({ isActive: false })
      .where(eq(schema.soCenters.userId, userId));
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

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(and(
        eq(schema.users.role, role as any),
        eq(schema.users.isActive, true)
      ))
      .orderBy(asc(schema.users.name));
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
    console.log('🔍 CRITICAL: Checking Aadhar number globally across entire database:', aadharNumber);

    // Check ENTIRE database for existing Aadhar number - NOT just SO Center specific
    const existing = await db.select()
      .from(schema.students)
      .where(eq(schema.students.aadharNumber, aadharNumber))
      .limit(1);

    const isUnique = existing.length === 0;

    if (existing.length > 0) {
      console.log('❌ DUPLICATE AADHAR FOUND: Aadhar number', aadharNumber, 'already exists for student:', existing[0].name, 'ID:', existing[0].studentId);
    } else {
      console.log('✅ AADHAR UNIQUE: Aadhar number', aadharNumber, 'is available globally');
    }

    return isUnique; // Returns true if Aadhar is unique across entire database
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
    // First try to get the exact match with courseType
    let result = await db.select()
      .from(schema.classFees)
      .where(and(
        eq(schema.classFees.classId, classId),
        eq(schema.classFees.courseType, courseType as any),
        eq(schema.classFees.isActive, true)
      ))
      .limit(1);

    // If no exact match found, get any fee record for this class and return the appropriate fee
    if (result.length === 0) {
      console.log(`🔍 No exact match for classId: ${classId}, courseType: ${courseType}. Trying flexible approach...`);
      result = await db.select()
        .from(schema.classFees)
        .where(and(
          eq(schema.classFees.classId, classId),
          eq(schema.classFees.isActive, true)
        ))
        .limit(1);

      if (result.length > 0) {
        console.log(`✅ Found flexible fee record for class ${classId}`);
        const feeRecord = result[0];

        // Check if the requested fee type exists in the record
        if (courseType === 'yearly' && !feeRecord.yearlyFee) {
          console.log(`⚠️ No yearly fee available for class ${classId}`);
          return undefined;
        }
        if (courseType === 'monthly' && !feeRecord.monthlyFee) {
          console.log(`⚠️ No monthly fee available for class ${classId}`);
          return undefined;
        }
      }
    }

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
            markedBy: record.markedBy,
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

  // Advanced Fee Management System
  async calculateMonthlyFee(studentId: string, enrollmentDate: Date, classId: string): Promise<{ amount: number; reason: string }> {
    console.log('🧮 Calculating monthly fee for student:', studentId, 'enrollment:', enrollmentDate);

    // Get the class fee structure
    const classFee = await db.select()
      .from(schema.classFees)
      .where(eq(schema.classFees.classId, classId))
      .limit(1);

    if (!classFee[0]) {
      throw new Error('Class fee structure not found');
    }

    const monthlyFee = parseFloat(classFee[0].monthlyFee || '0');
    const enrollmentDay = enrollmentDate.getDate();

    let feeAmount = 0;
    let reason = '';

    if (enrollmentDay >= 1 && enrollmentDay <= 10) {
      feeAmount = monthlyFee;
      reason = `Full monthly fee - enrolled on ${enrollmentDay}th (1st-10th: full fee)`;
    } else if (enrollmentDay >= 11 && enrollmentDay <= 20) {
      feeAmount = monthlyFee / 2;
      reason = `Half monthly fee - enrolled on ${enrollmentDay}th (11th-20th: half fee)`;
    } else {
      feeAmount = 0;
      reason = `No fee for first month - enrolled on ${enrollmentDay}th (21st+: no first month fee)`;
    }

    console.log('💰 Calculated fee:', feeAmount, 'Reason:', reason);
    return { amount: feeAmount, reason };
  }

  async createFeeCalculationHistory(studentId: string, calculationData: any): Promise<any> {
    console.log('📊 Creating fee calculation history for student:', studentId);

    const historyRecord = {
      studentId,
      calculationDate: new Date(),
      monthYear: calculationData.monthYear,
      calculationType: calculationData.calculationType,
      feeAmount: calculationData.feeAmount,
      enrollmentDay: calculationData.enrollmentDay,
      reason: calculationData.reason,
    };

    const result = await db.insert(schema.feeCalculationHistory).values(historyRecord).returning();
    console.log('✅ Fee calculation history created');
    return result[0];
  }

  async scheduleMonthlyFees(studentId: string, enrollmentDate: Date, classId: string): Promise<void> {
    console.log('📅 Scheduling monthly fees for student:', studentId);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Schedule fees for the next 12 months starting from enrollment month
    for (let i = 0; i < 12; i++) {
      const scheduleDate = new Date(currentYear, currentMonth + i, 1);
      const monthYear = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}`;

      // Calculate fee for this month
      const isFirstMonth = i === 0;
      let feeCalculation;

      if (isFirstMonth) {
        // Use enrollment-based calculation for first month
        feeCalculation = await this.calculateMonthlyFee(studentId, enrollmentDate, classId);
      } else {
        // Full fee for subsequent months
        const classFee = await db.select()
          .from(schema.classFees)
          .where(eq(schema.classFees.classId, classId))
          .limit(1);

        feeCalculation = {
          amount: parseFloat(classFee[0]?.monthlyFee || '0'),
          reason: 'Regular monthly fee'
        };
      }

      // Check if schedule already exists
      const existingSchedule = await db.select()
        .from(schema.monthlyFeeSchedule)
        .where(and(
          eq(schema.monthlyFeeSchedule.studentId, studentId),
          eq(schema.monthlyFeeSchedule.monthYear, monthYear)
        ))
        .limit(1);

      if (!existingSchedule[0]) {
        await db.insert(schema.monthlyFeeSchedule).values({
          studentId,
          monthYear,
          scheduledDate: scheduleDate,
          feeAmount: feeCalculation.amount,
          isProcessed: false,
        });

        // Create fee calculation history
        await this.createFeeCalculationHistory(studentId, {
          monthYear,
          calculationType: isFirstMonth ? 'enrollment_based' : 'regular_monthly',
          feeAmount: feeCalculation.amount,
          enrollmentDay: isFirstMonth ? enrollmentDate.getDate() : null,
          reason: feeCalculation.reason,
        });
      }
    }

    console.log('✅ Monthly fees scheduled for next 12 months');
  }

  async updateStudentBalances(studentId: string): Promise<void> {
    console.log('🔄 Updating student balances for:', studentId);

    // Get all scheduled fees for this student
    const scheduledFees = await db.select()
      .from(schema.monthlyFeeSchedule)
      .where(eq(schema.monthlyFeeSchedule.studentId, studentId));

    // Get all payments for this student
    const payments = await db.select()
      .from(schema.payments)
      .where(eq(schema.payments.studentId, studentId));

    // Calculate total fees due
    const totalScheduledAmount = scheduledFees.reduce((sum, fee) => sum + parseFloat(String(fee.feeAmount)), 0);

    // Calculate total paid
    const totalPaidAmount = payments.reduce((sum, payment) => sum + parseFloat(String(payment.amount)), 0);

    // Calculate pending amount
    const pendingAmount = Math.max(0, totalScheduledAmount - totalPaidAmount);

    // Update student record
    await db.update(schema.students)
      .set({
        totalFeeAmount: String(totalScheduledAmount),
        paidAmount: String(totalPaidAmount),
        pendingAmount: String(pendingAmount),
        paymentStatus: pendingAmount > 0 ? 'pending' : 'paid'
      })
      .where(eq(schema.students.id, studentId));

    console.log('✅ Student balances updated - Total:', totalScheduledAmount, 'Paid:', totalPaidAmount, 'Pending:', pendingAmount);
  }

  async getStudentFeeSchedule(studentId: string): Promise<any[]> {
    return await db.select()
      .from(schema.monthlyFeeSchedule)
      .where(eq(schema.monthlyFeeSchedule.studentId, studentId))
      .orderBy(asc(schema.monthlyFeeSchedule.scheduledDate));
  }

  async getStudentFeeHistory(studentId: string): Promise<any[]> {
    return await db.select()
      .from(schema.feeCalculationHistory)
      .where(eq(schema.feeCalculationHistory.studentId, studentId))
      .orderBy(desc(schema.feeCalculationHistory.createdAt));
  }

  async processMonthlyFeeAutomation(): Promise<void> {
    console.log('🤖 Running monthly fee automation...');

    const currentDate = new Date();
    const isLastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() === currentDate.getDate();

    if (!isLastDayOfMonth) {
      console.log('⏭️ Not the last day of month, skipping automation');
      return;
    }

    // Get all active students
    const activeStudents = await db.select()
      .from(schema.students)
      .where(eq(schema.students.isActive, true));

    for (const student of activeStudents) {
      try {
        // Update balances and schedule next month's fees if needed
        await this.updateStudentBalances(student.id);

        // Schedule next month's fee if not already scheduled
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const nextMonthYear = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

        const existingSchedule = await db.select()
          .from(schema.monthlyFeeSchedule)
          .where(and(
            eq(schema.monthlyFeeSchedule.studentId, student.id),
            eq(schema.monthlyFeeSchedule.monthYear, nextMonthYear)
          ))
          .limit(1);

        if (!existingSchedule[0]) {
          // Get student class fee
          const classFee = await db.select()
            .from(schema.classFees)
            .where(eq(schema.classFees.classId, student.classId))
            .limit(1);

          if (classFee[0]) {
            await db.insert(schema.monthlyFeeSchedule).values({
              studentId: student.id,
              monthYear: nextMonthYear,
              scheduledDate: nextMonth,
              feeAmount: parseFloat(classFee[0].monthlyFee || '0'),
              isProcessed: false,
            });

            await this.createFeeCalculationHistory(student.id, {
              monthYear: nextMonthYear,
              calculationType: 'automated_monthly',
              feeAmount: parseFloat(classFee[0].monthlyFee || '0'),
              enrollmentDay: null,
              reason: 'Automated monthly fee calculation',
            });
          }
        }
      } catch (error) {
        console.error('❌ Error processing student fees:', student.id, error);
      }
    }

    console.log('✅ Monthly fee automation completed');
  }

  async updateStudentFeesWithTotalDue(studentId: string, updates: {
    totalFeeAmount?: string;
    pendingAmount?: string;
    paymentStatus?: 'paid' | 'pending' | 'overdue';
  }): Promise<void> {
    console.log('💰 Updating student fees with total due:', studentId, updates);

    await db.update(schema.students)
      .set({
        ...updates,
      })
      .where(eq(schema.students.id, studentId));

    console.log('✅ Student fees updated successfully');
  }

  // Product Management Methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(schema.products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(schema.products)
      .set(productData)
      .where(eq(schema.products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }

  async getProductById(id: string): Promise<Product | null> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product || null;
  }

  // Commission Wallet Management
  async getOrCreateCommissionWallet(soCenterId: string): Promise<CommissionWallet> {
    // Check if wallet exists
    const [existingWallet] = await db.select()
      .from(schema.commissionWallets)
      .where(eq(schema.commissionWallets.soCenterId, soCenterId));

    if (existingWallet) {
      return existingWallet;
    }

    // Create new wallet
    const [newWallet] = await db.insert(schema.commissionWallets)
      .values({
        soCenterId,
        totalEarned: "0",
        availableBalance: "0",
        totalWithdrawn: "0"
      })
      .returning();

    return newWallet;
  }

  async getCommissionWalletBySoCenter(soCenterId: string): Promise<CommissionWallet | null> {
    const [wallet] = await db.select()
      .from(schema.commissionWallets)
      .where(eq(schema.commissionWallets.soCenterId, soCenterId));
    return wallet || null;
  }

  // Product Orders Management
  async createProductOrder(orderData: InsertProductOrder): Promise<ProductOrder> {
    return await db.transaction(async (tx) => {
      // Create the product order
      const [order] = await tx.insert(schema.productOrders).values(orderData).returning();

      // Update commission wallet
      const wallet = await this.getOrCreateCommissionWallet(orderData.soCenterId);
      const newEarned = Number(wallet.totalEarned) + Number(orderData.commissionAmount);
      const newAvailable = Number(wallet.availableBalance) + Number(orderData.commissionAmount);

      await tx.update(schema.commissionWallets)
        .set({
          totalEarned: newEarned.toString(),
          availableBalance: newAvailable.toString(),
          updatedAt: new Date()
        })
        .where(eq(schema.commissionWallets.id, wallet.id));

      // Create commission transaction
      await tx.insert(schema.commissionTransactions).values({
        commissionWalletId: wallet.id,
        productOrderId: order.id,
        amount: orderData.commissionAmount,
        type: "earned",
        description: `Commission earned from product order: ${orderData.receiptNumber}`
      });

      return order;
    });
  }

  async getProductOrdersBySoCenter(soCenterId: string): Promise<any[]> {
    return await db.select({
      id: schema.productOrders.id,
      productName: schema.products.name,
      amount: schema.productOrders.amount,
      receiptNumber: schema.productOrders.receiptNumber,
      commissionAmount: schema.productOrders.commissionAmount,
      orderStatus: schema.productOrders.orderStatus,
      createdAt: schema.productOrders.createdAt
    })
    .from(schema.productOrders)
    .leftJoin(schema.products, eq(schema.productOrders.productId, schema.products.id))
    .where(eq(schema.productOrders.soCenterId, soCenterId))
    .orderBy(desc(schema.productOrders.createdAt));
  }

  // Withdrawal Requests Management
  async createWithdrawalRequest(requestData: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    return await db.transaction(async (tx) => {
      // Check if wallet has sufficient balance
      const [wallet] = await tx.select()
        .from(schema.commissionWallets)
        .where(eq(schema.commissionWallets.id, requestData.commissionWalletId));

      if (!wallet) {
        throw new Error('Commission wallet not found');
      }

      const availableBalance = Number(wallet.availableBalance);
      const requestAmount = Number(requestData.amount);

      if (requestAmount > availableBalance) {
        throw new Error('Insufficient balance for withdrawal');
      }

      // Create withdrawal request
      const [request] = await tx.insert(schema.withdrawalRequests)
        .values(requestData)
        .returning();

      // Update wallet available balance (reserve the amount)
      await tx.update(schema.commissionWallets)
        .set({
          availableBalance: (availableBalance - requestAmount).toString(),
          updatedAt: new Date()
        })
        .where(eq(schema.commissionWallets.id, wallet.id));

      return request;
    });
  }

  async getWithdrawalRequestsBySoCenter(soCenterId: string): Promise<WithdrawalRequest[]> {
    return await db.select()
      .from(schema.withdrawalRequests)
      .where(eq(schema.withdrawalRequests.soCenterId, soCenterId))
      .orderBy(desc(schema.withdrawalRequests.requestedAt));
  }

  async getAllWithdrawalRequests(): Promise<any[]> {
    return await db.select({
      id: schema.withdrawalRequests.id,
      soCenterName: schema.soCenters.name,
      amount: schema.withdrawalRequests.amount,
      status: schema.withdrawalRequests.status,
      requestedAt: schema.withdrawalRequests.requestedAt,
      processedAt: schema.withdrawalRequests.processedAt,
      notes: schema.withdrawalRequests.notes
    })
    .from(schema.withdrawalRequests)
    .leftJoin(schema.soCenters, eq(schema.withdrawalRequests.soCenterId, schema.soCenters.id))
    .orderBy(desc(schema.withdrawalRequests.requestedAt));
  }

  async processWithdrawalRequest(id: string, status: 'approved' | 'rejected', processedBy: string, notes?: string): Promise<WithdrawalRequest> {
    return await db.transaction(async (tx) => {
      const [request] = await tx.select()
        .from(schema.withdrawalRequests)
        .where(eq(schema.withdrawalRequests.id, id));

      if (!request) {
        throw new Error('Withdrawal request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      // Update request status
      const [updatedRequest] = await tx.update(schema.withdrawalRequests)
        .set({
          status,
          processedAt: new Date(),
          processedBy,
          notes
        })
        .where(eq(schema.withdrawalRequests.id, id))
        .returning();

      const [wallet] = await tx.select()
        .from(schema.commissionWallets)
        .where(eq(schema.commissionWallets.id, request.commissionWalletId));

      if (status === 'approved') {
        // Update wallet totals for approved withdrawal
        const newTotalWithdrawn = Number(wallet.totalWithdrawn) + Number(request.amount);

        await tx.update(schema.commissionWallets)
          .set({
            totalWithdrawn: newTotalWithdrawn.toString(),
            updatedAt: new Date()
          })
          .where(eq(schema.commissionWallets.id, wallet.id));

        // Create withdrawal transaction
        await tx.insert(schema.commissionTransactions).values({
          commissionWalletId: wallet.id,
          amount: request.amount,
          type: "withdrawn",
          description: `Withdrawal approved - Request ID: ${id}`
        });
      } else {
        // For rejected requests, restore the available balance
        const currentAvailable = Number(wallet.availableBalance);
        const restoredBalance = currentAvailable + Number(request.amount);

        await tx.update(schema.commissionWallets)
          .set({
            availableBalance: restoredBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(schema.commissionWallets.id, wallet.id));
      }

      return updatedRequest;
    });
  }

  // System Settings Management
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    const [setting] = await db.select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key));
    return setting || null;
  }

  async setSystemSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<SystemSetting> {
    const existingSetting = await this.getSystemSetting(key);

    if (existingSetting) {
      const [updated] = await db.update(schema.systemSettings)
        .set({
          value,
          description: description || existingSetting.description,
          updatedAt: new Date(),
          updatedBy
        })
        .where(eq(schema.systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schema.systemSettings)
        .values({
          key,
          value,
          description,
          updatedBy
        })
        .returning();
      return created;
    }
  }

  async deleteExam(examId: string): Promise<void> {
    console.log('🗑️ Deleting exam with ID:', examId);
    try {
      await db
        .delete(schema.exams)
        .where(eq(schema.exams.id, examId));
      console.log('✅ Deleted exam successfully');
    } catch (error) {
      console.error('❌ Error deleting exam:', error);
      throw error;
    }
  }

  // Feature 1: Topics Management with Moderate/Important flags
  async getAllTopicsWithChapters(): Promise<any[]> {
    const result = await db.select({
      topicId: schema.topics.id,
      topicName: schema.topics.name,
      description: schema.topics.description,
      orderIndex: schema.topics.orderIndex,
      isModerate: schema.topics.isModerate,
      isImportant: schema.topics.isImportant,
      isActive: schema.topics.isActive,
      chapterId: schema.chapters.id,
      chapterName: schema.chapters.name,
      subjectId: schema.subjects.id,
      subjectName: schema.subjects.name,
      classId: schema.classes.id,
      className: schema.classes.name
    })
    .from(schema.topics)
    .leftJoin(schema.chapters, eq(schema.topics.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .leftJoin(schema.classes, eq(schema.subjects.classId, schema.classes.id))
    .orderBy(asc(schema.classes.name), asc(schema.subjects.name), asc(schema.chapters.name), asc(schema.topics.orderIndex));

    return result;
  }

  async updateTopicFlags(topicId: string, updates: { isModerate?: boolean; isImportant?: boolean }): Promise<Topic> {
    const [updated] = await db.update(schema.topics)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.topics.id, topicId))
      .returning();
    return updated;
  }

  // Feature 7: Student Dropout Requests Management
  async createDropoutRequest(data: any): Promise<any> {
    const [created] = await db.insert(schema.studentDropoutRequests)
      .values({
        ...data,
        requestDate: new Date().toISOString().split('T')[0]
      })
      .returning();
    return created;
  }

  async getDropoutRequests(soCenterId?: string): Promise<any[]> {
    let query = db.select({
      id: schema.studentDropoutRequests.id,
      studentId: schema.studentDropoutRequests.studentId,
      studentName: schema.students.name,
      studentStudentId: schema.students.studentId,
      reason: schema.studentDropoutRequests.reason,
      status: schema.studentDropoutRequests.status,
      requestDate: schema.studentDropoutRequests.requestDate,
      processedDate: schema.studentDropoutRequests.processedDate,
      adminNotes: schema.studentDropoutRequests.adminNotes,
      soCenterName: schema.soCenters.name
    })
    .from(schema.studentDropoutRequests)
    .leftJoin(schema.students, eq(schema.studentDropoutRequests.studentId, schema.students.id))
    .leftJoin(schema.soCenters, eq(schema.studentDropoutRequests.soCenterId, schema.soCenters.id));

    if (soCenterId) {
      query = query.where(eq(schema.studentDropoutRequests.soCenterId, soCenterId));
    }

    return await query.orderBy(desc(schema.studentDropoutRequests.createdAt));
  }

  async processDropoutRequest(requestId: string, status: 'approved' | 'rejected', approvedBy: string, adminNotes?: string): Promise<any> {
    return await db.transaction(async (tx) => {
      const [request] = await tx.select()
        .from(schema.studentDropoutRequests)
        .where(eq(schema.studentDropoutRequests.id, requestId));

      if (!request) {
        throw new Error('Dropout request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      const [updatedRequest] = await tx.update(schema.studentDropoutRequests)
        .set({
          status,
          approvedBy,
          adminNotes,
          processedDate: new Date().toISOString().split('T')[0]
        })
        .where(eq(schema.studentDropoutRequests.id, requestId))
        .returning();

      if (status === 'approved') {
        // Deactivate the student
        await tx.update(schema.students)
          .set({ isActive: false })
          .where(eq(schema.students.id, request.studentId));
      }

      return updatedRequest;
    });
  }

  // Feature 2, 3, 4, 5: Enhanced Dashboard and Academic Features
  async getStudentsBySOCenterDetailed(soCenterId: string): Promise<any[]> {
    return await db.select({
      id: schema.students.id,
      name: schema.students.name,
      studentId: schema.students.studentId,
      className: schema.classes.name,
      totalFeeAmount: schema.students.totalFeeAmount,
      paidAmount: schema.students.paidAmount,
      pendingAmount: schema.students.pendingAmount,
      paymentStatus: schema.students.paymentStatus,
      enrollmentDate: schema.students.enrollmentDate,
      isActive: schema.students.isActive
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(
      eq(schema.students.soCenterId, soCenterId),
      eq(schema.students.isActive, true)
    ))
    .orderBy(desc(schema.students.createdAt));
  }

  // Feature 6: Exam Time Restrictions
  async updateExamTimeSettings(examId: string, startTime: string, endTime: string): Promise<any> {
    const [updated] = await db.update(schema.exams)
      .set({
        startTime,
        endTime,
        updatedAt: new Date()
      })
      .where(eq(schema.exams.id, examId))
      .returning();
    return updated;
  }

  async checkExamTimeAccess(examId: string): Promise<{ canAccess: boolean; message?: string }> {
    const [exam] = await db.select()
      .from(schema.exams)
      .where(eq(schema.exams.id, examId));

    if (!exam) {
      return { canAccess: false, message: 'Exam not found' };
    }

    if (!exam.startTime || !exam.endTime) {
      return { canAccess: true }; // No time restrictions
    }

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];

    if (currentTime < exam.startTime) {
      return { canAccess: false, message: `Exam starts at ${exam.startTime}` };
    }

    if (currentTime > exam.endTime) {
      return { canAccess: false, message: `Exam ended at ${exam.endTime}` };
    }

    return { canAccess: true };
  }
}

export const storage = new DrizzleStorage();

// Initialize the database - DISABLED temporarily to fix login timeout
// initializeDatabase();

export { getUsersByRole, executeRawQuery, sql };