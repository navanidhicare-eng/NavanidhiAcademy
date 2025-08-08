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
}

export const storage = new DrizzleStorage();
