import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Student,
  InsertStudent,
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
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

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
  updateSoCenterWallet(id: string, amount: string): Promise<SoCenter>;

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

  // Wallet methods
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getWalletTransactions(soCenterId: string): Promise<WalletTransaction[]>;

  // Address hierarchy methods
  getAllStates(): Promise<any[]>;
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

  async getAllSoCenters(): Promise<SoCenter[]> {
    return await db.select().from(schema.soCenters).where(eq(schema.soCenters.isActive, true));
  }

  async createSoCenter(center: InsertSoCenter): Promise<SoCenter> {
    const result = await db.insert(schema.soCenters).values(center).returning();
    return result[0];
  }

  async updateSoCenterWallet(id: string, amount: string): Promise<SoCenter> {
    const result = await db.update(schema.soCenters)
      .set({ walletBalance: amount })
      .where(eq(schema.soCenters.id, id))
      .returning();
    return result[0];
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

  async getStudentsBySoCenter(soCenterId: string): Promise<Student[]> {
    return await db.select().from(schema.students)
      .where(and(eq(schema.students.soCenterId, soCenterId), eq(schema.students.isActive, true)))
      .orderBy(desc(schema.students.createdAt));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const qrCode = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.insert(schema.students)
      .values({ ...student, qrCode })
      .returning();
    return result[0];
  }

  async updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student> {
    const result = await db.update(schema.students)
      .set(updates)
      .where(eq(schema.students.id, id))
      .returning();
    return result[0];
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

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const result = await db.insert(schema.walletTransactions).values(transaction).returning();
    return result[0];
  }

  async getWalletTransactions(soCenterId: string): Promise<WalletTransaction[]> {
    return await db.select().from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.soCenterId, soCenterId))
      .orderBy(desc(schema.walletTransactions.createdAt));
  }
  // Address hierarchy methods
  async getAllStates(): Promise<any[]> {
    return await db.select().from(schema.states).where(eq(schema.states.isActive, true)).orderBy(asc(schema.states.name));
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
    const centers = await db.select().from(schema.soCenters);
    const count = centers.length;
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `NNASOC${nextNumber}`;
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
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(schema.students)
      .where(eq(schema.students.isActive, true))
      .orderBy(desc(schema.students.createdAt));
  }

  async deleteStudent(id: string): Promise<void> {
    await db.update(schema.students)
      .set({ isActive: false })
      .where(eq(schema.students.id, id));
  }

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
}

export const storage = new DrizzleStorage();
