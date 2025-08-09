import { eq, and, sql } from 'drizzle-orm';
import { db } from '../storage';
import {
  teachers,
  teacherSubjects,
  teacherClasses,
  teacherDailyRecords,
  subjects,
  classes,
  chapters,
  topics,
  type Teacher,
  type TeacherSubject,
  type TeacherClass,
  type TeacherDailyRecord,
  type InsertTeacher,
  type InsertTeacherDailyRecord
} from '@shared/schema';

export class TeacherStorage {
  // Get all teachers with their assignments
  async getAllTeachers(): Promise<any[]> {
    const result = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        fatherName: teachers.fatherName,
        mobile: teachers.mobile,
        address: teachers.address,
        salary: teachers.salary,
        salaryType: teachers.salaryType,
        dateOfBirth: teachers.dateOfBirth,
        villageId: teachers.villageId,
        isActive: teachers.isActive,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
      })
      .from(teachers)
      .where(eq(teachers.isActive, true))
      .orderBy(teachers.createdAt);

    return result;
  }

  // Get teacher by ID
  async getTeacherById(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, id));

    return teacher;
  }

  // Create teacher with subject and class assignments
  async createTeacher(data: InsertTeacher & { subjectIds: string[], classIds: string[] }): Promise<Teacher> {
    const { subjectIds, classIds, ...teacherData } = data;

    return await db.transaction(async (tx) => {
      // Create teacher
      const [teacher] = await tx
        .insert(teachers)
        .values(teacherData)
        .returning();

      // Assign subjects
      if (subjectIds.length > 0) {
        await tx
          .insert(teacherSubjects)
          .values(subjectIds.map(subjectId => ({
            teacherId: teacher.id,
            subjectId
          })));
      }

      // Assign classes
      if (classIds.length > 0) {
        await tx
          .insert(teacherClasses)
          .values(classIds.map(classId => ({
            teacherId: teacher.id,
            classId
          })));
      }

      return teacher;
    });
  }

  // Get teacher's assigned subjects
  async getTeacherSubjects(teacherId: string): Promise<any[]> {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(teacherSubjects)
      .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
      .where(eq(teacherSubjects.teacherId, teacherId));

    return result;
  }

  // Get teacher's assigned classes
  async getTeacherClasses(teacherId: string): Promise<any[]> {
    const result = await db
      .select({
        id: classes.id,
        name: classes.name,
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(teacherClasses.classId, classes.id))
      .where(eq(teacherClasses.teacherId, teacherId));

    return result;
  }

  // Get teacher's daily records
  async getTeacherRecords(teacherId: string): Promise<any[]> {
    const result = await db
      .select({
        id: teacherDailyRecords.id,
        teacherId: teacherDailyRecords.teacherId,
        recordDate: teacherDailyRecords.recordDate,
        classId: teacherDailyRecords.classId,
        subjectId: teacherDailyRecords.subjectId,
        chapterId: teacherDailyRecords.chapterId,
        topicId: teacherDailyRecords.topicId,
        teachingDuration: teacherDailyRecords.teachingDuration,
        notes: teacherDailyRecords.notes,
        createdAt: teacherDailyRecords.createdAt,
        className: classes.name,
        subjectName: subjects.name,
        chapterName: chapters.name,
        topicName: topics.name,
      })
      .from(teacherDailyRecords)
      .leftJoin(classes, eq(teacherDailyRecords.classId, classes.id))
      .leftJoin(subjects, eq(teacherDailyRecords.subjectId, subjects.id))
      .leftJoin(chapters, eq(teacherDailyRecords.chapterId, chapters.id))
      .leftJoin(topics, eq(teacherDailyRecords.topicId, topics.id))
      .where(eq(teacherDailyRecords.teacherId, teacherId))
      .orderBy(sql`${teacherDailyRecords.recordDate} DESC`);

    return result;
  }

  // Add daily teaching record
  async addTeachingRecord(data: InsertTeacherDailyRecord): Promise<TeacherDailyRecord> {
    const [record] = await db
      .insert(teacherDailyRecords)
      .values({
        ...data,
        // Convert date string to proper format if needed
        recordDate: typeof data.recordDate === 'string' ? data.recordDate : data.recordDate,
      })
      .returning();

    return record;
  }

  // Update teacher
  async updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher> {
    const [teacher] = await db
      .update(teachers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, id))
      .returning();

    return teacher;
  }

  // Delete teacher (soft delete)
  async deleteTeacher(id: string): Promise<void> {
    await db
      .update(teachers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, id));
  }

  // Update teacher subject assignments
  async updateTeacherSubjects(teacherId: string, subjectIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove existing assignments
      await tx
        .delete(teacherSubjects)
        .where(eq(teacherSubjects.teacherId, teacherId));

      // Add new assignments
      if (subjectIds.length > 0) {
        await tx
          .insert(teacherSubjects)
          .values(subjectIds.map(subjectId => ({
            teacherId,
            subjectId
          })));
      }
    });
  }

  // Update teacher class assignments
  async updateTeacherClasses(teacherId: string, classIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove existing assignments
      await tx
        .delete(teacherClasses)
        .where(eq(teacherClasses.teacherId, teacherId));

      // Add new assignments
      if (classIds.length > 0) {
        await tx
          .insert(teacherClasses)
          .values(classIds.map(classId => ({
            teacherId,
            classId
          })));
      }
    });
  }
}