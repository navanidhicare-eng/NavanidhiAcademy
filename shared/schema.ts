import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
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

export const courseTypeEnum = pgEnum("course_type", ["fixed_fee", "monthly_tuition"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "overdue"]);
export const topicStatusEnum = pgEnum("topic_status", ["pending", "learned"]);
export const salaryTypeEnum = pgEnum("salary_type", ["fixed", "commission"]);
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"]);

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
  capacity: integer("capacity"),
  facilities: text("facilities").array(),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
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
  isActive: boolean("is_active").default(true),
});

// Students
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  classId: varchar("class_id").references(() => classes.id),
  parentPhone: text("parent_phone").notNull(),
  parentName: text("parent_name"),
  soCenterId: varchar("so_center_id").references(() => soCenters.id),
  courseType: courseTypeEnum("course_type").notNull(),
  qrCode: text("qr_code").unique(),
  isActive: boolean("is_active").default(true),
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
});

export const insertSoCenterSchema = createInsertSchema(soCenters).omit({
  id: true,
  createdAt: true,
  walletBalance: true,
  isPasswordChanged: true,
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
});

export const insertTopicProgressSchema = createInsertSchema(topicProgress).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
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
export type TopicProgress = typeof topicProgress.$inferSelect;
export type InsertTopicProgress = z.infer<typeof insertTopicProgressSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
