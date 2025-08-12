CREATE TYPE "public"."announcement_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."announcement_target_audience" AS ENUM('students', 'teachers', 'so_centers', 'admin', 'all');--> statement-breakpoint
CREATE TYPE "public"."completion_type" AS ENUM('self', 'helped_by_so');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('rent', 'electric_bill', 'internet_bill', 'so_salary', 'others');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."homework_activity_status" AS ENUM('completed', 'not_completed', 'not_given');--> statement-breakpoint
CREATE TYPE "public"."homework_status" AS ENUM('completed', 'not_completed', 'not_given');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bill', 'voucher', 'upi', 'cash', 'online');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'pending', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."salary_type" AS ENUM('fixed', 'hourly', 'commission');--> statement-breakpoint
CREATE TYPE "public"."school_type" AS ENUM('government', 'private');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('pending', 'learned');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'so_center', 'teacher', 'academic_admin', 'agent', 'office_staff', 'collection_agent', 'marketing_staff');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"target_audience" text[] NOT NULL,
	"priority" "announcement_priority" DEFAULT 'normal',
	"image_url" text,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"is_active" boolean DEFAULT true,
	"show_on_qr_code" boolean DEFAULT false,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"so_center_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"date" date NOT NULL,
	"status" varchar NOT NULL,
	"marked_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "attendance_student_id_date_unique" UNIQUE("student_id","date")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject_id" varchar,
	"description" text,
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "class_fees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" varchar,
	"course_type" "course_type" NOT NULL,
	"admission_fee" numeric(10, 2) NOT NULL,
	"monthly_fee" numeric(10, 2),
	"yearly_fee" numeric(10, 2),
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "commission_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commission_wallet_id" varchar NOT NULL,
	"product_order_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commission_wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"total_earned" numeric(10, 2) DEFAULT '0',
	"available_balance" numeric(10, 2) DEFAULT '0',
	"total_withdrawn" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "commission_wallets_so_center_id_unique" UNIQUE("so_center_id")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"state_id" varchar,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"marks_obtained" integer DEFAULT 0 NOT NULL,
	"percentage" integer DEFAULT 0,
	"answered_questions" varchar DEFAULT 'not_answered' NOT NULL,
	"detailed_results" text,
	"submitted_by" varchar,
	"submitted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exam_results_exam_id_student_id_unique" UNIQUE("exam_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"class_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"chapter_ids" text[] NOT NULL,
	"so_center_ids" text[] NOT NULL,
	"exam_date" date NOT NULL,
	"duration" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"passing_marks" integer NOT NULL,
	"status" text DEFAULT 'scheduled',
	"questions" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fee_calculation_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"calculation_date" date NOT NULL,
	"month_year" text NOT NULL,
	"calculation_type" text NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"enrollment_day" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homework_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"homework_date" date NOT NULL,
	"status" "homework_activity_status" NOT NULL,
	"completion_type" varchar(20),
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "homework_activities_student_id_homework_date_unique" UNIQUE("student_id","homework_date")
);
--> statement-breakpoint
CREATE TABLE "mandals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"district_id" varchar,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "monthly_fee_schedule" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"month_year" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"is_processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "monthly_fee_schedule_student_id_month_year_unique" UNIQUE("student_id","month_year")
);
--> statement-breakpoint
CREATE TABLE "nearby_schools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar,
	"school_name" text NOT NULL,
	"student_strength" integer,
	"school_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nearby_tuitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar,
	"tuition_name" text NOT NULL,
	"student_strength" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"description" text,
	"month" text,
	"year" integer,
	"receipt_number" text,
	"transaction_id" text,
	"recorded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"receipt_number" text NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"order_status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"requirements" text,
	"price" numeric(10, 2) NOT NULL,
	"commission_percentage" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "so_center_equipment" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"item_name" text NOT NULL,
	"serial_number" text NOT NULL,
	"warranty_years" integer NOT NULL,
	"purchase_date" date NOT NULL,
	"warranty_end_date" date NOT NULL,
	"brand_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "so_center_expense_wallet" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"total_expenses" numeric(10, 2) DEFAULT '0',
	"remaining_balance" numeric(10, 2) DEFAULT '0',
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "so_center_expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"expense_type" "expense_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"electric_bill_number" text,
	"internet_bill_number" text,
	"internet_service_provider" text,
	"service_name" text,
	"service_description" text,
	"service_phone" text,
	"status" "expense_status" DEFAULT 'pending',
	"admin_notes" text,
	"payment_method" "payment_method",
	"payment_reference" text,
	"transaction_id" varchar,
	"paid_at" timestamp,
	"paid_by" varchar,
	"requested_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"approved_by" varchar
);
--> statement-breakpoint
CREATE TABLE "so_center_monthly_expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_expenses" numeric(10, 2) DEFAULT '0',
	"total_collections" numeric(10, 2) DEFAULT '0',
	"remaining_balance" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "so_center_monthly_expenses_so_center_id_month_year_unique" UNIQUE("so_center_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "so_centers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"village_id" varchar,
	"phone" text,
	"password" text DEFAULT '12345678' NOT NULL,
	"manager_id" varchar,
	"owner_name" text,
	"owner_last_name" text,
	"owner_father_name" text,
	"owner_mother_name" text,
	"owner_phone" text,
	"landmarks" text,
	"room_size" text,
	"rent_amount" numeric(10, 2),
	"rental_advance" numeric(10, 2),
	"date_of_house_taken" text,
	"monthly_rent_date" integer,
	"electric_bill_account_number" text,
	"internet_bill_account_number" text,
	"email" text,
	"capacity" integer,
	"facilities" text[],
	"wallet_balance" numeric(10, 2) DEFAULT '0',
	"admission_fee_applicable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_password_changed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "so_centers_center_id_unique" UNIQUE("center_id")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "states_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_counter" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"current_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "student_counter_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "student_dropout_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"so_center_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"requested_by" varchar NOT NULL,
	"status" text DEFAULT 'pending',
	"approved_by" varchar,
	"admin_notes" text,
	"request_date" date NOT NULL,
	"processed_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_siblings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar,
	"name" text NOT NULL,
	"class_name" text NOT NULL,
	"school_name" text NOT NULL,
	"school_type" "school_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"name" text NOT NULL,
	"aadhar_number" text NOT NULL,
	"father_name" text NOT NULL,
	"mother_name" text NOT NULL,
	"father_mobile" text NOT NULL,
	"mother_mobile" text,
	"gender" "gender" NOT NULL,
	"date_of_birth" text NOT NULL,
	"present_school_name" text NOT NULL,
	"school_type" "school_type" NOT NULL,
	"father_qualification" text,
	"mother_qualification" text,
	"landmark" text,
	"village_id" varchar,
	"address" text NOT NULL,
	"class_id" varchar,
	"parent_phone" text NOT NULL,
	"parent_name" text,
	"so_center_id" varchar,
	"course_type" "course_type" NOT NULL,
	"qr_code" text,
	"total_fee_amount" numeric(10, 2) DEFAULT '0',
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"pending_amount" numeric(10, 2) DEFAULT '0',
	"payment_status" "payment_status" DEFAULT 'pending',
	"is_active" boolean DEFAULT true,
	"enrollment_date" date NOT NULL,
	"admission_fee_paid" boolean DEFAULT false,
	"last_fee_calculation_date" date,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "students_aadhar_number_unique" UNIQUE("aadhar_number"),
	CONSTRAINT "students_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"class_id" varchar,
	"description" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "teacher_classes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teacher_classes_teacher_id_class_id_unique" UNIQUE("teacher_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "teacher_daily_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"record_date" date NOT NULL,
	"class_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"chapter_id" varchar,
	"topic_id" varchar,
	"teaching_duration" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"subject_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teacher_subjects_teacher_id_subject_id_unique" UNIQUE("teacher_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"father_name" text NOT NULL,
	"mobile" text NOT NULL,
	"address" text NOT NULL,
	"salary" numeric(10, 2) NOT NULL,
	"salary_type" "salary_type" DEFAULT 'fixed' NOT NULL,
	"date_of_birth" date NOT NULL,
	"village_id" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topic_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar,
	"topic_id" varchar,
	"status" "topic_status" DEFAULT 'pending',
	"updated_by" varchar,
	"teacher_feedback" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"chapter_id" varchar,
	"description" text,
	"order_index" integer DEFAULT 0,
	"is_moderate" boolean DEFAULT false,
	"is_important" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tuition_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar,
	"topic_id" varchar,
	"status" "topic_status" DEFAULT 'pending',
	"completed_date" timestamp,
	"updated_by" varchar,
	"teacher_feedback" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tuition_progress_student_id_topic_id_unique" UNIQUE("student_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" NOT NULL,
	"name" text NOT NULL,
	"father_name" text,
	"phone" text,
	"date_of_birth" text,
	"marital_status" "marital_status",
	"salary" numeric(10, 2),
	"salary_type" "salary_type" DEFAULT 'fixed',
	"village_id" varchar,
	"address" text,
	"is_active" boolean DEFAULT true,
	"is_password_changed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"mandal_id" varchar,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"so_center_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"collection_agent_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"so_center_id" varchar,
	"commission_wallet_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"withdrawal_id" text,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"processed_by" varchar,
	"payment_mode" text,
	"payment_details" text,
	"transaction_id" text,
	"notes" text,
	CONSTRAINT "withdrawal_requests_withdrawal_id_unique" UNIQUE("withdrawal_id")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_fees" ADD CONSTRAINT "class_fees_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_commission_wallet_id_commission_wallets_id_fk" FOREIGN KEY ("commission_wallet_id") REFERENCES "public"."commission_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_product_order_id_product_orders_id_fk" FOREIGN KEY ("product_order_id") REFERENCES "public"."product_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_wallets" ADD CONSTRAINT "commission_wallets_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculation_history" ADD CONSTRAINT "fee_calculation_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_activities" ADD CONSTRAINT "homework_activities_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_activities" ADD CONSTRAINT "homework_activities_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandals" ADD CONSTRAINT "mandals_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_fee_schedule" ADD CONSTRAINT "monthly_fee_schedule_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_schools" ADD CONSTRAINT "nearby_schools_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_tuitions" ADD CONSTRAINT "nearby_tuitions_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_equipment" ADD CONSTRAINT "so_center_equipment_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_expense_wallet" ADD CONSTRAINT "so_center_expense_wallet_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_expenses" ADD CONSTRAINT "so_center_expenses_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_expenses" ADD CONSTRAINT "so_center_expenses_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_expenses" ADD CONSTRAINT "so_center_expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_center_monthly_expenses" ADD CONSTRAINT "so_center_monthly_expenses_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_centers" ADD CONSTRAINT "so_centers_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "so_centers" ADD CONSTRAINT "so_centers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_dropout_requests" ADD CONSTRAINT "student_dropout_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_dropout_requests" ADD CONSTRAINT "student_dropout_requests_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_dropout_requests" ADD CONSTRAINT "student_dropout_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_dropout_requests" ADD CONSTRAINT "student_dropout_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_siblings" ADD CONSTRAINT "student_siblings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_classes" ADD CONSTRAINT "teacher_classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_classes" ADD CONSTRAINT "teacher_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_daily_records" ADD CONSTRAINT "teacher_daily_records_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_daily_records" ADD CONSTRAINT "teacher_daily_records_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_daily_records" ADD CONSTRAINT "teacher_daily_records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_daily_records" ADD CONSTRAINT "teacher_daily_records_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_daily_records" ADD CONSTRAINT "teacher_daily_records_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_progress" ADD CONSTRAINT "topic_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_progress" ADD CONSTRAINT "topic_progress_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_progress" ADD CONSTRAINT "topic_progress_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_progress" ADD CONSTRAINT "tuition_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_progress" ADD CONSTRAINT "tuition_progress_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_progress" ADD CONSTRAINT "tuition_progress_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_mandal_id_mandals_id_fk" FOREIGN KEY ("mandal_id") REFERENCES "public"."mandals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_collection_agent_id_users_id_fk" FOREIGN KEY ("collection_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_so_center_id_so_centers_id_fk" FOREIGN KEY ("so_center_id") REFERENCES "public"."so_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_commission_wallet_id_commission_wallets_id_fk" FOREIGN KEY ("commission_wallet_id") REFERENCES "public"."commission_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;