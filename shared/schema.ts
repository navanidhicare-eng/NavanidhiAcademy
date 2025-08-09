import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, pgEnum, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "so_center",
  "teacher", 
  "academic_admin",
  "agent",
  "office_staff",
  "collection_agent",
  "marketing_staff"
]);

export const courseTypeEnum = pgEnum("course_type", ["monthly", "yearly"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const schoolTypeEnum = pgEnum("school_type", ["government", "private"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "overdue"]);
export const topicStatusEnum = pgEnum("topic_status", ["pending", "learned"]);
export const salaryTypeEnum = pgEnum("salary_type", ["fixed", "hourly", "commission"]);
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"]);
export const homeworkStatusEnum = pgEnum("homework_status", ["completed", "not_completed", "not_given"]);
export const homeworkActivityStatusEnum = pgEnum("homework_activity_status", ["completed", "not_completed", "not_given"]);
export const completionTypeEnum = pgEnum("completion_type", ["self", "helped_by_so"]);

// Address hierarchy tables
export const states = pgTable("states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").default(true),
});

export const districts = pgTable("districts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  stateId: varchar("state_id").references(() => states.id),
  isActive: boolean("is_active").default(true),
});

export const mandals = pgTable("mandals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  districtId: varchar("district_id").references(() => districts.id),
  isActive: boolean("is_active").default(true),
});

export const villages = pgTable("villages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  mandalId: varchar("mandal_id").references(() => mandals.id),
  isActive: boolean("is_active").default(true),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull(),
  fatherName: text("father_name"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  maritalStatus: maritalStatusEnum("marital_status"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  salaryType: salaryTypeEnum("salary_type").default("fixed"),
  villageId: varchar("village_id").references(() => villages.id),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  isPasswordChanged: boolean("is_password_changed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// SO Centers
export const soCenters = pgTable("so_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  centerId: text("center_id").notNull().unique(), // NNASOC00001 format
  name: text("name").notNull(),
  address: text("address"),
  villageId: varchar("village_id").references(() => villages.id),
  phone: text("phone"),
  password: text("password").notNull().default("12345678"),
  managerId: varchar("manager_id").references(() => users.id),
  ownerName: text("owner_name"),
  ownerLastName: text("owner_last_name"),
  ownerFatherName: text("owner_father_name"),
  ownerMotherName: text("owner_mother_name"),
  ownerPhone: text("owner_phone"),
  landmarks: text("landmarks"),
  roomSize: text("room_size"),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }),
  rentalAdvance: decimal("rental_advance", { precision: 10, scale: 2 }),
  dateOfHouseTaken: text("date_of_house_taken"),
  monthlyRentDate: integer("monthly_rent_date"), // Day of month (1-31)
  electricityAmount: decimal("electricity_amount", { precision: 10, scale: 2 }),
  monthlyElectricityDate: integer("monthly_electricity_date"), // Day of month (1-31)
  electricalServiceProvider: text("electrical_service_provider"),
  internetAmount: decimal("internet_amount", { precision: 10, scale: 2 }),
  monthlyInternetDate: integer("monthly_internet_date"), // Day of month (1-31)
  internetServiceProvider: text("internet_service_provider"),
  electricBillAccountNumber: text("electric_bill_account_number"),
  internetBillAccountNumber: text("internet_bill_account_number"),
  email: text("email"),
  capacity: integer("capacity"),
  facilities: text("facilities").array(),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
  isPasswordChanged: boolean("is_password_changed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

// Subjects
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  classId: varchar("class_id").references(() => classes.id),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

// Chapters
export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
});

// Topics
export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  chapterId: varchar("chapter_id").references(() => chapters.id),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  isModerate: boolean("is_moderate").default(false),
  isImportant: boolean("is_important").default(false),
  isActive: boolean("is_active").default(true),
});

// Students
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull().unique(), // NNAS25000001 format
  name: text("name").notNull(),
  aadharNumber: text("aadhar_number").notNull().unique(),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
  fatherMobile: text("father_mobile").notNull(),
  motherMobile: text("mother_mobile"),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  presentSchoolName: text("present_school_name").notNull(),
  schoolType: schoolTypeEnum("school_type").notNull(),
  fatherQualification: text("father_qualification"),
  motherQualification: text("mother_qualification"),
  landmark: text("landmark"),
  villageId: varchar("village_id").references(() => villages.id),
  address: text("address").notNull(),
  classId: varchar("class_id").references(() => classes.id),
  parentPhone: text("parent_phone").notNull(), // Keep for compatibility
  parentName: text("parent_name"), // Keep for compatibility
  soCenterId: varchar("so_center_id").references(() => soCenters.id),
  courseType: courseTypeEnum("course_type").notNull(),
  qrCode: text("qr_code").unique(),
  totalFeeAmount: decimal("total_fee_amount", { precision: 10, scale: 2 }).default("0"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  isActive: boolean("is_active").default(true),
  // New fields for enrollment tracking and fee management
  enrollmentDate: date("enrollment_date").notNull(),
  admissionFeePaid: boolean("admission_fee_paid").default(false),
  lastFeeCalculationDate: date("last_fee_calculation_date"), // Track when monthly fee was last calculated
  createdAt: timestamp("created_at").defaultNow(),
});

// Topic Progress
export const topicProgress = pgTable("topic_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  topicId: varchar("topic_id").references(() => topics.id),
  status: topicStatusEnum("status").default("pending"),
  updatedBy: varchar("updated_by").references(() => users.id),
  teacherFeedback: text("teacher_feedback"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  description: text("description"),
  month: text("month"), // For monthly payments
  year: integer("year"), // For monthly payments
  receiptNumber: text("receipt_number"),
  transactionId: text("transaction_id"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  soCenterId: varchar("so_center_id").references(() => soCenters.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // "credit" or "debit"
  description: text("description"),
  collectionAgentId: varchar("collection_agent_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products for commission calculation
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nearby Schools
export const nearbySchools = pgTable("nearby_schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  soCenterId: varchar("so_center_id").references(() => soCenters.id),
  schoolName: text("school_name").notNull(),
  studentStrength: integer("student_strength"),
  schoolType: text("school_type"), // government, private, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Nearby Tuitions
export const nearbyTuitions = pgTable("nearby_tuitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  soCenterId: varchar("so_center_id").references(() => soCenters.id),
  tuitionName: text("tuition_name").notNull(),
  studentStrength: integer("student_strength"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Siblings
export const studentSiblings = pgTable("student_siblings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  name: text("name").notNull(),
  className: text("class_name").notNull(),
  schoolName: text("school_name").notNull(),
  schoolType: schoolTypeEnum("school_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Class Fees
export const classFees = pgTable("class_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => classes.id),
  courseType: courseTypeEnum("course_type").notNull(),
  admissionFee: decimal("admission_fee", { precision: 10, scale: 2 }).notNull(),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }),
  yearlyFee: decimal("yearly_fee", { precision: 10, scale: 2 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Counter for ID generation
export const studentCounter = pgTable("student_counter", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull().unique(),
  currentNumber: integer("current_number").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teachers - Extended teacher management
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fatherName: text("father_name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  salaryType: salaryTypeEnum("salary_type").notNull().default("fixed"),
  dateOfBirth: date("date_of_birth").notNull(),
  villageId: varchar("village_id").references(() => villages.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher Subject Assignments
export const teacherSubjects = pgTable("teacher_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueTeacherSubject: unique().on(table.teacherId, table.subjectId),
}));

// Teacher Class Assignments
export const teacherClasses = pgTable("teacher_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueTeacherClass: unique().on(table.teacherId, table.classId),
}));

// Teacher Daily Records - Track daily teaching activities
export const teacherDailyRecords = pgTable("teacher_daily_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  recordDate: date("record_date").notNull(),
  classId: varchar("class_id").notNull().references(() => classes.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  chapterId: varchar("chapter_id").references(() => chapters.id),
  topicId: varchar("topic_id").references(() => topics.id),
  teachingDuration: integer("teaching_duration").notNull(), // in minutes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fee Calculation History - Track automated fee calculations
export const feeCalculationHistory = pgTable("fee_calculation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  calculationDate: date("calculation_date").notNull(),
  monthYear: text("month_year").notNull(), // Format: "2025-08"
  calculationType: text("calculation_type").notNull(), // "first_month" or "regular_month"
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  enrollmentDay: integer("enrollment_day"), // Day of month when student enrolled (for first month logic)
  reason: text("reason"), // Description of calculation logic applied
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly Fee Schedule - Track when to calculate fees for each student
export const monthlyFeeSchedule = pgTable("monthly_fee_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  monthYear: text("month_year").notNull(), // Format: "2025-08"
  scheduledDate: date("scheduled_date").notNull(), // When fee should be calculated
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueStudentMonth: unique().on(table.studentId, table.monthYear),
}));

// Homework Activity
export const homeworkActivities = pgTable("homework_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  homeworkDate: date("homework_date").notNull(),
  status: homeworkActivityStatusEnum("status").notNull(),
  completionType: varchar("completion_type", { length: 20 }), // 'self' or 'helped_by_so'
  reason: text("reason"), // reason when status is 'not_completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStudentDate: unique().on(table.studentId, table.homeworkDate),
}));

// Tuition Activity Progress
export const tuitionProgress = pgTable("tuition_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  topicId: varchar("topic_id").references(() => topics.id),
  status: topicStatusEnum("status").default("pending"),
  completedDate: timestamp("completed_date"),
  updatedBy: varchar("updated_by").references(() => users.id),
  teacherFeedback: text("teacher_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStudentTopic: unique().on(table.studentId, table.topicId),
}));

// Insert schemas
export const insertStateSchema = createInsertSchema(states).omit({
  id: true,
});

export const insertDistrictSchema = createInsertSchema(districts).omit({
  id: true,
});

export const insertMandalSchema = createInsertSchema(mandals).omit({
  id: true,
});

export const insertVillageSchema = createInsertSchema(villages).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isPasswordChanged: true,
}).extend({
  // Transform salary from number to string if needed
  salary: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
});

export const insertSoCenterSchema = createInsertSchema(soCenters).omit({
  id: true,
  createdAt: true,
  walletBalance: true,
  isPasswordChanged: true,
}).extend({
  // Transform decimal fields from number to string if needed
  rentAmount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  rentalAdvance: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  electricityAmount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  internetAmount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  qrCode: true,
  studentId: true,
}).extend({
  enrollmentDate: z.string().optional(), // Allow string date input
  previousBalance: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  previousBalanceDetails: z.string().optional(),
});

export const insertFeeCalculationHistorySchema = createInsertSchema(feeCalculationHistory).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlyFeeScheduleSchema = createInsertSchema(monthlyFeeSchedule).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertStudentSiblingSchema = createInsertSchema(studentSiblings).omit({
  id: true,
  createdAt: true,
});

export const insertClassFeeSchema = createInsertSchema(classFees).omit({
  id: true,
  createdAt: true,
});

export const insertStudentCounterSchema = createInsertSchema(studentCounter).omit({
  id: true,
  updatedAt: true,
});

export const insertTopicProgressSchema = createInsertSchema(topicProgress).omit({
  id: true,
  updatedAt: true,
});

export const insertHomeworkActivitySchema = createInsertSchema(homeworkActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTuitionProgressSchema = createInsertSchema(tuitionProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  salary: z.union([z.string(), z.number()]).transform((val) => String(val)),
  dateOfBirth: z.string(), // Allow string date input
});

export const insertTeacherDailyRecordSchema = createInsertSchema(teacherDailyRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  recordDate: z.string(), // Allow string date input
});

// Attendance table with unique constraint
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  soCenterId: varchar("so_center_id").notNull().references(() => soCenters.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  date: date("date").notNull(),
  status: varchar("status", { enum: ["present", "absent", "holiday"] }).notNull(),
  markedBy: varchar("marked_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStudentDate: unique().on(table.studentId, table.date),
}));

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema>;
export type District = typeof districts.$inferSelect;
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type Mandal = typeof mandals.$inferSelect;
export type InsertMandal = z.infer<typeof insertMandalSchema>;
export type Village = typeof villages.$inferSelect;
export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SoCenter = typeof soCenters.$inferSelect;
export type InsertSoCenter = z.infer<typeof insertSoCenterSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type StudentSibling = typeof studentSiblings.$inferSelect;
export type InsertStudentSibling = z.infer<typeof insertStudentSiblingSchema>;
export type ClassFee = typeof classFees.$inferSelect;
export type InsertClassFee = z.infer<typeof insertClassFeeSchema>;
export type StudentCounter = typeof studentCounter.$inferSelect;
export type InsertStudentCounter = z.infer<typeof insertStudentCounterSchema>;
export type TopicProgress = typeof topicProgress.$inferSelect;
export type InsertTopicProgress = z.infer<typeof insertTopicProgressSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type HomeworkActivity = typeof homeworkActivities.$inferSelect;
export type InsertHomeworkActivity = z.infer<typeof insertHomeworkActivitySchema>;
export type TeacherDailyRecord = typeof teacherDailyRecords.$inferSelect;
export type InsertTeacherDailyRecord = z.infer<typeof insertTeacherDailyRecordSchema>;
export type TuitionProgress = typeof tuitionProgress.$inferSelect;
export type InsertTuitionProgress = z.infer<typeof insertTuitionProgressSchema>;

export type FeeCalculationHistory = typeof feeCalculationHistory.$inferSelect;
export type InsertFeeCalculationHistory = z.infer<typeof insertFeeCalculationHistorySchema>;

export type MonthlyFeeSchedule = typeof monthlyFeeSchedule.$inferSelect;
export type InsertMonthlyFeeSchedule = z.infer<typeof insertMonthlyFeeScheduleSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type TeacherClass = typeof teacherClasses.$inferSelect;
export type TeacherDailyRecord = typeof teacherDailyRecords.$inferSelect;
export type InsertTeacherDailyRecord = z.infer<typeof insertTeacherDailyRecordSchema>;
