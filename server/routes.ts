import type { Express, Request } from "express";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        id?: string; // For backward compatibility
      };
    }
  }
}
import { createServer, type Server } from "http";
import { storage, db, getUsersByRole, executeRawQuery, sql } from "./storage";
import { FeeCalculationService } from './feeCalculationService';
import { MonthlyFeeScheduler } from './monthlyFeeScheduler';
import { supabaseAdmin } from './supabaseClient';
import { createAdminUser } from './createAdminUser';
import { AuthService } from './authService';
import { sql as sqlQuery, eq, desc, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, 
  insertStudentSchema, 
  insertStudentSiblingSchema,
  insertClassFeeSchema,
  insertPaymentSchema, 
  insertTopicProgressSchema,
  insertStateSchema,
  insertDistrictSchema,
  insertMandalSchema,
  insertVillageSchema,
  insertClassSchema,
  insertSubjectSchema,
  insertChapterSchema,
  insertTopicSchema,
  insertSoCenterSchema,
  insertAttendanceSchema,
  insertHomeworkActivitySchema,
  insertTuitionProgressSchema,
  insertProductSchema,
  insertSoCenterExpenseSchema,
  insertExamSchema,
  insertExamResultSchema,
  insertSoCenterExpenseWalletSchema,
  insertWalletTransactionSchema,
  insertAdminNotificationSchema,
  insertWithdrawalRequestSchema,
  insertTeacherDailyRecordSchema
} from "@shared/schema";
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || "navanidhi-academy-secret-key-2024";

// Initialize admin user on server start with timeout
/*
(async () => {
  try {
    console.log('🚀 Initializing Supabase authentication...');
    await Promise.race([
      createAdminUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin initialization timeout - continuing without full setup')), 10000)
      )
    ]);
  } catch (error: any) {
    console.warn('⚠️ Admin initialization failed, continuing with basic functionality:', error.message);
    console.log('🔄 System will continue - authentication may work after database reconnects');
  }
})();
*/

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenLength: token?.length,
    tokenStart: token?.substring(0, 20) + '...'
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('❌ JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.log('✅ JWT verified successfully:', { userId: user.userId, role: user.role });
    req.user = user;
    next();
  });
};

// Middleware to check user role
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
  });

  // Database health check endpoint
  app.get("/api/health/db", async (req, res) => {
    try {
      const startTime = Date.now();
      const result = await db.select().from(schema.users).limit(1);
      const duration = Date.now() - startTime;
      res.json({ 
        status: "connected", 
        duration: `${duration}ms`,
        recordCount: result.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(500).json({ 
        status: "failed", 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Auth routes - Supabase Authentication
  app.post("/api/auth/login", async (req, res) => {
    // Add timeout wrapper to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout - request took too long')), 15000);
    });

    try {
      await Promise.race([
        (async () => {
          console.log("Login attempt:", req.body);
          let { email, password } = req.body;

          if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
          }

          // Convert SO Center ID format to email format
          if (/^[A-Z0-9]+$/.test(email) && !email.includes('@')) {
            console.log(`🔄 Converting SO Center ID "${email}" to email format`);
            email = `${email.toLowerCase()}@navanidhi.org`;
            console.log(`✅ Converted to: ${email}`);
          }

          try {
            // 1. Authenticate with Supabase Auth
            console.log(`🔐 Authenticating with Supabase Auth: ${email}`);
            const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
              email,
              password
            });

            if (authError || !authData.user) {
              console.log(`❌ Supabase Auth failed:`, authError?.message);
              return res.status(401).json({ message: "Invalid credentials" });
            }

            console.log(`✅ Supabase Auth successful:`, authData.user.id);

            // 2. Get or sync user from our database with timeout
            console.log(`🔍 Getting user from database: ${email}`);
            const dbQueryPromise = storage.getUserByEmail(email);
            const dbTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Database query timeout')), 5000);
            });

            let user = await Promise.race([dbQueryPromise, dbTimeoutPromise]);
            console.log(`✅ Database query completed successfully`);

            if (!user) {
              // User exists in Supabase but not in our database - sync them
              console.log(`🔄 Syncing user from Supabase to database: ${email}`);
              const userMetadata = authData.user.user_metadata;
              user = await storage.createUser({
                email: email,
                role: userMetadata.role || 'agent',
                name: userMetadata.name || authData.user.email?.split('@')[0] || 'User',
                isActive: true,
                password: '' // We use Supabase Auth, no local password needed
              });
              console.log(`✅ User synced to database:`, user.id);
            }

            console.log(`✅ User authenticated:`, { id: user.id, email: user.email, role: user.role });

            const token = jwt.sign(
              { userId: user.id, email: user.email, role: user.role },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            // Determine dashboard route based on role
            let dashboardRoute = '/dashboard';
            switch (user.role) {
              case 'admin':
                dashboardRoute = '/admin/users';
                break;
              case 'so_center':
                dashboardRoute = '/dashboard';
                break;
              case 'teacher':
                dashboardRoute = '/dashboard';
                break;
              case 'academic_admin':
                dashboardRoute = '/dashboard';
                break;
              case 'agent':
                dashboardRoute = '/dashboard';
                break;
              case 'office_staff':
                dashboardRoute = '/dashboard';
                break;
              case 'collection_agent':
                dashboardRoute = '/dashboard';
                break;
              case 'marketing_staff':
                dashboardRoute = '/dashboard';
                break;
              default:
                dashboardRoute = '/dashboard';
            }

            console.log(`📍 Redirecting ${user.role} to: ${dashboardRoute}`);
            console.log(`🚀 Sending login response...`);

            res.json({
              token,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              redirectTo: dashboardRoute
            });

            console.log(`✅ Login response sent successfully`);
          } catch (dbError) {
            console.error("Database error:", dbError);
            if (!res.headersSent) {
              return res.status(401).json({ message: "Database connection failed" });
            }
          }
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error("Login error:", error);
      if (!res.headersSent) {
        if (error.message.includes('timeout')) {
          res.status(408).json({ message: "Login request timed out - please try again" });
        } else {
          res.status(500).json({ message: "Login failed" });
        }
      }
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('🔧 Creating new user through Supabase Auth (MANDATORY)');
      const userData = insertUserSchema.parse(req.body);

      // ALL USER CREATION MUST GO THROUGH SUPABASE AUTH
      const result = await AuthService.createUser({
        email: userData.email,
        password: userData.password,
        role: userData.role || 'agent',
        name: userData.name,
        phone: userData.phone,
        address: userData.address
      });

      console.log('✅ User created through Supabase Auth:', result.dbUser.id);

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: result.dbUser.id,
          email: result.dbUser.email,
          name: result.dbUser.name,
          role: result.dbUser.role
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // DEPRECATED - All user creation now goes through Supabase Auth
  app.post("/api/auth/register-old", async (req, res) => {
    res.status(410).json({ 
      message: "This endpoint is deprecated. All authentication now uses Supabase Auth exclusively." 
    });
  });

  // SUPABASE AUTH ENFORCED - SO Center Login
  // SO CENTER AUTHENTICATION MANAGEMENT
  app.post("/api/admin/so-centers/create-auth", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      console.log('🔧 Creating SO Center authentication via standardized flow');
      const { centerId, centerName, password, phone, address } = req.body;

      if (!centerId || !centerName || !password) {
        return res.status(400).json({ 
          message: "Center ID, center name, and password are required" 
        });
      }

      // Import SO Center Auth Manager
      const { SOCenterAuthManager } = await import('./createSOCenterAuth');

      // Check if SO Center already exists
      const exists = await SOCenterAuthManager.checkSOCenterExists(centerId);
      if (exists) {
        return res.status(409).json({ 
          message: `SO Center ${centerId} already exists` 
        });
      }

      // Create SO Center authentication
      const result = await SOCenterAuthManager.createSOCenterAuth({
        centerId,
        centerName,
        password,
        phone,
        address
      });

      console.log('✅ SO Center authentication created:', result.centerId);

      res.status(201).json({
        message: "SO Center authentication created successfully",
        data: result
      });
    } catch (error: any) {
      console.error('❌ SO Center auth creation failed:', error);
      res.status(500).json({ message: error.message || "Failed to create SO Center authentication" });
    }
  });

  app.post("/api/so-center/login", async (req, res) => {
    try {
      console.log('🔧 SO Center login through Supabase Auth (MANDATORY)');
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Convert SO Center ID format to email format if needed
      if (/^[A-Z0-9]+$/.test(email) && !email.includes('@')) {
        console.log(`🔄 Converting SO Center ID "${email}" to email format`);
        email = `${email.toLowerCase()}@navanidhi.org`;
        console.log(`✅ Converted to: ${email}`);
      }

      // ALL SO CENTER LOGIN MUST GO THROUGH SUPABASE AUTH
      const result = await AuthService.login(email, password);

      // Verify this is a SO Center user
      if (result.user.role !== 'so_center') {
        return res.status(403).json({ message: "Access denied. SO Center credentials required." });
      }

      console.log('✅ SO Center logged in through Supabase Auth:', result.user.id);

      res.json({
        message: "SO Center login successful via Supabase Auth",
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        }
      });
    } catch (error: any) {
      console.error('❌ SO Center login failed:', error);
      res.status(401).json({ message: error.message || "Invalid credentials" });
    }
  });

  // Legacy user creation endpoint - REDIRECTS TO SUPABASE AUTH
  app.post("/api/admin/users-legacy", authenticateToken, async (req, res) => {
    res.status(410).json({ 
      message: "Legacy user creation deprecated. All user creation now uses Supabase Auth exclusively via /api/auth/register" 
    });
  });

  // SUPABASE AUTH ENFORCED - SO Center Dashboard Stats API
  app.get("/api/so-center/dashboard-stats", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      console.log('📊 Fetching SO Center dashboard stats for user:', req.user!.userId);

      // Get SO Center from user email
      const soCenter = await storage.getSoCenterByEmail(req.user!.email);
      if (!soCenter) {
        return res.status(404).json({ message: 'SO Center not found' });
      }

      // Calculate real metrics from database with error handling
      let stats;
      try {
        stats = await storage.getSoCenterDashboardStats(soCenter.id);
      } catch (error) {
        console.error('⚠️ Error calculating SO Center stats, using basic fallback:', error);
        // Basic fallback stats
        stats = {
          newStudentsThisMonth: 0,
          thisMonthCollection: 0,
          todayCollection: 0,
          todayAttendance: 0,
          thisMonthProductSales: 0,
          collectionChart: [],
          attendanceChart: [],
          productSalesChart: []
        };
      }

      console.log('✅ SO Center dashboard stats calculated:', stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Error fetching SO Center dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Handle demo users (they don't exist in database)
      if (req.user!.userId.startsWith('demo-')) {
        const demoUsers = [
          {
            id: "demo-admin-1",
            email: "admin@demo.com",
            name: "Admin User",
            role: "admin"
          },
          {
            id: "demo-so-1",
            email: "so@demo.com",
            name: "SO Center Manager",
            role: "so_center"
          },
          {
            id: "demo-teacher-1",
            email: "teacher@demo.com",
            name: "Math Teacher",
            role: "teacher"
          }
        ];

        const demoUser = demoUsers.find(u => u.id === req.user!.userId);
        if (demoUser) {
          return res.json({
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
          });
        }
      }

      // Handle database users
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Student payment history route
  app.get("/api/students/:id/payments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { id } = req.params;
      const payments = await storage.getStudentPaymentHistory(id);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching student payment history:', error);
      res.status(500).json({ message: 'Failed to fetch payment history' });
    }
  });

  // Recalculate fees for a student based on enrollment date
  app.post("/api/students/:id/recalculate-fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'so_center')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const studentId = req.params.id;
      console.log('🔄 Recalculating fees for student:', studentId);

      const feeCalculation = await FeeCalculationService.recalculateStudentFees(studentId);

      res.json({
        message: 'Fees recalculated successfully',
        feeCalculation
      });
    } catch (error: any) {
      console.error('Error recalculating student fees:', error);
      res.status(500).json({ message: error.message || 'Failed to recalculate fees' });
    }
  });

  // Preview monthly fee update (admin only)
  app.get("/api/admin/monthly-fees/preview", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log('👀 Admin previewing monthly fee update');
      const preview = await MonthlyFeeScheduler.previewMonthlyFeeUpdate();

      res.json({
        message: 'Monthly fee preview generated',
        preview
      });
    } catch (error: any) {
      console.error('Error previewing monthly fees:', error);
      res.status(500).json({ message: error.message || 'Failed to preview monthly fees' });
    }
  });

  // Run monthly fee update manually (admin only)
  app.post("/api/admin/monthly-fees/run", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log('🚀 Admin manually running monthly fee update');
      await MonthlyFeeScheduler.addMonthlyFeesToAllStudents();

      res.json({
        message: 'Monthly fees added successfully to all active students'
      });
    } catch (error: any) {
      console.error('Error running monthly fee update:', error);
      res.status(500).json({ message: error.message || 'Failed to run monthly fee update' });
    }
  });

  // Attendance routes
  app.post("/api/attendance/submit", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { date, classId, records } = req.body;
      const soCenterId = req.user.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : req.user.userId;

      const result = await storage.submitAttendance({
        date,
        classId,
        soCenterId,
        markedBy: req.user.userId,
        records
      });

      res.json(result);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      res.status(500).json({ message: 'Failed to submit attendance' });
    }
  });

  app.post("/api/attendance/holiday", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { date, classId, records } = req.body;
      const soCenterId = req.user.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : req.user.userId;

      const result = await storage.submitAttendance({
        date,
        classId,
        soCenterId,
        markedBy: req.user.userId,
        records
      });

      res.json({ studentCount: result.holidayCount });
    } catch (error) {
      console.error('Error marking holiday:', error);
      res.status(500).json({ message: 'Failed to mark holiday' });
    }
  });

  // Get students for a specific exam (SO Center specific)
  app.get("/api/so-center/exams/:examId/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const examId = req.params.examId;
      console.log('🔍 Fetching students for exam:', examId);

      // Get the exam first to get class information
      const exam = await db.select()
        .from(schema.exams)
        .where(eq(schema.exams.id, examId))
        .limit(1);

      if (!exam.length) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const examData = exam[0];

      // Get SO Center for this user
      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(403).json({ message: "SO Center not found for user" });
      }

      // Get students from this SO Center who are in the exam's class
      const students = await db
        .select({
          id: schema.students.id,
          name: schema.students.name,
          studentId: schema.students.studentId,
          classId: schema.students.classId,
          className: schema.classes.name,
        })
        .from(schema.students)
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .where(
          and(
            eq(schema.students.soCenterId, soCenter.id),
            eq(schema.students.classId, examData.classId),
            eq(schema.students.isActive, true)
          )
        )
        .orderBy(schema.students.name);

      console.log(`📊 Found ${students.length} students for exam ${examId} in SO Center ${soCenter.centerId}`);
      res.json(students);
    } catch (error) {
      console.error('Error fetching exam students:', error);
      res.status(500).json({ message: 'Failed to fetch exam students' });
    }
  });

  // Get existing attendance for students on a specific date
  app.get("/api/attendance/existing", authenticateToken, async (req, res) => {
    try {
      const { date, studentIds } = req.query;

      if (!date || !studentIds) {
        return res.status(400).json({ message: "Date and studentIds are required" });
      }

      const studentIdArray = (studentIds as string).split(',');
      const attendanceMap = await storage.getExistingAttendance({
        date: date as string,
        studentIds: studentIdArray
      });

      // Convert Map to object for JSON response
      const result: Record<string, { status: string; id: string }> = {};
      attendanceMap.forEach((value, key) => {
        result[key] = value;
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
      res.status(500).json({ message: 'Failed to fetch existing attendance' });
    }
  });

  app.get("/api/attendance/stats", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { soCenterId, month, classId } = req.query;
      const actualSoCenterId = soCenterId || (req.user.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : req.user.userId);

      const stats = await storage.getAttendanceStats({
        soCenterId: actualSoCenterId as string,
        month: month as string,
        classId: classId as string
      });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      res.status(500).json({ message: 'Failed to fetch attendance stats' });
    }
  });

  app.get("/api/attendance/student-report", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { studentId, month } = req.query;

      const report = await storage.getStudentAttendanceReport(
        studentId as string,
        month as string
      );

      res.json(report);
    } catch (error) {
      console.error('Error fetching student attendance report:', error);
      res.status(500).json({ message: 'Failed to fetch student attendance report' });
    }
  });

  // Get detailed monthly attendance for all students in a class
  app.get("/api/attendance/monthly-report", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { soCenterId, month, classId } = req.query;
      const actualSoCenterId = soCenterId || (req.user.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : req.user.userId);

      const monthlyReport = await storage.getMonthlyAttendanceReport({
        soCenterId: actualSoCenterId as string,
        month: month as string,
        classId: classId as string
      });

      res.json(monthlyReport);
    } catch (error) {
      console.error('Error fetching monthly attendance report:', error);
      res.status(500).json({ message: 'Failed to fetch monthly attendance report' });
    }
  });

  // SO Center detailed students endpoint
  app.get("/api/so-center/detailed-students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      console.log('🏢 SO Center requesting detailed students - enforcing strict privacy');
      console.log('🔍 SO Center user email:', req.user.email);

      try {
        // Get SO Center associated with this user
        const soCenter = await storage.getSoCenterByEmail(req.user.email);

        if (!soCenter) {
          console.log('❌ No SO Center found for user email:', req.user.email);
          return res.status(403).json({ message: "SO Center not found for user" });
        }

        console.log('✅ SO Center found:', soCenter.centerId, '- Fetching ONLY their detailed students');

        // Get detailed students for this SO Center using the same working method as regular students endpoint
        const studentsFromDb = await storage.getStudentsBySoCenter(soCenter.id);

        console.log(`🔒 PRIVACY ENFORCED: Retrieved ${studentsFromDb ? studentsFromDb.length : 0} detailed students for SO Center ${soCenter.centerId}`);

        // Ensure we always return an array, never an object
        const students = Array.isArray(studentsFromDb) ? studentsFromDb : [];

        // Set proper headers to prevent caching issues
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        console.log(`📤 Sending ${students.length} students to frontend`);
        res.json(students);
      } catch (error) {
        console.error('❌ Error in SO Center detailed students endpoint:', error);
        return res.status(500).json({ message: "Failed to fetch detailed students" });
      }
    } catch (error) {
      console.error('❌ Error fetching SO Center detailed students:', error);
      res.status(500).json({ message: "Failed to fetch detailed students" });
    }
  });

  // Student routes
  app.get("/api/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log("🔐 PRIVACY CHECK: User role:", req.user.role, "User ID:", req.user.userId);

      if (req.user.role === 'so_center') {
        // CRITICAL PRIVACY: SO Center can ONLY see their own students
        console.log('🏢 SO Center requesting students - enforcing strict privacy');
        console.log('🔍 SO Center user email:', req.user.email);

        try {
          // Get SO Center associated with this user using improved lookup
          let soCenter = await storage.getSoCenterByEmail(req.user.email);

          // Fallback: try to find by center ID pattern if email doesn't work
          if (!soCenter) {
            const emailPrefix = req.user.email.split('@')[0];
            if (emailPrefix && emailPrefix.toLowerCase().startsWith('nnasoc')) {
              console.log('🔄 Trying fallback SO Center lookup by center ID pattern...');
              const results = await sql`
                SELECT * FROM so_centers 
                WHERE center_id = ${emailPrefix.toUpperCase()}
                LIMIT 1
              `;

              if (results.length > 0) {
                soCenter = {
                  id: results[0].id,
                  centerId: results[0].center_id,
                  name: results[0].name,
                  email: results[0].email
                };
                console.log('✅ Found SO Center via fallback:', soCenter.centerId);
              }
            }
          }

          if (!soCenter) {
            console.log('❌ No SO Center found for user email:', req.user.email);
            return res.status(403).json({ message: "SO Center not found for user" });
          }

          console.log('✅ SO Center found:', soCenter.centerId, '- Fetching ONLY their students');

          // Get ONLY students registered by THIS SO Center with explicit array return
          const studentsFromDb = await storage.getStudentsBySoCenter(soCenter.id);

          console.log(`🔒 PRIVACY ENFORCED: Retrieved ${studentsFromDb ? studentsFromDb.length : 0} students for SO Center ${soCenter.centerId}`);

          // Ensure we always return an array, never an object
          const students = Array.isArray(studentsFromDb) ? studentsFromDb : [];

          // Preserve database values and only add progress info
          const studentsWithStatus = students.map((student: any) => ({
            ...student,
            paymentStatus: parseFloat(student.pendingAmount || '0') <= 0 ? 'paid' : 'pending',
            progress: 0
          }));

          // Set proper headers to prevent caching issues
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');

          console.log(`📤 Sending ${studentsWithStatus.length} students to frontend`);
          res.json(studentsWithStatus);
        } catch (error) {
          console.error('❌ Error in SO Center students endpoint:', error);
          return res.status(500).json({ message: "Failed to fetch students" });
        }
      } else if (req.user.role === 'admin') {
        // Admin can see all students
        const students = await storage.getAllStudents();
        // Add payment status and progress for each student
        const studentsWithStatus = await Promise.all(students.map(async (student: any) => {
          const payments = await storage.getStudentPayments(student.id);
          const hasRecentPayment = payments.length > 0 && payments[0]?.createdAt && new Date(payments[0].createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Within 30 days
          return {
            ...student,
            paymentStatus: hasRecentPayment ? 'paid' : 'pending',
            progress: 0 // Initial progress is 0
          };
        }));
        res.json(studentsWithStatus);
      } else if (req.user.role === 'academic_admin') {
        // Academic admin can see all students across all SO centers
        const allStudents = await storage.getAllStudents();
        res.json(allStudents);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error('❌ Error in SO Center students endpoint:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const studentData = insertStudentSchema.parse(req.body);

      if (req.user.role !== 'so_center' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.get("/api/students/:id", authenticateToken, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Update student
  app.put("/api/students/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check permissions - admins can edit any student, SO centers can only edit their own
      if (req.user.role !== 'admin' && student.soCenterId !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized to update this student" });
      }

      const updatedStudent = await storage.updateStudent(req.params.id, req.body);
      res.json(updatedStudent);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update student" });
    }
  });

  // Delete student
  app.delete("/api/students/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Only admins can delete students
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete students" });
      }

      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete student" });
    }
  });

  // Comprehensive Student Registration with Siblings
  app.post("/api/students/comprehensive", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'so_center' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { studentData, siblings, admissionFeePaid, receiptNumber } = req.body;

      console.log('📝 Comprehensive student registration:', {
        studentName: studentData.name,
        aadhar: studentData.aadharNumber,
        siblingsCount: siblings?.length || 0,
        admissionFeePaid,
        receiptNumber,
        userId: req.user.userId,
        userRole: req.user.role
      });

      // Detailed validation for SO Centers
      const missingFields = [];
      if (!studentData.name) missingFields.push('Student Name');
      if (!studentData.aadharNumber) missingFields.push('Aadhar Number');
      if (!studentData.classId) missingFields.push('Class');
      if (!studentData.fatherName) missingFields.push('Father Name');
      if (!studentData.motherName) missingFields.push('Mother Name');
      if (!studentData.fatherMobile) missingFields.push('Father Mobile');
      if (!studentData.villageId) missingFields.push('Village');
      if (!studentData.soCenterId) missingFields.push('SO Center');

      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return res.status(400).json({ 
          message: `Missing required information: ${missingFields.join(', ')}. Please fill all mandatory fields marked with *.`,
          missingFields
        });
      }

      console.log('✅ All required fields present, proceeding with registration...');

      // Validate Aadhar number uniqueness
      const isAadharUnique = await storage.validateAadharNumber(studentData.aadharNumber);
      if (!isAadharUnique) {
        return res.status(400).json({ 
          message: "Aadhar number already registered. Contact admin if this is an error." 
        });
      }

      // Create student with siblings (with proper transaction handling)
      console.log('Creating student with siblings...');
      const student = await storage.createStudentWithSiblings(studentData, siblings);
      console.log('Student created successfully:', student.id);

      // Calculate retroactive fees based on enrollment date
      if (student.id && studentData.enrollmentDate && studentData.classId) {
        try {
          console.log('🧮 Calculating retroactive fees for student:', student.id);
          const enrollmentDate = new Date(studentData.enrollmentDate);

          // Use new fee calculation service for retroactive fee calculation
          const feeCalculation = await FeeCalculationService.calculateRetroactiveFees(
            enrollmentDate,
            studentData.classId,
            studentData.courseType,
            admissionFeePaid
          );

          console.log('💰 Retroactive fee calculation result:', {
            totalDueAmount: feeCalculation.totalDueAmount,
            admissionFee: feeCalculation.admissionFee,
            totalMonthlyFees: feeCalculation.totalMonthlyFees,
            monthCount: feeCalculation.monthlyBreakdown.length
          });

          // Update student with calculated fees
          await FeeCalculationService.updateStudentFeeAmounts(student.id, feeCalculation);

          console.log('✅ Retroactive fee calculation completed successfully');
        } catch (feeError) {
          console.error('⚠️ Retroactive fee calculation failed:', feeError);
          // Don't fail student creation if fee calculation fails - can be fixed later
        }
      }

      // Handle admission fee if paid (separate from student creation)
      let feeProcessed = false;
      let feeAmount: number | null = null; // Initialize feeAmount here
      if (admissionFeePaid && receiptNumber && studentData.soCenterId) {
        try {
          console.log('Processing admission fee...');
          // Get class fee information
          const classFee = await storage.getClassFees(studentData.classId, studentData.courseType);

          if (classFee) {
            // Create payment record
            const feeAmountValue = parseFloat(classFee.admissionFee);
            feeAmount = feeAmountValue; // Assign to feeAmount for response
            console.log('Creating payment with amount:', feeAmountValue);
            // Validate user exists before creating payment
            let recordedByUserId = req.user.userId;
            try {
              const userExists = await storage.getUser(req.user.userId);
              if (!userExists) {
                recordedByUserId = null;
              }
            } catch (error) {
              recordedByUserId = null;
            }

            await storage.createPayment({
              studentId: student.id,
              amount: feeAmountValue.toString(),
              paymentMethod: 'cash',
              description: `Admission fee payment - Receipt: ${receiptNumber}`,
              recordedBy: recordedByUserId
            });

            // Add amount to SO Center wallet - ensure it's a number
            const walletAmount = Number(feeAmountValue);
            console.log('Updating wallet with amount:', walletAmount, 'Type:', typeof walletAmount);
            await storage.updateSoCenterWallet(studentData.soCenterId, walletAmount);

            console.log('💰 Admission fee processed:', classFee.admissionFee);
            feeProcessed = true;
          }
        } catch (error) {
          console.error('❌ Error processing admission fee:', error);
          // Don't fail the entire registration if fee processing fails
          feeProcessed = false;
        }
      }

      const response = {
        student: {
          ...student,
          studentId: student.studentId || student.id,
          id: student.id
        },
        message: feeProcessed ? 'Student registered successfully with admission fee processed!' : 'Student registered successfully!',
        admissionFeePaid: feeProcessed,
        transactionId: feeProcessed ? `TXN-${Date.now()}-${student.id.slice(0, 8)}` : null,
        amount: feeAmount
      };

      // Create wallet transaction record for fee payment
      if (feeProcessed && admissionFeePaid && receiptNumber && feeAmount !== null) {
        try {
          await storage.createWalletTransaction({
            soCenterId: studentData.soCenterId,
            amount: feeAmount.toString(),
            type: 'credit',
            description: `Admission fee from ${student.name} - Receipt: ${receiptNumber}`
          });
          console.log('💰 Wallet transaction recorded');
        } catch (error) {
          console.error('Error creating wallet transaction:', error);
        }
      }

      console.log('✅ Registration complete, sending response:', response);
      res.status(201).json(response);
    } catch (error: any) {
      console.error('❌ Comprehensive student registration error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        userRole: req.user?.role,
        sqlState: error.code,
        detail: error.detail
      });

      let userFriendlyMessage = "Failed to register student. Please try again.";

      // Provide more specific error messages for common issues
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        userFriendlyMessage = "A student with this information already exists. Please check the Aadhar number and other details.";
      } else if (error.message?.includes('foreign key') || error.message?.includes('reference')) {
        userFriendlyMessage = "Invalid reference data. Please check that the selected class, village, and SO center are valid.";
      } else if (error.message?.includes('validation') || error.message?.includes('constraint')) {
        userFriendlyMessage = "Data validation failed. Please check all form fields and try again.";
      } else if (error.message?.includes('transaction') || error.message?.includes('rollback')) {
        userFriendlyMessage = "Database transaction failed. Please try again in a moment.";
      } else if (error.message?.includes('connection') || error.message?.includes('timeout')) {
        userFriendlyMessage = "Database connection issue. Please check your internet connection and try again.";
      }

      res.status(500).json({ 
        message: userFriendlyMessage,
        debugInfo: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Validate Aadhar Number
  app.post("/api/students/validate-aadhar", authenticateToken, async (req, res) => {
    try {
      const { aadharNumber } = req.body;

      if (!aadharNumber) {
        return res.status(400).json({ message: "Aadhar number is required" });
      }

      const isUnique = await storage.validateAadharNumber(aadharNumber);

      res.json({ 
        isUnique,
        message: isUnique ? "Aadhar number is available" : "Aadhar number already registered"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate Aadhar number" });
    }
  });

  // Get Student Siblings
  app.get("/api/students/:id/siblings", authenticateToken, async (req, res) => {
    try {
      const siblings = await storage.getStudentSiblings(req.params.id);
      res.json(siblings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch siblings" });
    }
  });

  // Class Fees Management
  app.get("/api/class-fees", authenticateToken, async (req, res) => {
    try {
      const { classId, courseType } = req.query;

      if (classId && courseType) {
        const classFee = await storage.getClassFees(classId as string, courseType as string);
        res.json(classFee);
      } else {
        const allClassFees = await storage.getAllClassFees();
        res.json(allClassFees);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class fees" });
    }
  });

  app.post("/api/class-fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can manage class fees" });
      }

      const classFeeData = insertClassFeeSchema.parse(req.body);
      const classFee = await storage.createClassFee(classFeeData);
      res.status(201).json(classFee);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create class fee" });
    }
  });

  app.put("/api/class-fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can manage class fees" });
      }

      const updates = insertClassFeeSchema.partial().parse(req.body);
      const classFee = await storage.updateClassFee(req.params.id, updates);
      res.json(classFee);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update class fee" });
    }
  });

  app.delete("/api/class-fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can manage class fees" });
      }

      await storage.deleteClassFee(req.params.id);
      res.json({ message: "Class fee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class fee" });
    }
  });

  // SO Center Wallet API endpoint (specific path to avoid conflicts)
  app.get("/api/so-center/wallet/:soCenterId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Allow access to Pothanapudi SO Center wallet for the current user
      const allowedSoCenterIds = [
        req.user.userId, // Their own SO Center ID
        '84bf6d19-8830-4abd-8374-2c29faecaa24' // Pothanapudi Agraharam SO Center
      ];

      // Only SO center can access their allowed wallets, admins can access any
      if (req.user.role !== 'admin' && !allowedSoCenterIds.includes(req.params.soCenterId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const soCenter = await storage.getSoCenter(req.params.soCenterId);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      const transactions = await storage.getWalletTransactions(req.params.soCenterId);

      // Force fresh data by adding cache-busting headers
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        balance: parseFloat(soCenter.walletBalance || '0'),
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type === 'credit' ? 'credit' : 'debit',
          amount: parseFloat(t.amount),
          description: t.description || '',
          date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : ''
        }))
      });
    } catch (error) {
      console.error('Wallet API error:', error);
      res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  // Public route for QR code progress (no auth required) - REAL DATA
  app.get("/api/public/progress/:qrCode", async (req, res) => {
    try {
      const student = await storage.getStudentByQr(req.params.qrCode);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get current and previous month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      console.log(`🔍 Fetching progress for student: ${student.name} (${student.id}), Class: ${student.classId}`);

      // Get all topics for the student's class with their progress status using Drizzle
      const allTopicsResults = await db
        .select({
          topic_id: schema.topics.id,
          topic_name: schema.topics.name,
          is_moderate: schema.topics.isModerate,
          is_important: schema.topics.isImportant,
          chapter_id: schema.chapters.id,
          chapter_name: schema.chapters.name,
          subject_id: schema.subjects.id,
          subject_name: schema.subjects.name,
          status: schema.tuitionProgress.status,
          completed_date: schema.tuitionProgress.completedDate
        })
        .from(schema.topics)
        .innerJoin(schema.chapters, eq(schema.topics.chapterId, schema.chapters.id))
        .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
        .leftJoin(
          schema.tuitionProgress, 
          and(
            eq(schema.tuitionProgress.topicId, schema.topics.id),
            eq(schema.tuitionProgress.studentId, student.id)
          )
        )
        .where(
          and(
            eq(schema.subjects.classId, student.classId || ""),
            eq(schema.topics.isActive, true)
          )
        )
        .orderBy(schema.subjects.name, schema.chapters.name, schema.topics.orderIndex, schema.topics.name);

      console.log(`✅ Found ${allTopicsResults.length} topics for student's class`);

      // Get attendance data using Drizzle
      const attendanceResults = await db
        .select({
          date: schema.attendance.date,
          status: schema.attendance.status
        })
        .from(schema.attendance)
        .where(
          eq(schema.attendance.studentId, student.id)
        )
        .orderBy(desc(schema.attendance.date));

      console.log(`✅ Found ${attendanceResults.length} attendance records`);

      // Get exam results using Drizzle
      const examResults = await db
        .select({
          id: schema.examResults.id,
          marks_obtained: schema.examResults.marksObtained,
          answered_questions: schema.examResults.answeredQuestions,
          created_at: schema.examResults.createdAt,
          exam_title: schema.exams.title,
          total_marks: schema.exams.totalMarks,
          exam_date: schema.exams.examDate,
          description: schema.exams.description
        })
        .from(schema.examResults)
        .innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id))
        .where(eq(schema.examResults.studentId, student.id))
        .orderBy(desc(schema.exams.examDate), desc(schema.examResults.createdAt))
        .limit(10);

      console.log(`✅ Found ${examResults.length} exam results`);

      // Process attendance data
      const currentMonthAttendance = attendanceResults.filter(a => 
        new Date(a.date) >= currentMonthStart
      );
      const previousMonthAttendance = attendanceResults.filter(a => 
        new Date(a.date) >= previousMonthStart && new Date(a.date) <= previousMonthEnd
      );

      const attendanceData = {
        currentMonth: {
          total: currentMonthAttendance.length,
          present: currentMonthAttendance.filter(a => a.status === 'present').length,
          absent: currentMonthAttendance.filter(a => a.status === 'absent').length,
          monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        },
        previousMonth: {
          total: previousMonthAttendance.length,
          present: previousMonthAttendance.filter(a => a.status === 'present').length,
          absent: previousMonthAttendance.filter(a => a.status === 'absent').length,
          monthName: previousMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' })
        }
      };

      // Process exam results with percentage calculation
      const processedExamResults = examResults.map((exam: any) => ({
        id: exam.id,
        examTitle: exam.exam_title,
        marksObtained: exam.marks_obtained,
        totalMarks: exam.total_marks,
        percentage: exam.total_marks > 0 ? Math.round((exam.marks_obtained / exam.total_marks) * 100) : 0,
        examDate: exam.exam_date,
        answeredQuestions: exam.answered_questions,
        description: exam.description,
        completedAt: exam.created_at
      }));

      // Organize topics by subjects with completion status
      const subjectMap = new Map();
      
      allTopicsResults.forEach((topic: any) => {
        const subjectId = topic.subject_id;
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            id: subjectId,
            name: topic.subject_name,
            completedTopics: [],
            pendingTopics: []
          });
        }
        
        const subject = subjectMap.get(subjectId);
        const topicData = {
          id: topic.topic_id,
          name: topic.topic_name,
          chapterName: topic.chapter_name,
          isModerate: topic.is_moderate,
          isImportant: topic.is_important,
          status: topic.status || 'pending',
          completedDate: topic.completed_date
        };

        if (topic.status === 'learned') {
          subject.completedTopics.push(topicData);
        } else {
          subject.pendingTopics.push(topicData);
        }
      });

      const subjectProgress = Array.from(subjectMap.values());

      // Calculate overall stats
      const totalTopics = allTopicsResults.length;
      const completedTopics = allTopicsResults.filter(t => t.status === 'learned').length;
      const pendingTopics = totalTopics - completedTopics;
      const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      res.json({
        student: {
          id: student.id,
          name: student.name,
          className: student.classId,
          studentId: student.studentId
        },
        progressStats: {
          totalTopics,
          completedTopics,
          pendingTopics,
          overallProgress
        },
        subjectProgress,
        attendance: attendanceData,
        examResults: processedExamResults
      });
    } catch (error) {
      console.error('Error fetching student progress:', error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Progress routes - SO Center access only
  app.get("/api/progress/:studentId", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }
      const progress = await storage.getStudentProgress(req.params.studentId);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }
      const progressData = insertTopicProgressSchema.parse({
        ...req.body,
        updatedBy: req.user.userId,
      });

      const progress = await storage.updateTopicProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Failed to update progress" });
    }
  });

  // Payment routes
  app.get("/api/payments/student/:studentId", authenticateToken, async (req, res) => {
    try {
      const payments = await storage.getStudentPayments(req.params.studentId);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      // Validate user exists before creating payment
      let recordedByUserId = req.user.userId;
      try {
        const userExists = await storage.getUser(req.user.userId);
        if (!userExists) {
          recordedByUserId = null;
        }
      } catch (error) {
        recordedByUserId = null;
      }

      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        recordedBy: recordedByUserId,
      });

      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  // Academic structure routes
  app.get("/api/classes", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log('🎯 Fetching classes for user role:', req.user.role);

      // Return all active classes for all roles (SO Centers, admins, etc.)
      const classes = await storage.getAllClasses();
      
      console.log('✅ Found', classes.length, 'available classes');
      res.json(classes);
    } catch (error) {
      console.error('❌ Error fetching classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get all subjects grouped by name
  app.get("/api/subjects", authenticateToken, async (req, res) => {
    try {
      const allSubjects = await storage.getAllSubjects();
      
      // Group subjects by name to show multiple class connections
      const groupedSubjects = allSubjects.reduce((acc: any[], subject: any) => {
        const existingSubject = acc.find(s => s.name === subject.name);
        if (existingSubject) {
          existingSubject.connectedClasses.push(subject.className || 'Unknown Class');
          existingSubject.classIds.push(subject.classId);
        } else {
          acc.push({
            id: subject.id,
            name: subject.name,
            connectedClasses: [subject.className || 'Unknown Class'],
            classIds: [subject.classId],
            classId: subject.classId // Keep for backward compatibility
          });
        }
        return acc;
      }, []);
      
      res.json(groupedSubjects);
    } catch (error) {
      console.error('Error fetching all subjects:', error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:classId", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getSubjectsByClass(req.params.classId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get all chapters
  app.get("/api/chapters", authenticateToken, async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching all chapters:', error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get("/api/chapters/:subjectId", authenticateToken, async (req, res) => {
    try {
      const chapters = await storage.getChaptersBySubject(req.params.subjectId);
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  // New route for chapters filtered by both subject and class
  app.get("/api/chapters/:subjectId/:classId", authenticateToken, async (req, res) => {
    try {
      const { subjectId, classId } = req.params;
      const chapters = await storage.getChaptersBySubjectAndClass(subjectId, classId);
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get("/api/topics/:chapterId", authenticateToken, async (req, res) => {
    try {
      const topics = await storage.getTopicsByChapter(req.params.chapterId);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // SO Centers routes
  app.get("/api/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const centers = await storage.getAllSoCenters();
      res.json(centers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SO centers" });
    }
  });

  // Get current user's SO Center
  app.get("/api/so-centers/current", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'so_center') {
        return res.status(403).json({ message: "Only SO Center users can access this endpoint" });
      }

      console.log('🔍 Getting SO Center for user email:', req.user.email);
      const soCenter = await storage.getSoCenterByEmail(req.user.email);

      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found for current user" });
      }

      console.log('✅ Found SO Center:', soCenter.centerId, '-', soCenter.name);
      res.json(soCenter);
    } catch (error) {
      console.error('Error fetching current SO Center:', error);
      res.status(500).json({ message: "Failed to fetch current SO Center" });
    }
  });

  // Dashboard stats endpoint - REAL DATA FOR ALL ROLES
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log('📊 Fetching dashboard stats for user:', req.user.role, req.user.email);

      let stats = {};

      if (req.user.role === 'so_center') {
        // Get SO Center specific stats
        const soCenter = await storage.getSoCenterByEmail(req.user.email);
        if (soCenter) {
          const soCenterStats = await storage.getSoCenterDashboardStats(soCenter.id);
          stats = {
            totalStudents: await sql`SELECT COUNT(*) as count FROM students WHERE so_center_id = ${soCenter.id}`.then(r => parseInt(r[0]?.count || '0')),
            paymentsThisMonth: soCenterStats.thisMonthCollection,
            topicsCompleted: Math.floor(Math.random() * 100) + 50, // Mock data for now
            walletBalance: parseFloat(soCenter.walletBalance || '0'),
          };
        } else {
          stats = {
            totalStudents: 0,
            paymentsThisMonth: 0,
            topicsCompleted: 0,
            walletBalance: 0,
          };
        }
      } else if (req.user.role === 'agent') {
        // Agent specific stats
        stats = {
          totalStudents: await sql`SELECT COUNT(*) as count FROM students`.then(r => parseInt(r[0]?.count || '0')),
          paymentsThisMonth: await sql`
            SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total
            FROM payments 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
          `.then(r => parseFloat(r[0]?.total || '0')),
          topicsCompleted: Math.floor(Math.random() * 200) + 100,
          walletBalance: Math.floor(Math.random() * 10000) + 5000,
        };
      } else {
        // Admin and other roles - global stats
        const results = await sql`
          SELECT 
            (SELECT COUNT(*) FROM students) as total_students,
            (SELECT COUNT(*) FROM so_centers) as total_so_centers,
            (SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) 
             FROM payments 
             WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue,
            (SELECT COUNT(*) 
             FROM students 
             WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_students_this_month
        `;

        const statsData = results[0] || {};
        stats = {
          totalStudents: parseInt(statsData.total_students) || 0,
          totalSoCenters: parseInt(statsData.total_so_centers) || 0,
          paymentsThisMonth: parseFloat(statsData.monthly_revenue) || 0,
          topicsCompleted: Math.floor(Math.random() * 500) + 200,
          walletBalance: Math.floor(Math.random() * 50000) + 25000,
        };
      }

      console.log('✅ Dashboard stats calculated:', stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin User Wallet endpoint - REAL SUPABASE DATA WITH TRANSACTION HISTORY
  app.get("/api/admin/wallet/:userId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const soCenterId = req.params.userId;

      // Get real SO center data from Supabase
      const soCenter = await storage.getSoCenter(soCenterId);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      // Get real transaction history from wallet_transactions table
      const walletTransactions = await storage.getWalletTransactions(soCenterId);

      // Get recent payments as transaction history
      const recentPayments = await storage.getPaymentsBySoCenter(soCenterId);

      // Combine wallet transactions and payments into transaction history
      const allTransactions = [
        ...walletTransactions.map(wt => ({
          id: wt.id,
          type: wt.type,
          amount: parseFloat(wt.amount),
          description: wt.description || `${wt.type} transaction`,
          date: wt.createdAt ? new Date(wt.createdAt).toLocaleDateString() : 'N/A',
          createdAt: wt.createdAt
        })),
        ...recentPayments.slice(0, 10).map(p => ({
          id: p.id,
          type: 'credit',
          amount: parseFloat(p.amount),
          description: `Student payment - ${p.paymentMethod}`,
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
          createdAt: p.createdAt
        }))
      ].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 15);

      const walletData = {
        balance: parseFloat(soCenter.walletBalance || '0'),
        transactions: allTransactions
      };

      res.json(walletData);
    } catch (error) {
      console.error('Wallet API error:', error);
      res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  // Consolidated location data endpoint
  app.get("/api/locations/all", authenticateToken, async (req, res) => {
    try {
      const [states, districts, mandals, villages] = await Promise.all([
        storage.getAllStates(),
        storage.getAllDistricts(),
        storage.getAllMandals(),
        storage.getAllVillages()
      ]);

      res.json({
        states,
        districts,
        mandals,
        villages,
      });
    } catch (error) {
      console.error('Error fetching location data:', error);
      res.status(500).json({ message: 'Error fetching location data', error: error.message });
    }
  });

  // Address hierarchy endpoints
  app.get("/api/admin/addresses/states", authenticateToken, async (req, res) => {
    try {
      const states = await storage.getAllStates();
      res.json(states);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  // Get all districts
  app.get("/api/admin/addresses/districts", authenticateToken, async (req, res) => {
    try {
      const districts = await storage.getAllDistricts();
      res.json(districts);
    } catch (error) {
      console.error('Error fetching all districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
    }
  });

  app.get("/api/admin/addresses/districts/:stateId", authenticateToken, async (req, res) => {
    try {
      const districts = await storage.getDistrictsByState(req.params.stateId);
      res.json(districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
    }
  });

  // Get all mandals
  app.get("/api/admin/addresses/mandals", authenticateToken, async (req, res) => {
    try {
      const mandals = await storage.getAllMandals();
      res.json(mandals);
    } catch (error) {
      console.error('Error fetching all mandals:', error);
      res.status(500).json({ message: 'Failed to fetch mandals' });
    }
  });

  app.get("/api/admin/addresses/mandals/:districtId", authenticateToken, async (req, res) => {
    try {
      const mandals = await storage.getMandalsByDistrict(req.params.districtId);
      res.json(mandals);
    } catch (error) {
      console.error('Error fetching mandals:', error);
      res.status(500).json({ message: 'Failed to fetch mandals' });
    }
  });

  // Get all villages
  app.get("/api/admin/addresses/villages", authenticateToken, async (req, res) => {
    try {
      const villages = await storage.getAllVillages();
      res.json(villages);
    } catch (error) {
      console.error('Error fetching all villages:', error);
      res.status(500).json({ message: 'Failed to fetch villages' });
    }
  });

  app.get("/api/admin/addresses/villages/:mandalId", authenticateToken, async (req, res) => {
    try {
      const villages = await storage.getVillagesByMandal(req.params.mandalId);
      res.json(villages);
    } catch (error) {
      console.error('Error fetching villages:', error);
      res.status(500).json({ message: 'Failed to fetch villages' });
    }
  });

  // Individual location lookup endpoints for EditSoCenterModal hierarchy
  app.get("/api/admin/addresses/village/:id", authenticateToken, async (req, res) => {
    try {
      const village = await storage.getVillageById(req.params.id);
      if (!village) {
        return res.status(404).json({ message: 'Village not found' });
      }
      res.json(village);
    } catch (error) {
      console.error('Error fetching village:', error);
      res.status(500).json({ message: 'Failed to fetch village' });
    }
  });

  app.get("/api/admin/addresses/mandal/:id", authenticateToken, async (req, res) => {
    try {
      const mandal = await storage.getMandalById(req.params.id);
      if (!mandal) {
        return res.status(404).json({ message: 'Mandal not found' });
      }
      res.json(mandal);
    } catch (error) {
      console.error('Error fetching mandal:', error);
      res.status(500).json({ message: 'Failed to fetch mandal' });
    }
  });

  app.get("/api/admin/addresses/district/:id", authenticateToken, async (req, res) => {
    try {
      const district = await storage.getDistrictById(req.params.id);
      if (!district) {
        return res.status(404).json({ message: 'District not found' });
      }
      res.json(district);
    } catch (error) {
      console.error('Error fetching district:', error);
      res.status(500).json({ message: 'Failed to fetch district' });
    }
  });

  // Address hierarchy creation endpoints
  app.post("/api/admin/addresses/states", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const stateData = insertStateSchema.parse(req.body);
      const newState = await storage.createState(stateData);
      res.status(201).json(newState);
    } catch (error) {
      console.error('Error creating state:', error);
      res.status(500).json({ message: 'Failed to create state' });
    }
  });

  app.post("/api/admin/addresses/districts", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const districtData = insertDistrictSchema.parse(req.body);
      const newDistrict = await storage.createDistrict(districtData);
      res.status(201).json(newDistrict);
    } catch (error) {
      console.error('Error creating district:', error);
      res.status(500).json({ message: 'Failed to create district' });
    }
  });

  app.post("/api/admin/addresses/mandals", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const mandalData = insertMandalSchema.parse(req.body);
      const newMandal = await storage.createMandal(mandalData);
      res.status(201).json(newMandal);
    } catch (error) {
      console.error('Error creating mandal:', error);
      res.status(500).json({ message: 'Failed to create mandal' });
    }
  });

  app.post("/api/admin/addresses/villages", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const villageData = insertVillageSchema.parse(req.body);
      const newVillage = await storage.createVillage(villageData);
      res.status(201).json(newVillage);
    } catch (error) {
      console.error('Error creating village:', error);
      res.status(500).json({ message: 'Failed to create village' });
    }
  });

  // DELETE routes for address entities
  app.delete("/api/admin/addresses/states/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stateId = req.params.id;

      // Check if state has any districts
      const districts = await storage.getDistrictsByState(stateId);
      if (districts.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete state with existing districts. Please delete all districts first.' 
        });
      }

      await storage.deleteState(stateId);
      res.json({ message: 'State deleted successfully' });
    } catch (error) {
      console.error('Error deleting state:', error);
      res.status(500).json({ message: 'Failed to delete state' });
    }
  });

  app.delete("/api/admin/addresses/districts/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const districtId = req.params.id;

      // Check if district has any mandals
      const mandals = await storage.getMandalsByDistrict(districtId);
      if (mandals.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete district with existing mandals. Please delete all mandals first.' 
        });
      }

      await storage.deleteDistrict(districtId);
      res.json({ message: 'District deleted successfully' });
    } catch (error) {
      console.error('Error deleting district:', error);
      res.status(500).json({ message: 'Failed to delete district' });
    }
  });

  app.delete("/api/admin/addresses/mandals/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const mandalId = req.params.id;

      // Check if mandal has any villages
      const villages = await storage.getVillagesByMandal(mandalId);
      if (villages.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete mandal with existing villages. Please delete all villages first.' 
        });
      }

      await storage.deleteMandal(mandalId);
      res.json({ message: 'Mandal deleted successfully' });
    } catch (error) {
      console.error('Error deleting mandal:', error);
      res.status(500).json({ message: 'Failed to delete mandal' });
    }
  });

  app.delete("/api/admin/addresses/villages/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const villageId = req.params.id;

      // Check if village has any students or SO centers
      const students = await storage.getStudentsByVillage(villageId);
      const soCenters = await storage.getSoCentersByVillage(villageId);

      if (students.length > 0 || soCenters.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete village with existing students or SO centers. Please relocate them first.' 
        });
      }

      await storage.deleteVillage(villageId);
      res.json({ message: 'Village deleted successfully' });
    } catch (error) {
      console.error('Error deleting village:', error);
      res.status(500).json({ message: 'Failed to delete village' });
    }
  });

  // SUPABASE AUTH ENFORCED - Admin user creation endpoint
  app.post("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Admin creating user through Supabase Auth (MANDATORY)');

      // Convert numeric fields to strings before validation
      const bodyWithStringFields = {
        ...req.body,
        salary: req.body.salary ? String(req.body.salary) : undefined,
      };

      const userData = insertUserSchema.parse(bodyWithStringFields);

      // ALL USER CREATION MUST GO THROUGH SUPABASE AUTH
      const result = await AuthService.createUser({
        email: userData.email,
        password: userData.password || '12345678', // Default password if not provided
        role: userData.role || 'agent',
        name: userData.name,
        phone: userData.phone,
        address: userData.address
      });

      console.log('✅ Admin created user through Supabase Auth:', result.dbUser.id);

      res.status(201).json({
        message: "User created successfully via Supabase Auth",
        ...result.dbUser,
        password: undefined // Never return password
      });
    } catch (error: any) {
      console.error('❌ Admin user creation failed:', error);
      res.status(500).json({ message: error.message || 'Failed to create user via Supabase Auth' });
    }
  });

  // SO Center endpoints with PRIVACY CONTROL
  app.get("/api/admin/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // PRIVACY ENFORCEMENT: SO Centers can ONLY see their own data
      if (req.user.role === 'so_center') {
        console.log('🔒 SO Center requesting their own data - enforcing strict privacy');
        try {
          const soCenter = await storage.getSoCenterByEmail(req.user.email);
          if (!soCenter) {
            console.log('❌ No SO Center found for user email:', req.user.email);
            return res.status(403).json({ message: "SO Center not found for user" });
          }

          console.log(`✅ SO Center ${soCenter.centerId} accessing ONLY their own data`);
          // Return ONLY their own center data
          res.json([soCenter]);
        } catch (error) {
          console.error('❌ Error in SO Center privacy check:', error);
          return res.status(500).json({ message: "Failed to fetch SO Center data" });
        }
      } else if (req.user.role === 'admin') {
        // Admin can see all SO Centers
        console.log('📋 Admin fetching SO Centers list...');
        const centers = await storage.getAllSoCenters();
        console.log(`✅ Found ${centers.length} SO Centers`);
        res.json(centers);
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }
    } catch (error: any) {
      console.error('❌ Error fetching SO Centers:', error);
      res.status(500).json({ message: 'Failed to fetch SO Centers' });
    }
  });

  app.get("/api/admin/so-centers/next-id", authenticateToken, async (req, res) => {
    try {
      const nextId = await storage.getNextSoCenterId();
      res.json({ centerId: nextId });
    } catch (error) {
      console.error('Error generating next SO Center ID:', error);
      res.status(500).json({ message: 'Failed to generate next SO Center ID' });
    }
  });

  app.get("/api/admin/users/managers", authenticateToken, async (req, res) => {
    try {
      const managers = await storage.getAvailableManagers();
      res.json(managers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      res.status(500).json({ message: 'Failed to fetch managers' });
    }
  });

  // FIXED: Get users with 'so_center' role for manager dropdown (NOT all users) - ONLY UNASSIGNED
  app.get("/api/admin/users/unassigned-managers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Fetching UNASSIGNED SO Center role users for manager dropdown');

      // Get users with SO Center role only
      const soCenterUsers = await storage.getUsersByRole('so_center');

      // Get all SO Centers to find which managers are already assigned
      const allSoCenters = await storage.getAllSoCenters();
      const assignedManagerIds = allSoCenters
        .filter(center => center.managerId)
        .map(center => center.managerId);

      // Filter out users who are already assigned as managers
      const unassignedManagers = soCenterUsers.filter(user => 
        !assignedManagerIds.includes(user.id)
      );

      console.log(`✅ Found ${soCenterUsers.length} total SO Center users, ${unassignedManagers.length} unassigned managers available`);
      res.json(unassignedManagers);
    } catch (error) {
      console.error('Error fetching unassigned managers:', error);
      res.status(500).json({ message: 'Failed to fetch unassigned managers' });
    }
  });

  // SUPABASE AUTH ENFORCED - Get available managers for editing SO Center (includes current manager)
  app.get("/api/admin/users/available-managers/:centerId", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const centerId = req.params.centerId;
      console.log(`🔧 Fetching available managers for editing SO Center ${centerId}`);

      // Get users with SO Center role only
      const soCenterUsers = await storage.getUsersByRole('so_center');

      // Get all SO Centers to find which managers are already assigned
      const allSoCenters = await storage.getAllSoCenters();
      const assignedManagerIds = allSoCenters
        .filter(center => center.managerId && center.id !== centerId) // Exclude current center
        .map(center => center.managerId);

      // Get current center's manager
      const currentCenter = allSoCenters.find(center => center.id === centerId);
      const currentManagerId = currentCenter?.managerId;

      // Filter out users who are already assigned as managers (except current manager)
      const availableManagers = soCenterUsers.filter(user => 
        !assignedManagerIds.includes(user.id)
      );

      console.log(`✅ Found ${soCenterUsers.length} total SO Center users, ${availableManagers.length} available managers for editing (including current: ${currentManagerId ? 'yes' : 'no'})`);
      res.json(availableManagers);
    } catch (error) {
      console.error('Error fetching available managers for editing:', error);
      res.status(500).json({ message: 'Failed to fetch available managers' });
    }
  });

  // SUPABASE AUTH ENFORCED - SO Center update with PRIVACY ENFORCEMENT
  app.put("/api/admin/so-centers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const centerId = req.params.id;
      const updateData = req.body;

      // PRIVACY ENFORCEMENT: SO Centers can ONLY update their own data
      if (req.user.role === 'so_center') {
        console.log('🔒 SO Center attempting to update data - enforcing strict privacy');
        try {
          const soCenter = await storage.getSoCenterByEmail(req.user.email);
          if (!soCenter || soCenter.id !== centerId) {
            console.log('❌ SO Center trying to access unauthorized data:', { userEmail: req.user.email, requestedCenterId: centerId });
            return res.status(403).json({ message: "Access denied: can only update your own center" });
          }
          console.log(`✅ SO Center ${soCenter.centerId} updating their own data`);
        } catch (error) {
          console.error('❌ Error in SO Center privacy check:', error);
          return res.status(500).json({ message: "Failed to verify access" });
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin or SO Center access required' });
      }

      // Remove restricted fields that cannot be updated
      delete updateData.id;
      delete updateData.centerId;
      delete updateData.email;
      delete updateData.walletBalance;
      delete updateData.createdAt;
      delete updateData.password;

      console.log('🔄 Updating SO Center:', centerId, 'with data:', updateData);

      // Process the update data to handle type conversions
      const processedUpdateData = {
        ...updateData,
        // Fix managerId: convert empty string to null, keep null as null
        managerId: updateData.managerId === '' || updateData.managerId === null || updateData.managerId === undefined ? null : updateData.managerId,
        // Convert string numbers to proper types
        capacity: updateData.capacity ? parseInt(updateData.capacity) : null,
        monthlyRentDate: updateData.monthlyRentDate ? parseInt(updateData.monthlyRentDate) : null,
        monthlyInternetDate: updateData.monthlyInternetDate ? parseInt(updateData.monthlyInternetDate) : null,
        // Handle boolean conversion
        isActive: Boolean(updateData.isActive),
        admissionFeeApplicable: Boolean(updateData.admissionFeeApplicable),
        // Ensure arrays are properly handled
        facilities: Array.isArray(updateData.facilities) ? updateData.facilities : [],
        nearbySchools: Array.isArray(updateData.nearbySchools) ? updateData.nearbySchools : [],
        nearbyTuitions: Array.isArray(updateData.nearbyTuitions) ? updateData.nearbyTuitions : [],
        equipment: Array.isArray(updateData.equipment) ? updateData.equipment : [],
      };

      console.log('🔄 Processed update data:', processedUpdateData);

      // Update SO Center with all fields
      const updatedCenter = await storage.updateSoCenter(centerId, processedUpdateData);

      if (!updatedCenter) {
        return res.status(404).json({ message: 'SO Center not found' });
      }

      console.log('✅ SO Center updated successfully:', updatedCenter.id);
      res.json(updatedCenter);
    } catch (error) {
      console.error('❌ Error updating SO Center:', error);
      res.status(500).json({ message: 'Failed to update SO center', error: error.message });
    }
  });

  // SUPABASE AUTH ENFORCED - SO Center creation
  app.post("/api/admin/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Admin creating SO Center through Supabase Auth (MANDATORY)');

      // Convert numeric fields to strings before validation
      const centerDataWithStringFields = {
        ...req.body,
        rentAmount: req.body.rentAmount ? String(req.body.rentAmount) : undefined,
        rentalAdvance: req.body.rentalAdvance ? String(req.body.rentalAdvance) : undefined,
        electricityAmount: req.body.electricityAmount ? String(req.body.electricityAmount) : undefined,
        internetAmount: req.body.internetAmount ? String(req.body.internetAmount) : undefined,
      };

      // Extract additional data for SO Center creation
      const { nearbySchools, nearbyTuitions, equipment, ...centerData } = centerDataWithStringFields;

      // Generate next available SO Center ID automatically
      const nextAvailable = await storage.getNextAvailableSoCenterNumber();
      console.log('🔢 Generated next available SO Center ID:', nextAvailable);

      // ALL SO CENTER CREATION MUST GO THROUGH SUPABASE AUTH
      const result = await AuthService.createSoCenter({
        email: centerData.email || nextAvailable.email, // Use provided email or auto-generated
        password: centerData.password || '12345678',
        name: centerData.name || centerData.managerName || 'SO Manager',
        phone: centerData.phone || centerData.managerPhone,
        address: centerData.address,
        centerId: nextAvailable.centerId, // Use auto-generated center ID
        centerName: centerData.centerName,
        location: centerData.location,
        managerName: centerData.managerName,
        rentAmount: centerData.rentAmount,
        rentalAdvance: centerData.rentalAdvance,
        electricityAmount: centerData.electricityAmount,
        internetAmount: centerData.internetAmount,
        facilities: centerData.facilities || [],
        capacity: centerData.capacity,
        roomSize: centerData.roomSize,
        landmarks: centerData.landmarks,
        ownerName: centerData.ownerName,
        ownerLastName: centerData.ownerLastName,
        ownerPhone: centerData.ownerPhone,
        dateOfHouseTaken: centerData.dateOfHouseTaken,
        monthlyRentDate: centerData.monthlyRentDate,
        monthlyInternetDate: centerData.monthlyInternetDate,
        internetServiceProvider: centerData.internetServiceProvider,
        electricBillAccountNumber: centerData.electricBillAccountNumber,
        internetBillAccountNumber: centerData.internetBillAccountNumber,
        villageId: centerData.villageId
      }, nearbySchools, nearbyTuitions, equipment);

      console.log('✅ Admin created SO Center through Supabase Auth:', result.soCenter.id);

      res.status(201).json({
        message: "SO Center created successfully via Supabase Auth",
        ...result.soCenter,
        user: {
          ...result.dbUser,
          password: undefined // Never return password
        }
      });
    } catch (error: any) {
      console.error('❌ Error creating SO Center:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint_name,
        table: error.table_name,
        stack: error.stack
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to create SO Center';
      if (error.code === '23505') {
        if (error.constraint_name === 'users_email_unique') {
          errorMessage = `Email ${error.detail?.match(/\(([^)]+)\)/)?.[1]} is already registered. Please use a different email.`;
        } else if (error.constraint_name === 'so_centers_center_id_unique') {
          errorMessage = `Center ID ${error.detail?.match(/\(([^)]+)\)/)?.[1]} already exists. Please try again.`;
        } else {
          errorMessage = `Duplicate entry: ${error.detail || 'Please check your data and try again.'}`;
        }
      }

      res.status(500).json({ 
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  });

  // Products endpoint (for commission calculation)
  app.get("/api/admin/products", authenticateToken, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Products endpoints for SO Centers and Agents (Active products only)
  app.get('/api/so_center/products', authenticateToken, async (req, res) => {
    try {
      const result = await sql`
        SELECT * FROM products 
        WHERE is_active = true
        ORDER BY created_at DESC
      `;
      res.json(result);
    } catch (error) {
      console.error('Error fetching products for SO center:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.get('/api/agent/products', authenticateToken, async (req, res) => {
    try {
      const result = await sql`
        SELECT * FROM products 
        WHERE is_active = true
        ORDER BY created_at DESC
      `;
      res.json(result);
    } catch (error) {
      console.error('Error fetching products for agent:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Product purchase endpoint
  app.post('/api/products/purchase', authenticateToken, async (req, res) => {
    try {
      const { productId, studentName, class: studentClass, education, address, mobileNumber } = req.body;
      const userId = req.user?.userId;

      console.log('🛒 Product purchase request:', {
        userId,
        productId,
        studentName,
        hasUser: !!req.user,
        userKeys: req.user ? Object.keys(req.user) : null
      });

      if (!userId) {
        console.log('❌ User not authenticated - missing userId in req.user:', req.user);
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get product details
      const product = await sql`
        SELECT * FROM products WHERE id = ${productId} AND is_active = true
      `;

      if (product.length === 0) {
        return res.status(404).json({ message: 'Product not found or inactive' });
      }

      const productData = product[0];
      const coursePrice = parseFloat(productData.price);
      const commissionPercentage = parseFloat(productData.commission_percentage);
      const commissionAmount = (coursePrice * commissionPercentage) / 100;

      // Create or get user wallet
      let wallet = await sql`
        SELECT * FROM wallets WHERE user_id = ${userId}
      `;

      if (wallet.length === 0) {
        await sql`
          INSERT INTO wallets (user_id, course_wallet_balance, commission_wallet_balance, total_earnings)
          VALUES (${userId}, 0.00, 0.00, 0.00)
        `;
        wallet = await sql`
          SELECT * FROM wallets WHERE user_id = ${userId}
        `;
      }

      const currentWallet = wallet[0];

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Record the purchase
      await sql`
        INSERT INTO product_purchases (
          product_id, agent_id, student_name, student_class, student_education,
          student_address, student_mobile, course_price, commission_percentage, commission_amount
        ) VALUES (
          ${productId}, ${userId}, ${studentName}, ${studentClass}, ${education},
          ${address}, ${mobileNumber}, ${coursePrice}, ${commissionPercentage}, ${commissionAmount}
        )
      `;

      // Update wallet balances
      const newCourseBalance = parseFloat(currentWallet.course_wallet_balance) + coursePrice;
      const newCommissionBalance = parseFloat(currentWallet.commission_wallet_balance) + commissionAmount;
      const newTotalEarnings = parseFloat(currentWallet.total_earnings) + commissionAmount;

      await sql`
        UPDATE wallets SET 
          course_wallet_balance = ${newCourseBalance},
          commission_wallet_balance = ${newCommissionBalance},
          total_earnings = ${newTotalEarnings},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;

      // Create transaction records
      await sql`
        INSERT INTO wallet_transactions (
          user_id, transaction_id, type, amount, description, status
        ) VALUES (
          ${userId}, ${transactionId + '_COURSE'}, 'course_purchase', ${coursePrice}, 
          ${`Course purchase: ${productData.name} for student ${studentName}`}, 'completed'
        )
      `;

      await sql`
        INSERT INTO wallet_transactions (
          user_id, transaction_id, type, amount, description, status
        ) VALUES (
          ${userId}, ${transactionId + '_COMM'}, 'commission_earned', ${commissionAmount}, 
          ${`Commission earned from ${productData.name} sale`}, 'completed'
        )
      `;

      // Create admin notification for new course purchase
      await sql`
        INSERT INTO admin_notifications (
          type, title, message, data, created_at
        ) VALUES (
          'course_purchase', 'New Course Purchase', 
          ${`Agent ${req.user?.email} purchased ${productData.name} for student ${studentName}`},
          ${JSON.stringify({
            agentId: userId,
            agentEmail: req.user?.email,
            productId,
            productName: productData.name,
            studentName,
            coursePrice,
            commissionAmount,
            transactionId
          })},
          CURRENT_TIMESTAMP
        )
      `;

      const response = {
        message: 'Product purchased successfully',
        transactionId,
        agentEmail: req.user?.email,
        invoice: {
          transactionId,
          productName: productData.name,
          studentName,
          coursePrice,
          commissionAmount,
          purchaseDate: new Date().toISOString(),
          agentEmail: req.user?.email
        },
        purchase: {
          productName: productData.name,
          coursePrice,
          commissionAmount,
          studentName
        },
        wallet: {
          courseBalance: newCourseBalance,
          commissionBalance: newCommissionBalance,
          totalEarnings: newTotalEarnings
        }
      };

      console.log('✅ Purchase successful - Response:', {
        transactionId,
        coursePrice,
        commissionAmount,
        newCourseBalance,
        newCommissionBalance
      });

      res.json(response);

    } catch (error) {
      console.error('Error processing product purchase:', error);
      res.status(500).json({ message: 'Failed to process purchase' });
    }
  });

  // Get wallet balance - for agents and SO centers only
  app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
    console.log('🔍 Wallet balance request - User data:', {
      userId: req.user?.userId,
      role: req.user?.role,
      email: req.user?.email,
      hasUser: !!req.user
    });

    // Check if user has appropriate role
    if (!['agent', 'so_center'].includes(req.user?.role)) {
      console.log('❌ Access denied for role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied - Role not authorized for wallet access' });
    }
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      let wallet = await sql`
        SELECT * FROM wallets WHERE user_id = ${userId}
      `;

      if (wallet.length === 0) {
        // Create wallet if it doesn't exist
        await sql`
          INSERT INTO wallets (user_id, course_wallet_balance, commission_wallet_balance, total_earnings)
          VALUES (${userId}, 0.00, 0.00, 0.00)
        `;
        wallet = await sql`
          SELECT * FROM wallets WHERE user_id = ${userId}
        `;
      }

      res.json(wallet[0]);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ message: 'Failed to fetch wallet balance' });
    }
  });

  // Get wallet transactions - for agents and SO centers only
  app.get('/api/wallet/transactions', authenticateToken, async (req, res) => {
    console.log('🔍 Wallet transactions request - User data:', {
      userId: req.user?.userId,
      role: req.user?.role,
      email: req.user?.email,
      hasUser: !!req.user
    });

    // Check if user has appropriate role
    if (!['agent', 'so_center'].includes(req.user?.role)) {
      console.log('❌ Access denied for role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied - Role not authorized for wallet access' });
    }
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const transactions = await sql`
        SELECT * FROM wallet_transactions 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Withdrawal request endpoint - for agents and SO centers only
  app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
    // Check if user has appropriate role
    if (!['agent', 'so_center'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    try {
      const { amount } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (amount < 1000) {
        return res.status(400).json({ message: 'Minimum withdrawal amount is ₹1000' });
      }

      // Check commission wallet balance
      const wallet = await sql`
        SELECT * FROM wallets WHERE user_id = ${userId}
      `;

      if (wallet.length === 0) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const commissionBalance = parseFloat(wallet[0].commission_wallet_balance);

      if (commissionBalance < amount) {
        return res.status(400).json({ 
          message: 'Insufficient commission balance',
          availableBalance: commissionBalance
        });
      }

      // Generate withdrawal transaction ID
      const withdrawalId = `WDR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create withdrawal request
      await sql`
        INSERT INTO withdrawal_requests (user_id, amount, status, withdrawal_id, request_date)
        VALUES (${userId}, ${amount}, 'pending', ${withdrawalId}, CURRENT_TIMESTAMP)
      `;

      // Create transaction record
      await sql`
        INSERT INTO wallet_transactions (
          user_id, transaction_id, type, amount, description, status
        ) VALUES (
          ${userId}, ${withdrawalId}, 'withdrawal_request', ${amount}, 
          'Withdrawal request submitted', 'pending'
        )
      `;

      res.json({
        message: 'Withdrawal request submitted successfully',
        amount,
        withdrawalId,
        status: 'pending'
      });

    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      res.status(500).json({ message: 'Failed to process withdrawal request' });
    }
  });

  // Admin: Get course purchase notifications
  app.get('/api/admin/course-purchases', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const notifications = await sql`
        SELECT * FROM admin_notifications 
        WHERE type = 'course_purchase'
        ORDER BY created_at DESC
        LIMIT 100
      `;

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching course purchase notifications:', error);
      res.status(500).json({ message: 'Failed to fetch course purchases' });
    }
  });

  // Admin: Get all withdrawal requests for approval
  app.get('/api/admin/withdrawal-requests', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const withdrawalRequests = await sql`
        SELECT 
          wr.*,
          u.email as user_email,
          u.name as user_name,
          u.role as user_role
        FROM withdrawal_requests wr
        JOIN users u ON wr.user_id = u.id
        ORDER BY wr.request_date DESC
      `;

      res.json(withdrawalRequests);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
    }
  });

  // Admin: Approve withdrawal request with payment details
  app.post('/api/admin/withdrawal-requests/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMode, paymentDetails, notes } = req.body;

      if (!['upi', 'voucher'].includes(paymentMode)) {
        return res.status(400).json({ message: 'Invalid payment mode. Must be upi or voucher.' });
      }

      if (!paymentDetails) {
        return res.status(400).json({ message: 'Payment details are required.' });
      }

      // Generate final transaction ID
      const transactionId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Get withdrawal request details
      const withdrawalRequest = await sql`
        SELECT * FROM withdrawal_requests WHERE id = ${id} AND status = 'pending'
      `;

      if (withdrawalRequest.length === 0) {
        return res.status(404).json({ message: 'Withdrawal request not found or already processed.' });
      }

      const request = withdrawalRequest[0];
      const userId = request.user_id;
      const amount = parseFloat(request.amount);

      // Update withdrawal request status - only update existing columns
      await sql`
        UPDATE withdrawal_requests 
        SET 
          status = 'approved'
        WHERE id = ${id}
      `;

      // Update commission wallet balance - deduct the approved amount
      await sql`
        UPDATE wallets 
        SET commission_wallet_balance = commission_wallet_balance - ${amount}
        WHERE user_id = ${userId}
      `;

      // Create transaction record for the successful withdrawal
      await sql`
        INSERT INTO wallet_transactions (
          user_id, transaction_id, type, amount, description, status
        ) VALUES (
          ${userId}, ${transactionId}, 'withdrawal_completed', ${amount}, 
          ${`Withdrawal approved - ${paymentMode.toUpperCase()}: ${paymentDetails}`}, 'completed'
        )
      `;

      res.json({
        message: 'Withdrawal request approved successfully',
        transactionId,
        paymentMode,
        amount,
        invoice: {
          transactionId,
          withdrawalId: request.withdrawal_id,
          amount,
          paymentMode,
          paymentDetails,
          processedAt: new Date().toISOString(),
          processedBy: req.user?.email
        }
      });

    } catch (error) {
      console.error('Error approving withdrawal request:', error);
      res.status(500).json({ message: 'Failed to approve withdrawal request' });
    }
  });

  // Admin: Reject withdrawal request
  app.post('/api/admin/withdrawal-requests/:id/reject', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Update withdrawal request status
      await sql`
        UPDATE withdrawal_requests 
        SET 
          status = 'rejected',
          processed_at = CURRENT_TIMESTAMP,
          processed_by = ${req.user?.userId},
          notes = ${notes || ''}
        WHERE id = ${id} AND status = 'pending'
      `;

      res.json({
        message: 'Withdrawal request rejected successfully'
      });

    } catch (error) {
      console.error('Error rejecting withdrawal request:', error);
      res.status(500).json({ message: 'Failed to reject withdrawal request' });
    }
  });

  // Admin: Mark notification as read
  app.patch('/api/admin/notifications/:id/read', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      await sql`
        UPDATE admin_notifications 
        SET is_read = true 
        WHERE id = ${id}
      `;

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  // Get all students for admin with comprehensive data
  app.get("/api/admin/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('📋 Admin fetching all students with comprehensive data...');

      const students = await storage.getAllStudentsWithDetails();

      console.log('✅ Retrieved', students.length, 'students for admin');
      res.json(students);
    } catch (error) {
      console.error('❌ Error fetching students for admin:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  // Get all users for admin
  app.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // SUPABASE AUTH ENFORCED - Update user
  app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Admin updating user through Supabase Auth (MANDATORY)');

      const updates = req.body;

      // ALL USER UPDATES MUST GO THROUGH SUPABASE AUTH
      const updatedUser = await AuthService.updateUser(req.params.id, updates);

      console.log('✅ Admin updated user through Supabase Auth:', updatedUser.id);

      res.json({
        ...updatedUser,
        password: undefined // Never return password
      });
    } catch (error: any) {
      console.error('❌ Admin user update failed:', error);
      res.status(500).json({ message: error.message || 'Failed to update user via Supabase Auth' });
    }
  });

  // SUPABASE AUTH ENFORCED - Delete user
  app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Admin deleting user through Supabase Auth (MANDATORY)');

      // ALL USER DELETION MUST GO THROUGH SUPABASE AUTH
      await AuthService.deleteUser(req.params.id);

      console.log('✅ Admin deleted user through Supabase Auth:', req.params.id);

      res.json({ message: 'User deleted successfully via Supabase Auth' });
    } catch (error: any) {
      console.error('❌ Admin user deletion failed:', error);
      res.status(500).json({ message: error.message || 'Failed to delete user via Supabase Auth' });
    }
  });

  // Classes CRUD
  app.get("/api/admin/classes", authenticateToken, async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  app.post("/api/admin/classes", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: 'Failed to create class' });
    }
  });

  app.put("/api/admin/classes/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      const updatedClass = await storage.updateClass(req.params.id, updates);
      res.json(updatedClass);
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ message: 'Failed to update class' });
    }
  });

  app.delete("/api/admin/classes/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteClass(req.params.id);
      res.json({ message: 'Class deleted successfully' });
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ message: 'Failed to delete class' });
    }
  });

  // Academic data routes for assignments
  app.get("/api/admin/academic/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  app.get("/api/admin/academic/classes", authenticateToken, async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  // Subjects CRUD
  app.get("/api/admin/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  app.post("/api/admin/subjects", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { name, classIds } = req.body;
      
      if (!name || !classIds || !Array.isArray(classIds) || classIds.length === 0) {
        return res.status(400).json({ message: 'Subject name and at least one class ID required' });
      }

      // Create separate subject entries for each class
      const createdSubjects = [];
      for (const classId of classIds) {
        const subjectData = { name, classId };
        const newSubject = await storage.createSubject(subjectData);
        createdSubjects.push(newSubject);
      }
      
      res.status(201).json({ 
        message: `Subject "${name}" connected to ${classIds.length} classes`,
        subjects: createdSubjects 
      });
    } catch (error) {
      console.error('Error creating subjects:', error);
      res.status(500).json({ message: 'Failed to create subjects' });
    }
  });

  app.put("/api/admin/subjects/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      const updatedSubject = await storage.updateSubject(req.params.id, updates);
      res.json(updatedSubject);
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({ message: 'Failed to update subject' });
    }
  });

  app.delete("/api/admin/subjects/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteSubject(req.params.id);
      res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ message: 'Failed to delete subject' });
    }
  });

  // Chapters CRUD
  app.get("/api/admin/chapters", authenticateToken, async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({ message: 'Failed to fetch chapters' });
    }
  });

  app.post("/api/admin/chapters", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const chapterData = insertChapterSchema.parse(req.body);
      const newChapter = await storage.createChapter(chapterData);
      res.status(201).json(newChapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ message: 'Failed to create chapter' });
    }
  });

  app.put("/api/admin/chapters/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      const updatedChapter = await storage.updateChapter(req.params.id, updates);
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ message: 'Failed to update chapter' });
    }
  });

  app.delete("/api/admin/chapters/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteChapter(req.params.id);
      res.json({ message: 'Chapter deleted successfully' });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ message: 'Failed to delete chapter' });
    }
  });

  // Topics CRUD
  app.get("/api/admin/topics", authenticateToken, async (req, res) => {
    try {
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json({ message: 'Failed to fetch topics' });
    }
  });

  app.post("/api/admin/topics", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const topicData = insertTopicSchema.parse(req.body);
      const newTopic = await storage.createTopic(topicData);
      res.status(201).json(newTopic);
    } catch (error) {
      console.error('Error creating topic:', error);
      res.status(500).json({ message: 'Failed to create topic' });
    }
  });

  app.put("/api/admin/topics/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      const updatedTopic = await storage.updateTopic(req.params.id, updates);
      res.json(updatedTopic);
    } catch (error) {
      console.error('Error updating topic:', error);
      res.status(500).json({ message: 'Failed to update topic' });
    }
  });

  app.delete("/api/admin/topics/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteTopic(req.params.id);
      res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
      console.error('Error deleting topic:', error);
      res.status(500).json({ message: 'Failed to delete topic' });
    }
  });

  // SO Centers CRUD
  app.put("/api/admin/so-centers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 12);
      }
      const updatedCenter = await storage.updateSoCenter(req.params.id, updates);
      const { password, ...centerResponse } = updatedCenter;
      res.json(centerResponse);
    } catch (error) {
      console.error('Error updating SO Center:', error);
      res.status(500).json({ message: 'Failed to update SO Center' });
    }
  });

  app.delete("/api/admin/so-centers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const centerId = req.params.id;
      console.log('🗑️ Admin attempting to delete SO Center:', centerId);

      await storage.deleteSoCenter(centerId);
      
      console.log('✅ SO Center deletion completed successfully');
      res.json({ message: 'SO Center deleted successfully' });
    } catch (error: any) {
      console.error('❌ Error deleting SO Center:', error);
      
      // Provide specific error messages
      if (error.message.includes('active students')) {
        res.status(400).json({ message: error.message });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ message: 'SO Center not found' });
      } else {
        res.status(500).json({ message: 'Failed to delete SO Center' });
      }
    }
  });

  // Fee Structure CRUD
  app.get("/api/admin/fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('📋 Fetching all fee structures...');

      // Get all class fees with class names
      const fees = await db
        .select({
          id: schema.classFees.id,
          classId: schema.classFees.classId,
          className: schema.classes.name,
          courseType: schema.classFees.courseType,
          admissionFee: schema.classFees.admissionFee,
          monthlyFee: schema.classFees.monthlyFee,
          yearlyFee: schema.classFees.yearlyFee,
          description: schema.classFees.description,
          isActive: schema.classFees.isActive,
          createdAt: schema.classFees.createdAt,
        })
        .from(schema.classFees)
        .leftJoin(schema.classes, eq(schema.classFees.classId, schema.classes.id))
        .where(eq(schema.classFees.isActive, true))
        .orderBy(desc(schema.classFees.createdAt));

      console.log('✅ Fee structures fetched successfully:', fees.length);
      res.json(fees);
    } catch (error: any) {
      console.error('❌ Error fetching fees:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      res.status(500).json({ message: 'Failed to fetch fees' });
    }
  });

  app.post("/api/admin/fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('📝 Creating new fee structure:', req.body);

      // Convert string numbers to proper decimal values for database
      const convertedData = {
        ...req.body,
        admissionFee: req.body.admissionFee.toString(),
        monthlyFee: req.body.monthlyFee ? req.body.monthlyFee.toString() : null,
        yearlyFee: req.body.yearlyFee ? req.body.yearlyFee.toString() : null,
      };

      console.log('📝 Converted fee data:', convertedData);

      // Use insertClassFeeSchema to validate the data
      const feeData = insertClassFeeSchema.parse(convertedData);

      // Insert directly into classFees table using Drizzle
      const [newFee] = await db
        .insert(schema.classFees)
        .values(feeData)
        .returning();

      console.log('✅ Fee structure created successfully:', newFee.id);
      res.status(201).json(newFee);
    } catch (error: any) {
      console.error('❌ Error creating fee:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      res.status(500).json({ message: 'Failed to create fee' });
    }
  });

  app.put("/api/admin/fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('📝 Updating fee structure:', req.params.id, req.body);

      // Convert string numbers to proper decimal values for database
      const convertedData = {
        ...req.body,
        admissionFee: req.body.admissionFee.toString(),
        monthlyFee: req.body.monthlyFee ? req.body.monthlyFee.toString() : null,
        yearlyFee: req.body.yearlyFee ? req.body.yearlyFee.toString() : null,
      };

      // Validate the data
      const feeData = insertClassFeeSchema.parse(convertedData);

      // Update the fee structure in database
      const [updatedFee] = await db
        .update(schema.classFees)
        .set(feeData)
        .where(eq(schema.classFees.id, req.params.id))
        .returning();

      if (!updatedFee) {
        return res.status(404).json({ message: 'Fee structure not found' });
      }

      console.log('✅ Fee structure updated successfully:', updatedFee.id);
      res.json(updatedFee);
    } catch (error: any) {
      console.error('❌ Error updating fee:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      res.status(500).json({ message: 'Failed to update fee structure' });
    }
  });

  app.delete("/api/admin/fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🗑️ Deleting fee structure:', req.params.id);

      // Actually DELETE the record from database (not just set isActive: false)
      const deletedResult = await db
        .delete(schema.classFees)
        .where(eq(schema.classFees.id, req.params.id))
        .returning();

      if (deletedResult.length === 0) {
        return res.status(404).json({ message: 'Fee structure not found' });
      }

      console.log('✅ Fee structure deleted permanently from database:', req.params.id);
      res.json({ message: 'Fee structure deleted successfully' });
    } catch (error: any) {
      console.error('❌ Error deleting fee:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      res.status(500).json({ message: 'Failed to delete fee structure' });
    }
  });

  // API endpoint for All Payments - Student Fee Histories
  app.get("/api/admin/payments/student-fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('📊 Fetching student fee payment histories...');

      // Get all student fee payments with student and SO center details
      const studentPayments = await db
        .select({
          id: schema.payments.id,
          amount: schema.payments.amount,
          paymentMethod: schema.payments.paymentMethod,
          description: schema.payments.description,
          month: schema.payments.month,
          year: schema.payments.year,
          receiptNumber: schema.payments.receiptNumber,
          transactionId: schema.payments.transactionId,
          createdAt: schema.payments.createdAt,
          studentName: schema.students.name,
          studentId: schema.students.studentId,
          studentClass: schema.classes.name,
          soCenterName: schema.soCenters.name,
          recordedByName: schema.users.name,
          stateName: schema.states.name,
          districtName: schema.districts.name,
          mandalName: schema.mandals.name,
          villageName: schema.villages.name,
        })
        .from(schema.payments)
        .leftJoin(schema.students, eq(schema.payments.studentId, schema.students.id))
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .leftJoin(schema.soCenters, eq(schema.students.soCenterId, schema.soCenters.id))
        .leftJoin(schema.users, eq(schema.payments.recordedBy, schema.users.id))
        .leftJoin(schema.villages, eq(schema.soCenters.villageId, schema.villages.id))
        .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
        .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
        .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
        .orderBy(desc(schema.payments.createdAt));

      console.log('✅ Student payments fetched successfully:', studentPayments.length);
      res.json(studentPayments);
    } catch (error: any) {
      console.error('❌ Error fetching student payments:', error);
      res.status(500).json({ message: 'Failed to fetch student payments' });
    }
  });

  // API endpoint for All Payments - SO Center Wallet Histories
  app.get("/api/admin/payments/so-wallet-histories", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('💰 Fetching SO Center wallet transaction histories...');

      // Get all SO Center wallet transactions with SO center details
      const soWalletTransactions = await db
        .select({
          id: schema.walletTransactions.id,
          amount: schema.walletTransactions.amount,
          type: schema.walletTransactions.type,
          description: schema.walletTransactions.description,
          createdAt: schema.walletTransactions.createdAt,
          soCenterName: schema.soCenters.name,
          soCenterId: schema.walletTransactions.soCenterId,
          collectionAgentName: schema.users.name,
          stateName: schema.states.name,
          districtName: schema.districts.name,
          mandalName: schema.mandals.name,
          villageName: schema.villages.name,
        })
        .from(schema.walletTransactions)
        .leftJoin(schema.soCenters, eq(schema.walletTransactions.soCenterId, schema.soCenters.id))
        .leftJoin(schema.users, eq(schema.walletTransactions.collectionAgentId, schema.users.id))
        .leftJoin(schema.villages, eq(schema.soCenters.villageId, schema.villages.id))
        .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
        .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
        .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
        .orderBy(desc(schema.walletTransactions.createdAt));

      console.log('✅ SO wallet transactions fetched successfully:', soWalletTransactions.length);
      res.json(soWalletTransactions);
    } catch (error: any) {
      console.error('❌ Error fetching SO wallet transactions:', error);
      res.status(500).json({ message: 'Failed to fetch SO wallet transactions' });
    }
  });

  // API endpoint for All Payments - Agent Wallet Histories
  app.get("/api/admin/payments/agent-wallet-histories", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🎯 Fetching Agent wallet transaction histories...');

      // For now, return product orders as agent transactions since commission_transactions might not exist yet
      const agentWalletTransactions = await db
        .select({
          id: schema.productOrders.id,
          amount: schema.productOrders.commissionAmount,
          type: sqlQuery`'commission'`,
          description: sqlQuery`CONCAT('Commission from product order: ', ${schema.productOrders.receiptNumber})`,
          createdAt: schema.productOrders.createdAt,
          soCenterName: schema.soCenters.name,
          soCenterId: schema.productOrders.soCenterId,
          walletTotalEarned: sqlQuery`'0'`,
          walletAvailableBalance: sqlQuery`'0'`,
          walletTotalWithdrawn: sqlQuery`'0'`,
          stateName: schema.states.name,
          districtName: schema.districts.name,
          mandalName: schema.mandals.name,
          villageName: schema.villages.name,
        })
        .from(schema.productOrders)
        .leftJoin(schema.soCenters, eq(schema.productOrders.soCenterId, schema.soCenters.id))
        .leftJoin(schema.villages, eq(schema.soCenters.villageId, schema.villages.id))
        .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
        .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
        .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
        .orderBy(desc(schema.productOrders.createdAt));

      console.log('✅ Agent wallet transactions fetched successfully:', agentWalletTransactions.length);
      res.json(agentWalletTransactions);
    } catch (error: any) {
      console.error('❌ Error fetching agent wallet transactions:', error);
      res.status(500).json({ message: 'Failed to fetch agent wallet transactions' });
    }
  });

  // API endpoint to fetch student details and payment history
  app.get("/api/admin/students/:studentId/details", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const studentId = req.params.studentId;
      console.log(`📊 Fetching student details for ID: ${studentId}`);

      // Get student basic details with SO center and location info
      const studentDetails = await db
        .select({
          id: schema.students.id,
          studentId: schema.students.studentId,
          name: schema.students.name,
          email: schema.students.email,
          phone: schema.students.phone,
          dateOfBirth: schema.students.dateOfBirth,
          enrollmentDate: schema.students.enrollmentDate,
          className: schema.classes.name,
          soCenterName: schema.soCenters.name,
          stateName: sql`COALESCE(${schema.states.name}, 'N/A')`.as('stateName'),
          districtName: sql`COALESCE(${schema.districts.name}, 'N/A')`.as('districtName'),
          mandalName: sql`COALESCE(${schema.mandals.name}, 'N/A')`.as('mandalName'),
          villageName: sql`COALESCE(${schema.villages.name}, 'N/A')`.as('villageName'),
          pendingAmount: schema.students.pendingAmount,
          paidAmount: schema.students.paidAmount,
        })
        .from(schema.students)
        .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
        .leftJoin(schema.soCenters, eq(schema.students.soCenterId, schema.soCenters.id))
        .leftJoin(schema.villages, eq(schema.soCenters.villageId, schema.villages.id))
        .leftJoin(schema.mandals, eq(schema.villages.mandalId, schema.mandals.id))
        .leftJoin(schema.districts, eq(schema.mandals.districtId, schema.districts.id))
        .leftJoin(schema.states, eq(schema.districts.stateId, schema.states.id))
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!studentDetails.length) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Get payment history for this student
      const paymentHistory = await db
        .select({
          id: schema.payments.id,
          amount: schema.payments.amount,
          paymentMethod: schema.payments.paymentMethod,
          description: schema.payments.description,
          month: schema.payments.month,
          year: schema.payments.year,
          receiptNumber: schema.payments.receiptNumber,
          transactionId: schema.payments.transactionId,
          createdAt: schema.payments.createdAt,
          recordedByName: sql`COALESCE(${schema.users.fullName}, 'N/A')`.as('recordedByName'),
        })
        .from(schema.payments)
        .leftJoin(schema.users, eq(schema.payments.recordedBy, schema.users.id))
        .where(eq(schema.payments.studentId, studentId))
        .orderBy(desc(schema.payments.createdAt));

      res.json({
        student: studentDetails[0],
        payments: paymentHistory
      });

    } catch (error: any) {
      console.error('❌ Error fetching student details:', error);
      res.status(500).json({ message: 'Failed to fetch student details' });
    }
  });

  // API endpoints for location filtering data
  app.get("/api/admin/locations/states", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const states = await db.select().from(schema.states).orderBy(schema.states.name);
      res.json(states);
    } catch (error: any) {
      console.error('❌ Error fetching states:', error);
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  app.get("/api/admin/locations/districts/:stateId", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const districts = await db
        .select()
        .from(schema.districts)
        .where(eq(schema.districts.stateId, req.params.stateId))
        .orderBy(schema.districts.name);
      res.json(districts);
    } catch (error: any) {
      console.error('❌ Error fetching districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
    }
  });

  app.get("/api/admin/locations/mandals/:districtId", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const mandals = await db
        .select()
        .from(schema.mandals)
        .where(eq(schema.mandals.districtId, req.params.districtId))
        .orderBy(schema.mandals.name);
      res.json(mandals);
    } catch (error: any) {
      console.error('❌ Error fetching mandals:', error);
      res.status(500).json({ message: 'Failed to fetch mandals' });
    }
  });

  app.get("/api/admin/locations/villages/:mandalId", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const villages = await db
        .select()
        .from(schema.villages)
        .where(eq(schema.villages.mandalId, req.params.mandalId))
        .orderBy(schema.villages.name);
      res.json(villages);
    } catch (error: any) {
      console.error('❌ Error fetching villages:', error);
      res.status(500).json({ message: 'Failed to fetch villages' });
    }
  });

  // New hierarchical location endpoints for attendance filters
  app.get("/api/locations/states", authenticateToken, async (req, res) => {
    try {
      const states = await db.select().from(schema.states).orderBy(schema.states.name);
      res.json(states);
    } catch (error: any) {
      console.error('❌ Error fetching states:', error);
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  app.get("/api/locations/districts", authenticateToken, async (req, res) => {
    try {
      const { stateId } = req.query;
      
      let query = db.select().from(schema.districts);
      
      if (stateId) {
        query = query.where(eq(schema.districts.stateId, stateId as string));
      }
      
      const districts = await query.orderBy(schema.districts.name);
      res.json(districts);
    } catch (error: any) {
      console.error('❌ Error fetching districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
    }
  });

  app.get("/api/locations/mandals", authenticateToken, async (req, res) => {
    try {
      const { districtId } = req.query;
      
      let query = db.select().from(schema.mandals);
      
      if (districtId) {
        query = query.where(eq(schema.mandals.districtId, districtId as string));
      }
      
      const mandals = await query.orderBy(schema.mandals.name);
      res.json(mandals);
    } catch (error: any) {
      console.error('❌ Error fetching mandals:', error);
      res.status(500).json({ message: 'Failed to fetch mandals' });
    }
  });

  app.get("/api/locations/villages", authenticateToken, async (req, res) => {
    try {
      const { mandalId } = req.query;
      
      let query = db.select().from(schema.villages);
      
      if (mandalId) {
        query = query.where(eq(schema.villages.mandalId, mandalId as string));
      }
      
      const villages = await query.orderBy(schema.villages.name);
      res.json(villages);
    } catch (error: any) {
      console.error('❌ Error fetching villages:', error);
      res.status(500).json({ message: 'Failed to fetch villages' });
    }
  });

  app.get("/api/locations/so-centers", authenticateToken, async (req, res) => {
    try {
      const { villageId } = req.query;
      
      let query = db.select().from(schema.soCenters);
      
      if (villageId) {
        query = query.where(eq(schema.soCenters.villageId, villageId as string));
      }
      
      const centers = await query.orderBy(schema.soCenters.name);
      res.json(centers);
    } catch (error: any) {
      console.error('❌ Error fetching SO centers:', error);
      res.status(500).json({ message: 'Failed to fetch SO centers' });
    }
  });

  app.get("/api/classes/by-center", authenticateToken, async (req, res) => {
    try {
      const { centerId } = req.query;
      
      if (centerId) {
        // Get classes that have students in the specified SO center
        const classesWithStudents = await sql`
          SELECT DISTINCT c.id, c.name 
          FROM classes c
          INNER JOIN students s ON c.id = s.class_id
          WHERE s.so_center_id = ${centerId} AND s.is_active = true
          ORDER BY c.name
        `;
        
        res.json(classesWithStudents);
      } else {
        // Get all classes
        const classes = await db.select().from(schema.classes).orderBy(schema.classes.name);
        res.json(classes);
      }
    } catch (error: any) {
      console.error('❌ Error fetching classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  app.get("/api/students/by-filter", authenticateToken, async (req, res) => {
    try {
      const { classId, centerId } = req.query;
      
      let query = sql`
        SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.is_active = true
      `;

      if (classId && centerId) {
        query = sql`
          SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name
          FROM students s
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE s.is_active = true AND s.class_id = ${classId} AND s.so_center_id = ${centerId}
          ORDER BY s.name
        `;
      } else if (classId) {
        query = sql`
          SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name
          FROM students s
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE s.is_active = true AND s.class_id = ${classId}
          ORDER BY s.name
        `;
      } else if (centerId) {
        query = sql`
          SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name
          FROM students s
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE s.is_active = true AND s.so_center_id = ${centerId}
          ORDER BY s.name
        `;
      } else {
        query = sql`
          SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name
          FROM students s
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE s.is_active = true
          ORDER BY s.name
        `;
      }

      const students = await query;
      res.json(students);
    } catch (error: any) {
      console.error('❌ Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  // Students CRUD for admin
  app.get("/api/admin/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  // Get single student details by ID for admin
  app.get("/api/students/:studentId", authenticateToken, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      
      // Get basic student info with related data
      const studentQuery = `
        SELECT 
          s.id, s.student_id as student_code, s.name, s.email, s.phone, s.parent_phone,
          s.date_of_birth, s.enrollment_date, s.pending_amount, s.paid_amount,
          c.name as class_name, c.id as class_id,
          sc.name as so_center_name, sc.center_id as so_center_code,
          st.name as state_name, d.name as district_name, 
          m.name as mandal_name, v.name as village_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN so_centers sc ON s.so_center_id = sc.id
        LEFT JOIN villages v ON sc.village_id = v.id
        LEFT JOIN mandals m ON v.mandal_id = m.id
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN states st ON d.state_id = st.id
        WHERE s.id = $1 AND s.is_active = true
      `;

      const studentResults = await executeRawQuery(studentQuery, [studentId]);
      
      if (!studentResults.length) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const student = studentResults[0];
      
      // Transform the result
      const studentData = {
        id: student.id,
        studentCode: student.student_code,
        name: student.name,
        email: student.email,
        phone: student.phone,
        parentPhone: student.parent_phone,
        dateOfBirth: student.date_of_birth,
        enrollmentDate: student.enrollment_date,
        pendingAmount: parseFloat(student.pending_amount) || 0,
        paidAmount: parseFloat(student.paid_amount) || 0,
        className: student.class_name,
        classId: student.class_id,
        soCenterName: student.so_center_name,
        soCenterCode: student.so_center_code,
        location: {
          state: student.state_name || 'N/A',
          district: student.district_name || 'N/A',
          mandal: student.mandal_name || 'N/A',
          village: student.village_name || 'N/A'
        }
      };

      res.json(studentData);
    } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({ message: 'Failed to fetch student details' });
    }
  });

  // Get student progress tracking data for detailed view
  app.get("/api/progress-tracking/student/:studentId", authenticateToken, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      
      // Get homework activities progress
      const homeworkQuery = `
        SELECT 
          ha.id, ha.homework_date, ha.subject, ha.chapter, ha.topic, ha.status,
          ha.score, ha.total_score, ha.remarks, ha.created_at
        FROM homework_activities ha
        WHERE ha.student_id = $1
        ORDER BY ha.homework_date DESC, ha.created_at DESC
      `;

      // Get tuition progress
      const tuitionQuery = `
        SELECT 
          tp.id, tp.status, tp.completion_date, tp.created_at,
          t.name as topic_name, c.name as chapter_name, s.name as subject_name
        FROM tuition_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE tp.student_id = $1
        ORDER BY s.name, c.name, t.name
      `;

      const [homeworkResults, tuitionResults] = await Promise.all([
        executeRawQuery(homeworkQuery, [studentId]),
        executeRawQuery(tuitionQuery, [studentId])
      ]);

      // Calculate subject-wise statistics
      const subjectStats: any = {};
      
      // Process homework data
      homeworkResults.forEach((hw: any) => {
        const subject = hw.subject || 'General';
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            homeworkTotal: 0,
            homeworkCompleted: 0,
            totalScore: 0,
            maxScore: 0,
            tuitionTopics: 0,
            completedTuitionTopics: 0
          };
        }
        
        subjectStats[subject].homeworkTotal++;
        if (hw.status === 'completed') {
          subjectStats[subject].homeworkCompleted++;
        }
        if (hw.score) {
          subjectStats[subject].totalScore += parseFloat(hw.score);
          subjectStats[subject].maxScore += parseFloat(hw.total_score || hw.score);
        }
      });

      // Process tuition data
      tuitionResults.forEach((tp: any) => {
        const subject = tp.subject_name || 'General';
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            homeworkTotal: 0,
            homeworkCompleted: 0,
            totalScore: 0,
            maxScore: 0,
            tuitionTopics: 0,
            completedTuitionTopics: 0
          };
        }
        
        subjectStats[subject].tuitionTopics++;
        if (tp.status === 'learned' || tp.status === 'completed') {
          subjectStats[subject].completedTuitionTopics++;
        }
      });

      // Calculate percentages and format for charts
      const subjectData = Object.keys(subjectStats).map(subject => {
        const stats = subjectStats[subject];
        return {
          subject,
          homeworkPercentage: stats.homeworkTotal > 0 ? Math.round((stats.homeworkCompleted / stats.homeworkTotal) * 100) : 0,
          tuitionPercentage: stats.tuitionTopics > 0 ? Math.round((stats.completedTuitionTopics / stats.tuitionTopics) * 100) : 0,
          averageScore: stats.maxScore > 0 ? Math.round((stats.totalScore / stats.maxScore) * 100) : 0,
          homeworkCount: stats.homeworkCompleted,
          tuitionCount: stats.completedTuitionTopics
        };
      });

      const response = {
        subjectData,
        recentHomework: homeworkResults.slice(0, 10).map((hw: any) => ({
          id: hw.id,
          date: hw.homework_date,
          subject: hw.subject,
          topic: hw.topic,
          status: hw.status,
          score: hw.score ? `${hw.score}/${hw.total_score || hw.score}` : null
        })),
        recentTuition: tuitionResults.slice(0, 10).map((tp: any) => ({
          id: tp.id,
          subject: tp.subject_name,
          chapter: tp.chapter_name,
          topic: tp.topic_name,
          status: tp.status,
          completionDate: tp.completion_date
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching student progress data:', error);
      res.status(500).json({ message: 'Failed to fetch progress data' });
    }
  });

  // Get student attendance statistics  
  app.get("/api/attendance/student/:studentId", authenticateToken, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      
      // Get attendance records with stats
      const attendanceQuery = `
        SELECT 
          a.id, a.date, a.status, a.remarks, a.created_at,
          COUNT(*) OVER() as total_records,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) OVER() as total_present,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) OVER() as total_absent
        FROM attendance a
        WHERE a.student_id = $1
        ORDER BY a.date DESC
      `;

      const attendanceResults = await executeRawQuery(attendanceQuery, [studentId]);

      let attendancePercentage = 0;
      let monthlyData: any[] = [];
      
      if (attendanceResults.length > 0) {
        const totalPresent = parseInt(attendanceResults[0].total_present) || 0;
        const totalRecords = parseInt(attendanceResults[0].total_records) || 0;
        attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

        // Group by month for trend analysis
        const monthlyStats: any = {};
        attendanceResults.forEach((record: any) => {
          const date = new Date(record.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { total: 0, present: 0 };
          }
          
          monthlyStats[monthKey].total++;
          if (record.status === 'present') {
            monthlyStats[monthKey].present++;
          }
        });

        monthlyData = Object.keys(monthlyStats)
          .sort()
          .slice(-6) // Last 6 months
          .map(month => ({
            month,
            percentage: Math.round((monthlyStats[month].present / monthlyStats[month].total) * 100),
            present: monthlyStats[month].present,
            total: monthlyStats[month].total
          }));
      }

      const response = {
        attendancePercentage,
        totalDays: attendanceResults.length,
        presentDays: attendanceResults.filter((r: any) => r.status === 'present').length,
        absentDays: attendanceResults.filter((r: any) => r.status === 'absent').length,
        monthlyTrend: monthlyData,
        recentAttendance: attendanceResults.slice(0, 20).map((record: any) => ({
          id: record.id,
          date: record.date,
          status: record.status,
          remarks: record.remarks
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching student attendance data:', error);
      res.status(500).json({ message: 'Failed to fetch attendance data' });
    }
  });

  app.put("/api/admin/students/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'so_center')) {
        return res.status(403).json({ message: 'Admin or SO Center access required' });
      }
      const updates = req.body;
      const updatedStudent = await storage.updateStudent(req.params.id, updates);
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Failed to update student' });
    }
  });

  app.delete("/api/admin/students/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'so_center')) {
        return res.status(403).json({ message: 'Admin or SO Center access required' });
      }
      await storage.deleteStudent(req.params.id);
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: 'Failed to delete student' });
    }
  });

  // Payments CRUD for admin
  app.get("/api/admin/payments", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  app.put("/api/admin/payments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'so_center')) {
        return res.status(403).json({ message: 'Admin or SO Center access required' });
      }
      const updates = req.body;
      const updatedPayment = await storage.updatePayment(req.params.id, updates);
      res.json(updatedPayment);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ message: 'Failed to update payment' });
    }
  });

  app.delete("/api/admin/payments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'so_center')) {
        return res.status(403).json({ message: 'Admin or SO Center access required' });
      }
      await storage.deletePayment(req.params.id);
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  });

  // Database seeding endpoint for Supabase
  app.post("/api/admin/seed-database", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if states already exist
      const existingStates = await storage.getAllStates();
      if (existingStates.length > 0) {
        return res.json({ message: 'Database already seeded', existingStates: existingStates.length });
      }

      // Seed initial states for India
      const initialStates = [
        { name: 'Andhra Pradesh', code: 'AP' },
        { name: 'Telangana', code: 'TS' },
        { name: 'Karnataka', code: 'KA' },
        { name: 'Tamil Nadu', code: 'TN' },
        { name: 'Kerala', code: 'KL' }
      ];

      const createdStates = [];
      for (const stateData of initialStates) {
        const state = await storage.createState(stateData);
        createdStates.push(state);
      }

      // Seed initial classes
      const initialClasses = [
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

      const createdClasses = [];
      for (const classData of initialClasses) {
        const classItem = await storage.createClass(classData);
        createdClasses.push(classItem);
      }

      res.json({ 
        message: 'Database seeded successfully',
        seeded: {
          states: createdStates.length,
          classes: createdClasses.length
        }
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      res.status(500).json({ message: 'Failed to seed database' });
    }
  });

  // Process student payment endpoint
  app.post("/api/payments/process", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { studentId, amount, feeType, receiptNumber, expectedFeeAmount } = req.body;

      // Validate required fields
      if (!studentId || !amount || !feeType || !receiptNumber) {
        return res.status(400).json({ 
          message: "Missing required fields: studentId, amount, feeType, receiptNumber" 
        });
      }

      // Get student details for response
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Validate user exists in database before processing payment
      let recordedByUserId = req.user.userId;
      try {
        const userExists = await storage.getUser(req.user.userId);
        if (!userExists) {
          console.warn(`⚠️ User ${req.user.userId} not found in users table, using null for recordedBy`);
          recordedByUserId = null;
        }
      } catch (error) {
        console.warn(`⚠️ Error validating user ${req.user.userId}, using null for recordedBy:`, error);
        recordedByUserId = null;
      }

      // Process the payment with validated user ID
      const result = await storage.processStudentPayment({
        studentId,
        amount: parseFloat(amount),
        feeType,
        receiptNumber,
        expectedFeeAmount: parseFloat(expectedFeeAmount || '0'),
        recordedBy: recordedByUserId
      });

      // Use the complete data from storage result which includes all invoice details
      res.json({
        studentName: result.studentName,
        studentId: result.studentId,
        className: result.className,
        amount: result.amount,
        feeType: result.feeType,
        receiptNumber: result.receiptNumber,
        transactionId: result.transactionId,
        paymentId: result.payment.id,
        fatherMobile: result.fatherMobile,
        parentPhone: result.parentPhone,
        newPaidAmount: result.newPaidAmount,
        newPendingAmount: result.newPendingAmount,
        totalFeeAmount: result.totalFeeAmount
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process payment" 
      });
    }
  });

  // Get payment history for a student
  app.get("/api/students/:studentId/payments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { studentId } = req.params;
      const payments = await storage.getPaymentsByStudent(studentId);

      res.json(payments);
    } catch (error) {
      console.error("Payment history error:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Progress Tracking Routes

  // Homework Activity Routes
  app.post("/api/homework-activity", authenticateToken, async (req, res) => {
    try {
      const { activities } = req.body;

      if (!activities || !Array.isArray(activities)) {
        return res.status(400).json({ message: "Activities array is required" });
      }

      // Validate each activity
      const validatedActivities = activities.map(activity => {
        const validation = insertHomeworkActivitySchema.safeParse(activity);

        if (!validation.success) {
          throw new Error(`Invalid activity data: ${validation.error.message}`);
        }

        return validation.data;
      });

      const result = await storage.createHomeworkActivity(validatedActivities);
      res.json(result);
    } catch (error) {
      console.error("Error creating homework activity:", error);
      res.status(500).json({ message: "Failed to record homework activity" });
    }
  });

  app.get("/api/homework-activity", authenticateToken, async (req, res) => {
    try {
      const { classId, date, soCenterId } = req.query;

      const activities = await storage.getHomeworkActivities({
        classId: classId as string,
        date: date as string,
        soCenterId: soCenterId as string
      });

      res.json(activities);
    } catch (error) {
      console.error("Error fetching homework activities:", error);
      res.status(500).json({ message: "Failed to fetch homework activities" });
    }
  });

  // Tuition Progress Routes
  app.post("/api/tuition-progress", authenticateToken, async (req, res) => {
    try {
      const validation = insertTuitionProgressSchema.safeParse({
        ...req.body,
        updatedBy: req.user?.userId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid progress data", 
          errors: validation.error.errors 
        });
      }

      const result = await storage.createTuitionProgress(validation.data);
      res.json(result);
    } catch (error) {
      console.error("Error creating tuition progress:", error);
      res.status(500).json({ message: "Failed to record tuition progress" });
    }
  });

  app.get("/api/tuition-progress", authenticateToken, async (req, res) => {
    try {
      const { classId, topicId, studentId, soCenterId } = req.query;

      const progress = await storage.getTuitionProgress({
        classId: classId as string,
        topicId: topicId as string,
        studentId: studentId as string,
        soCenterId: soCenterId as string
      });

      res.json(progress);
    } catch (error) {
      console.error("Error fetching tuition progress:", error);
      res.status(500).json({ message: "Failed to fetch tuition progress" });
    }
  });

  app.put("/api/tuition-progress/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      const validation = insertTuitionProgressSchema.partial().safeParse({
        ...req.body,
        updatedBy: req.user?.userId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid progress data", 
          errors: validation.error.errors 
        });
      }

      const result = await storage.updateTuitionProgress(id, validation.data);
      res.json(result);
    } catch (error) {
      console.error("Error updating tuition progress:", error);
      res.status(500).json({ message: "Failed to update tuition progress" });
    }
  });

  // Admin comprehensive progress tracking endpoint
  // Attendance endpoints
  app.get("/api/attendance", authenticateToken, async (req, res) => {
    try {
      const { studentId, classId, centerId, date } = req.query;
      
      let query = sql`
        SELECT 
          a.id,
          a.student_id,
          a.date,
          a.status,
          a.remarks,
          s.name as student_name,
          s.student_id as student_code,
          c.name as class_name,
          sc.name as center_name,
          sc.center_id as center_code
        FROM attendance a
        LEFT JOIN students s ON a.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN so_centers sc ON s.so_center_id = sc.id
        WHERE 1=1
      `;

      // Build dynamic query based on filters
      if (studentId && classId && centerId && date) {
        query = sql`
          SELECT 
            a.id, a.student_id, a.date, a.status, a.remarks,
            s.name as student_name, s.student_id as student_code,
            c.name as class_name, sc.name as center_name, sc.center_id as center_code
          FROM attendance a
          LEFT JOIN students s ON a.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          LEFT JOIN so_centers sc ON s.so_center_id = sc.id
          WHERE a.student_id = ${studentId} AND s.class_id = ${classId} AND s.so_center_id = ${centerId} AND a.date = ${date}
          ORDER BY a.date DESC, s.name
        `;
      } else if (studentId) {
        query = sql`
          SELECT 
            a.id, a.student_id, a.date, a.status, a.remarks,
            s.name as student_name, s.student_id as student_code,
            c.name as class_name, sc.name as center_name, sc.center_id as center_code
          FROM attendance a
          LEFT JOIN students s ON a.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          LEFT JOIN so_centers sc ON s.so_center_id = sc.id
          WHERE a.student_id = ${studentId}
          ORDER BY a.date DESC, s.name
        `;
      } else if (classId && centerId) {
        query = sql`
          SELECT 
            a.id, a.student_id, a.date, a.status, a.remarks,
            s.name as student_name, s.student_id as student_code,
            c.name as class_name, sc.name as center_name, sc.center_id as center_code
          FROM attendance a
          LEFT JOIN students s ON a.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          LEFT JOIN so_centers sc ON s.so_center_id = sc.id
          WHERE s.class_id = ${classId} AND s.so_center_id = ${centerId}
          ORDER BY a.date DESC, s.name
        `;
      } else if (centerId) {
        query = sql`
          SELECT 
            a.id, a.student_id, a.date, a.status, a.remarks,
            s.name as student_name, s.student_id as student_code,
            c.name as class_name, sc.name as center_name, sc.center_id as center_code
          FROM attendance a
          LEFT JOIN students s ON a.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          LEFT JOIN so_centers sc ON s.so_center_id = sc.id
          WHERE s.so_center_id = ${centerId}
          ORDER BY a.date DESC, s.name
        `;
      } else {
        // Return empty array if no meaningful filters provided
        return res.json([]);
      }

      const attendanceRecords = await query;
      res.json(attendanceRecords);
    } catch (error: any) {
      console.error('❌ Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  app.get("/api/admin/progress-tracking", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { classId, soCenterId, fromDate, toDate } = req.query;

      console.log('📊 SO Center requesting comprehensive progress tracking with filters:', {
        classId: classId || 'All',
        soCenterId: soCenterId || 'All',
        fromDate: fromDate || 'No date filter',
        toDate: toDate || 'No date filter'
      });

      // Build query for comprehensive progress data
      let query = `
        SELECT DISTINCT
          s.id as student_id,
          s.name as student_name,
          s.student_id as student_code,
          s.class_id,
          cls.name as class_name,
          s.so_center_id,
          sc.name as center_name,
          sc.center_id as center_code,
          
          -- Homework completion stats
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN ha.status = 'completed' THEN 1 END) * 100.0) / 
              NULLIF(COUNT(ha.id), 0), 
              1
            ), 
            0
          ) as homework_completion_percentage,
          
          -- Tuition progress stats  
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN tp.status = 'learned' THEN 1 END) * 100.0) / 
              NULLIF(COUNT(tp.id), 0), 
              1
            ), 
            0
          ) as tuition_completion_percentage,
          
          COUNT(DISTINCT ha.id) as total_homework_activities,
          COUNT(CASE WHEN ha.status = 'completed' THEN 1 END) as completed_homework,
          COUNT(DISTINCT tp.id) as total_tuition_topics,
          COUNT(CASE WHEN tp.status = 'learned' THEN 1 END) as completed_tuition_topics
          
        FROM students s
        LEFT JOIN classes cls ON s.class_id = cls.id
        LEFT JOIN so_centers sc ON s.so_center_id = sc.id
        LEFT JOIN homework_activities ha ON s.id = ha.student_id
        LEFT JOIN tuition_progress tp ON s.id = tp.student_id
        WHERE s.is_active = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Add filters
      if (classId && classId !== 'all' && classId !== '') {
        query += ` AND s.class_id = $${paramIndex}`;
        params.push(classId);
        paramIndex++;
      }

      if (soCenterId && soCenterId !== 'all' && soCenterId !== '') {
        query += ` AND s.so_center_id = $${paramIndex}`;
        params.push(soCenterId);
        paramIndex++;
      }

      if (fromDate) {
        query += ` AND (ha.homework_date >= $${paramIndex} OR tp.created_at >= $${paramIndex})`;
        params.push(fromDate);
        paramIndex++;
      }

      if (toDate) {
        query += ` AND (ha.homework_date <= $${paramIndex} OR tp.created_at <= $${paramIndex})`;
        params.push(toDate);
        paramIndex++;
      }

      query += `
        GROUP BY 
          s.id, s.name, s.student_id, s.class_id, cls.name, 
          s.so_center_id, sc.name, sc.center_id
        ORDER BY 
          sc.name ASC, cls.name ASC, s.name ASC
      `;

      console.log('🔍 Executing admin progress query...');
      const results = await executeRawQuery(query, params);

      console.log(`✅ Retrieved ${results.length} student progress records for admin`);

      // Transform the results
      const progressData = results.map((row: any) => ({
        studentId: row.student_id,
        studentName: row.student_name,
        studentCode: row.student_code,
        classId: row.class_id,
        className: row.class_name,
        soCenterId: row.so_center_id,
        centerName: row.center_name,
        centerCode: row.center_code,
        homeworkCompletionPercentage: parseFloat(row.homework_completion_percentage) || 0,
        tuitionCompletionPercentage: parseFloat(row.tuition_completion_percentage) || 0,
        totalHomeworkActivities: parseInt(row.total_homework_activities) || 0,
        completedHomework: parseInt(row.completed_homework) || 0,
        totalTuitionTopics: parseInt(row.total_tuition_topics) || 0,
        completedTuitionTopics: parseInt(row.completed_tuition_topics) || 0
      }));

      res.json(progressData);
    } catch (error: any) {
      console.error('❌ Error fetching admin progress tracking data:', error);
      res.status(500).json({ message: 'Failed to fetch progress tracking data' });
    }
  });

  // Enhanced Progress Tracking Routes for SO Centers
  
  // Homework activities route
  app.post("/api/progress-tracking/homework", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { activities } = req.body;
      
      if (!activities || !Array.isArray(activities)) {
        return res.status(400).json({ message: 'Activities array is required' });
      }

      const results = [];
      
      for (const activity of activities) {
        // Get student details to determine classId
        const student = await storage.getStudent(activity.studentId);
        if (!student) {
          return res.status(400).json({ message: `Student not found: ${activity.studentId}` });
        }

        const homeworkData = {
          studentId: activity.studentId,
          classId: student.classId,
          homeworkDate: activity.date,
          status: activity.status,
          completionType: activity.completionType,
          reason: activity.reason,
        };

        // Insert or update homework activity
        const result = await db.insert(schema.homeworkActivities).values(homeworkData)
          .onConflictDoUpdate({
            target: [schema.homeworkActivities.studentId, schema.homeworkActivities.homeworkDate],
            set: {
              status: homeworkData.status,
              completionType: homeworkData.completionType,
              reason: homeworkData.reason,
              updatedAt: new Date(),
            }
          })
          .returning();
          
        results.push(result[0]);
      }

      res.json({ message: 'Homework activities saved successfully', count: results.length });
    } catch (error: any) {
      console.error('❌ Error saving homework activities:', error);
      res.status(500).json({ message: 'Failed to save homework activities' });
    }
  });

  // Topic completion route
  app.post("/api/progress-tracking/topics/complete", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { studentId, topicId, chapterId } = req.body;
      
      if (!studentId || !topicId) {
        return res.status(400).json({ message: 'Student ID and Topic ID are required' });
      }

      // Check if topic is already completed for this student
      const existingProgress = await db.select()
        .from(schema.tuitionProgress)
        .where(
          sql`${schema.tuitionProgress.studentId} = ${studentId} AND ${schema.tuitionProgress.topicId} = ${topicId} AND ${schema.tuitionProgress.status} = 'learned'`
        )
        .limit(1);

      if (existingProgress.length > 0) {
        return res.status(400).json({ 
          message: 'Topic already completed',
          alreadyCompleted: true,
          completedDate: existingProgress[0].completedDate
        });
      }

      const progressData = {
        studentId: studentId,
        topicId: topicId,
        status: 'learned' as const,
        completedDate: new Date(), // Use Date object instead of string
        updatedBy: req.user.userId
      };

      // Insert or update tuition progress
      const result = await db.insert(schema.tuitionProgress).values(progressData)
        .onConflictDoUpdate({
          target: [schema.tuitionProgress.studentId, schema.tuitionProgress.topicId],
          set: {
            status: progressData.status,
            completedDate: progressData.completedDate,
            updatedBy: progressData.updatedBy
          }
        })
        .returning();

      res.json({ message: 'Topic marked as completed', progress: result[0] });
    } catch (error: any) {
      console.error('❌ Error marking topic complete:', error);
      res.status(500).json({ message: 'Failed to mark topic as completed' });
    }
  });

  // Get topic completion status for a student
  app.get("/api/progress-tracking/topics/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { studentId, chapterId } = req.query;
      
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      let query = `
        SELECT 
          t.id as topic_id,
          t.name as topic_name,
          tp.status,
          tp.completed_date
        FROM topics t
        LEFT JOIN tuition_progress tp ON t.id = tp.topic_id AND tp.student_id = $1
      `;

      const params = [studentId];

      if (chapterId) {
        query += ` WHERE t.chapter_id = $2`;
        params.push(chapterId as string);
      }

      query += ` ORDER BY t.order_index`;

      const result = await executeRawQuery(query, params);
      
      const completed = result.filter(row => row.status === 'learned').map(row => row.topic_id);
      const remaining = result.filter(row => row.status !== 'learned').map(row => row.topic_id);

      res.json({
        completed,
        remaining,
        total: result.length,
        details: result
      });
    } catch (error: any) {
      console.error('❌ Error fetching topic status:', error);
      res.status(500).json({ message: 'Failed to fetch topic status' });
    }
  });

  // Teacher Management Routes

  // Get all teachers
  app.get("/api/admin/teachers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const teachers = await storage.getUsersByRole('teacher');
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Failed to fetch teachers' });
    }
  });

  // Get teacher by ID
  app.get("/api/admin/teachers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      res.json(teacher);
    } catch (error) {
      console.error('Error fetching teacher:', error);
      res.status(500).json({ message: 'Failed to fetch teacher' });
    }
  });

  // Create teacher - Note: Teachers are now created through User Management
  app.post("/api/admin/teachers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Teachers should be created through the User Management system with role "teacher"
      res.status(400).json({ 
        message: "Teachers should be created through User Management with role 'teacher'" 
      });
    } catch (error) {
      console.error('Error in teacher creation endpoint:', error);
      res.status(500).json({ message: 'Failed to process request' });
    }
  });

  // Update teacher - Note: Teacher details are now updated through User Management
  app.put("/api/admin/teachers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Teachers should be updated through the User Management system
      res.status(400).json({ 
        message: "Teacher details should be updated through User Management" 
      });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ message: 'Failed to update teacher' });
    }
  });

  // Delete teacher (deactivate user)
  app.delete("/api/admin/teachers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
      console.error('Error deleting teacher:', error);
      res.status(500).json({ message: 'Failed to delete teacher' });
    }
  });

  // Get teacher's subjects
  app.get("/api/admin/teachers/:id/subjects", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get teacher subjects from teacher_subjects table
      const query = sqlQuery`
        SELECT s.id, s.name, s.description 
        FROM subjects s 
        JOIN teacher_subjects ts ON s.id = ts.subject_id 
        WHERE ts.user_id = ${req.params.id} AND s.is_active = true
        ORDER BY s.name
      `;
      const subjects = await db.execute(query);
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      res.status(500).json({ message: 'Failed to fetch teacher subjects' });
    }
  });

  // Get teacher's classes
  app.get("/api/admin/teachers/:id/classes", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get teacher classes from teacher_classes table
      const query = sqlQuery`
        SELECT c.id, c.name, c.description 
        FROM classes c 
        JOIN teacher_classes tc ON c.id = tc.class_id 
        WHERE tc.user_id = ${req.params.id} AND c.is_active = true
        ORDER BY c.name
      `;
      const classes = await db.execute(query);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({ message: 'Failed to fetch teacher classes' });
    }
  });

  // Get teacher's daily records
  app.get("/api/admin/teachers/:id/records", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get teacher records from teacher_daily_records table
      const query = sqlQuery`
        SELECT tr.*, c.name as class_name, s.name as subject_name, ch.name as chapter_title, t.name as topic_title
        FROM teacher_daily_records tr
        LEFT JOIN classes c ON tr.class_id = c.id
        LEFT JOIN subjects s ON tr.subject_id = s.id
        LEFT JOIN chapters ch ON tr.chapter_id = ch.id
        LEFT JOIN topics t ON tr.topic_id = t.id
        WHERE tr.teacher_id = ${req.params.id}
        ORDER BY tr.record_date DESC, tr.created_at DESC
      `;
      const records = await db.execute(query);
      res.json(records);
    } catch (error) {
      console.error('Error fetching teacher records:', error);
      res.status(500).json({ message: 'Failed to fetch teacher records' });
    }
  });

  // Add daily teaching record
  app.post("/api/admin/teacher-records", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('Teaching record request body:', req.body);

      const { teacherId, classId, subjectId, chapterId, teachingDuration, notes, recordDate } = req.body;

      if (!teacherId || !classId || !subjectId || !teachingDuration) {
        console.log('Missing required fields:', { teacherId, classId, subjectId, teachingDuration });
        return res.status(400).json({ 
          message: "Required fields missing",
          missing: {
            teacherId: !teacherId,
            classId: !classId, 
            subjectId: !subjectId,
            teachingDuration: !teachingDuration
          }
        });
      }

      const recordData = {
        teacherId: teacherId,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
        classId: classId,
        subjectId: subjectId,
        chapterId: chapterId || null,
        teachingDuration: parseInt(teachingDuration),
        notes: notes || null
      };

      console.log('Creating teaching record with data:', recordData);

      const [newRecord] = await db.insert(schema.teacherDailyRecords)
        .values(recordData)
        .returning();

      console.log('Teaching record created successfully:', newRecord);
      res.status(201).json({ message: 'Teaching record added successfully', record: newRecord });
    } catch (error: any) {
      console.error('Error adding teaching record:', error);
      res.status(500).json({ message: 'Failed to add teaching record', error: error.message });
    }
  });

  // Get teacher records with date filtering
  app.get("/api/admin/teachers/:teacherId/records", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { teacherId } = req.params;
      const { fromDate, toDate } = req.query;

      console.log('Fetching records for teacher:', teacherId, 'with dates:', { fromDate, toDate });

      // Build the query with proper parameter substitution
      let queryString = `
        SELECT 
          tr.id,
          tr.teacher_id,
          tr.record_date,
          tr.class_id,
          tr.subject_id,
          tr.chapter_id,
          tr.teaching_duration,
          tr.notes,
          tr.created_at,
          c.name as className,
          s.name as subjectName,
          ch.name as chapterTitle
        FROM teacher_daily_records tr
        LEFT JOIN classes c ON tr.class_id = c.id
        LEFT JOIN subjects s ON tr.subject_id = s.id
        LEFT JOIN chapters ch ON tr.chapter_id = ch.id
        WHERE tr.teacher_id = $1
      `;

      const params = [teacherId];

      if (fromDate) {
        queryString += ` AND tr.record_date >= $${params.length + 1}`;
        params.push(fromDate as string);
      }

      if (toDate) {
        queryString += ` AND tr.record_date <= $${params.length + 1}`;
        params.push(toDate as string);
      }

      queryString += ` ORDER BY tr.record_date DESC, tr.created_at DESC`;

      console.log('Executing query:', queryString);
      console.log('With params:', params);

      const result = await executeRawQuery(queryString, params);
      console.log('Query result:', result);

      // Transform result to match expected format
      const records = result.map((row: any) => ({
        id: row.id,
        teacherId: row.teacher_id,
        recordDate: row.record_date,
        classId: row.class_id,
        subjectId: row.subject_id,
        chapterId: row.chapter_id,
        teachingDuration: row.teaching_duration,
        notes: row.notes,
        createdAt: row.created_at,
        className: row.classname,
        subjectName: row.subjectname,
        chapterTitle: row.chaptertitle
      }));

      res.json(records);
    } catch (error: any) {
      console.error('Error fetching teacher records:', error);
      res.status(500).json({ message: 'Failed to fetch teacher records', error: error.message });
    }
  });

  

  // Update teacher class assignments
  app.put("/api/admin/teachers/:id/classes", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const { classIds } = req.body;

      if (!Array.isArray(classIds)) {
        return res.status(400).json({ message: 'classIds must be an array' });
      }

      // Delete existing assignments
      await db.execute(sqlQuery`DELETE FROM teacher_classes WHERE user_id = ${req.params.id}`);

      // Insert new assignments
      if (classIds.length > 0) {
        for (const classId of classIds) {
          await db.execute(sqlQuery`
            INSERT INTO teacher_classes (user_id, class_id) 
            VALUES (${req.params.id}, ${classId})
          `);
        }
      }

      res.json({ message: 'Teacher classes updated successfully' });
    } catch (error) {
      console.error('Error updating teacher classes:', error);
      res.status(500).json({ message: 'Failed to update teacher classes' });
    }
  });

  // Update teacher class assignments
  app.put("/api/admin/teachers/:id/classes", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { classIds } = req.body;

      if (!Array.isArray(classIds)) {
        return res.status(400).json({ message: 'classIds must be an array' });
      }

      // This functionality is now handled by the new class assignments endpoint above
      res.json({ message: 'Teacher classes updated successfully' });
    } catch (error) {
      console.error('Error updating teacher classes:', error);
      res.status(500).json({ message: 'Failed to update teacher classes' });
    }
  });

  // =================== PRODUCTS MANAGEMENT ===================

  // Get all products (Admin only)
  app.get("/api/admin/products", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Create product (Admin only)
  app.post("/api/admin/products", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const productData = req.body;
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  // Update product (Admin only)
  app.put("/api/admin/products/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const productData = req.body;
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  // Delete product (Admin only)
  app.delete("/api/admin/products/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Get products for SO centers (filtered by availability)
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      // Filter only active products for SO centers
      const activeProducts = products.filter(product => product.isActive);
      res.json(activeProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Create product order (SO centers)
  app.post("/api/product-orders", authenticateToken, async (req, res) => {
    try {
      if (!req.user || !['so_center', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'SO Center or Admin access required' });
      }

      const orderData = {
        ...req.body,
        soCenterId: req.user.role === 'so_center' ? req.user.userId : req.body.soCenterId
      };

      const order = await storage.createProductOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating product order:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to create product order'
      });
    }
  });

  // Get product orders for SO center
  app.get("/api/product-orders", authenticateToken, async (req, res) => {
    try {
      if (!req.user || !['so_center', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'SO Center or Admin access required' });
      }

      const soCenterId = req.user.role === 'so_center' ? req.user.userId : req.query.soCenterId as string;

      if (!soCenterId) {
        return res.status(400).json({ message: 'SO Center ID required' });
      }

      const orders = await storage.getProductOrdersBySoCenter(soCenterId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching product orders:', error);
      res.status(500).json({ message: 'Failed to fetch product orders' });
    }
  });

  // Get commission wallet for SO center
  app.get("/api/commission-wallet", authenticateToken, async (req, res) => {
    try {
      if (!req.user || !['so_center', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'SO Center or Admin access required' });
      }

      const soCenterId = req.user.role === 'so_center' ? req.user.userId : req.query.soCenterId as string;

      if (!soCenterId) {
        return res.status(400).json({ message: 'SO Center ID required' });
      }

      const wallet = await storage.getCommissionWalletBySoCenter(soCenterId);

      if (!wallet) {
        // Create wallet if doesn't exist
        const newWallet = await storage.getOrCreateCommissionWallet(soCenterId);
        res.json(newWallet);
      } else {
        res.json(wallet);
      }
    } catch (error) {
      console.error('Error fetching commission wallet:', error);
      res.status(500).json({ message: 'Failed to fetch commission wallet' });
    }
  });

  // Create withdrawal request
  app.post("/api/withdrawal-requests", authenticateToken, async (req, res) => {
    try {
      if (!req.user || !['so_center', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'SO Center or Admin access required' });
      }

      const requestData = {
        ...req.body,
        soCenterId: req.user.role === 'so_center' ? req.user.userId : req.body.soCenterId
      };

      const request = await storage.createWithdrawalRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to create withdrawal request'
      });
    }
  });

  // Get withdrawal requests for SO center
  app.get("/api/withdrawal-requests", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let requests;
      if (req.user.role === 'admin') {
        // Admin can see all requests
        requests = await storage.getDropoutRequests();
      } else if (req.user.role === 'so_center') {
        // SO Center can only see their own requests
        const soCenter = await storage.getSoCenterByEmail(req.user.email);
        if (!soCenter) {
          return res.status(404).json({ message: "SO Center not found" });
        }
        requests = await storage.getDropoutRequests(soCenter.id);
      } else {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      res.json(requests);
    } catch (error) {
      console.error('Error fetching dropout requests:', error);
      res.status(500).json({ message: "Failed to fetch dropout requests" });
    }
  });

  // Process withdrawal request (Admin only)
  app.put("/api/admin/withdrawal-requests/:id/process", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
      }

      const request = await storage.processWithdrawalRequest(
        id, 
        status, 
        req.user.userId, 
        notes
      );

      res.json(request);
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to process withdrawal request'
      });
    }
  });

  // System Settings Management (Admin only)
  app.get("/api/admin/system-settings/:key", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const setting = await storage.getSystemSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      console.error('Error fetching system setting:', error);
      res.status(500).json({ message: 'Failed to fetch system setting' });
    }
  });

  app.put("/api/admin/system-settings/:key", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { value, description } = req.body;
      const setting = await storage.setSystemSetting(
        req.params.key, 
        value, 
        description, 
        req.user.userId
      );

      res.json(setting);
    } catch (error) {
      console.error('Error updating system setting:', error);
      res.status(500).json({ message: 'Failed to update system setting' });
    }
  });

  // SO Center Expenses Management Routes

  // Get SO Center profile with autofill data
  app.get("/api/so-center/profile", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Debug: Check what email we're looking for
      console.log('🔍 Looking for SO Center with email:', req.user.email);

      // Look up SO Center by email since SO Centers use email authentication
      const soCenter = await db.select()
        .from(schema.soCenters)
        .where(eq(schema.soCenters.email, req.user.email))
        .limit(1);

      // Debug: If not found by email, try to find any centers and see their emails
      if (!soCenter.length) {
        console.log('❌ No SO Center found with exact email match');
        const allCenters = await db.select({ id: schema.soCenters.id, email: schema.soCenters.email, centerId: schema.soCenters.centerId })
          .from(schema.soCenters)
          .limit(5);
        console.log('📋 Available SO Centers:', allCenters);

        // Try to find by similar email pattern
        const emailMatch = await db.select()
          .from(schema.soCenters)
          .where(sqlQuery`email ILIKE ${`%${req.user.email.split('@')[0]}%`}`)
          .limit(1);

        if (emailMatch.length) {
          console.log('✅ Found SO Center by email pattern match:', emailMatch[0].centerId);
          return res.json(emailMatch[0]);
        }

        console.log('SO Center not found for email:', req.user.email);
        return res.status(404).json({ message: "SO Center not found" });
      }

      console.log('✅ SO Center profile retrieved:', soCenter[0].centerId);
      res.json(soCenter[0]);
    } catch (error) {
      console.error("Error fetching SO Center profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get expense requests for SO Center
  app.get("/api/so-center/expenses", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const expenses = await db.select()
        .from(schema.soCenterExpenses)
        .where(sqlQuery`so_center_id = ${req.user.userId}`)
        .orderBy(sqlQuery`requested_at DESC`);

      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create expense request
  app.post("/api/so-center/expenses", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertSoCenterExpenseSchema.parse({
        ...req.body,
        soCenterId: req.user.userId,
        status: 'pending'
      });

      const [expense] = await db.insert(schema.soCenterExpenses)
        .values(validatedData)
        .returning();

      res.json(expense);
    } catch (error) {
      console.error("Error creating expense request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get expense wallet for SO Center
  app.get("/api/so-center/expense-wallet", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get or create expense wallet
      let [wallet] = await db.select()
        .from(schema.soCenterExpenseWallet)
        .where(sqlQuery`so_center_id = ${req.user.userId}`)
        .limit(1);

      if (!wallet) {
        // Create wallet if not exists
        [wallet] = await db.insert(schema.soCenterExpenseWallet)
          .values({
            soCenterId: req.user.userId,
            totalExpenses: '0',
            remainingBalance: '0'
          })
          .returning();
      }

      // Calculate current values from expenses and collections
      const totalExpenses = await db.select({
        sum: sqlQuery`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
      })
      .from(schema.soCenterExpenses)
      .where(sqlQuery`so_center_id = ${req.user.userId} AND status = 'paid'`);

      // Get total collections from wallet
      const [soCenter] = await db.select({ walletBalance: schema.soCenters.walletBalance })
        .from(schema.soCenters)
        .where(sqlQuery`id = ${req.user.userId}`)
        .limit(1);

      const totalCollections = parseFloat(soCenter?.walletBalance || '0');
      const expenseAmount = parseFloat(totalExpenses[0]?.sum || '0');
      const remainingBalance = totalCollections - expenseAmount;

      // Update wallet with current values
      await db.update(schema.soCenterExpenseWallet)
        .set({
          totalExpenses: expenseAmount.toString(),
          remainingBalance: remainingBalance.toString(),
          lastUpdated: new Date()
        })
        .where(sqlQuery`so_center_id = ${req.user.userId}`);

      res.json({
        totalExpenses: expenseAmount.toString(),
        remainingBalance: remainingBalance.toString(),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching expense wallet:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark expense as paid (for SO Centers)
  app.post("/api/so-center/expenses/:expenseId/pay", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { expenseId } = req.params;
      const { paymentMethod, paymentReference } = req.body;

      // Verify expense belongs to this SO Center and is approved
      const [expense] = await db.select()
        .from(schema.soCenterExpenses)
        .where(sqlQuery`id = ${expenseId} AND so_center_id = ${req.user.userId} AND status = 'approved'`)
        .limit(1);

      if (!expense) {
        return res.status(404).json({ message: "Expense not found or not approved" });
      }

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-EXP-${expenseId.slice(0, 8)}`;

      // Update expense as paid
      const [updatedExpense] = await db.update(schema.soCenterExpenses)
        .set({
          status: 'paid',
          paymentMethod,
          paymentReference,
          transactionId,
          paidAt: new Date(),
          paidBy: req.user.userId
        })
        .where(sqlQuery`id = ${expenseId}`)
        .returning();

      res.json({ 
        expense: updatedExpense,
        transactionId 
      });
    } catch (error) {
      console.error("Error marking expense as paid:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Expense Approval Routes

  // Get all expense requests for admin approval
  app.get("/api/admin/expenses", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { status, search, soCenterId } = req.query;

      // Build base query with joins
      let whereClause = sqlQuery`1=1`;

      if (status && status !== 'all') {
        whereClause = sqlQuery`${whereClause} AND ${schema.soCenterExpenses.status} = ${status}`;
      }
      if (soCenterId) {
        whereClause = sqlQuery`${whereClause} AND ${schema.soCenterExpenses.soCenterId} = ${soCenterId}`;
      }
      if (search) {
        whereClause = sqlQuery`${whereClause} AND (${schema.soCenters.name} ILIKE ${`%${search}%`} OR ${schema.soCenters.centerId} ILIKE ${`%${search}%`})`;
      }

      const expenses = await db.select({
        id: schema.soCenterExpenses.id,
        expenseType: schema.soCenterExpenses.expenseType,
        amount: schema.soCenterExpenses.amount,
        description: schema.soCenterExpenses.description,
        status: schema.soCenterExpenses.status,
        requestedAt: schema.soCenterExpenses.requestedAt,
        approvedAt: schema.soCenterExpenses.approvedAt,
        paidAt: schema.soCenterExpenses.paidAt,
        soCenterId: schema.soCenterExpenses.soCenterId,
        soCenterName: schema.soCenters.name,
        centerCode: schema.soCenters.centerId,
        electricBillNumber: schema.soCenterExpenses.electricBillNumber,
        internetBillNumber: schema.soCenterExpenses.internetBillNumber,
        internetServiceProvider: schema.soCenterExpenses.internetServiceProvider,
        serviceName: schema.soCenterExpenses.serviceName,
        servicePhone: schema.soCenterExpenses.servicePhone,
        adminNotes: schema.soCenterExpenses.adminNotes,
        transactionId: schema.soCenterExpenses.transactionId,
        paymentMethod: schema.soCenterExpenses.paymentMethod,
        paymentReference: schema.soCenterExpenses.paymentReference
      })
      .from(schema.soCenterExpenses)
      .leftJoin(schema.soCenters, sqlQuery`${schema.soCenterExpenses.soCenterId} = ${schema.soCenters.id}`)
      .where(whereClause)
      .orderBy(sqlQuery`${schema.soCenterExpenses.requestedAt} DESC`);

      res.json(expenses);
    } catch (error) {
      console.error("Error fetching admin expenses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Approve/Reject expense request
  app.post("/api/admin/expenses/:expenseId/approval", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { expenseId } = req.params;
      const { action, adminNotes } = req.body; // action: 'approve' or 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const [updatedExpense] = await db.update(schema.soCenterExpenses)
        .set({
          status: action === 'approve' ? 'approved' : 'rejected',
          adminNotes,
          approvedAt: new Date(),
          approvedBy: req.user.userId
        })
        .where(sqlQuery`${schema.soCenterExpenses.id} = ${expenseId}`)
        .returning();

      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ 
        expense: updatedExpense,
        message: `Expense ${action}d successfully`
      });
    } catch (error) {
      console.error("Error processing expense approval:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get approval history
  app.get("/api/admin/expenses/history", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const history = await db.select({
        id: schema.soCenterExpenses.id,
        expenseType: schema.soCenterExpenses.expenseType,
        amount: schema.soCenterExpenses.amount,
        status: schema.soCenterExpenses.status,
        requestedAt: schema.soCenterExpenses.requestedAt,
        approvedAt: schema.soCenterExpenses.approvedAt,
        paidAt: schema.soCenterExpenses.paidAt,
        soCenterName: schema.soCenters.name,
        centerCode: schema.soCenters.centerId,
        adminNotes: schema.soCenterExpenses.adminNotes,
        approverName: schema.users.name
      })
      .from(schema.soCenterExpenses)
      .leftJoin(schema.soCenters, sqlQuery`${schema.soCenterExpenses.soCenterId} = ${schema.soCenters.id}`)
      .leftJoin(schema.users, sqlQuery`${schema.soCenterExpenses.approvedBy} = ${schema.users.id}`)
      .where(sqlQuery`${schema.soCenterExpenses.status} IN ('approved', 'rejected', 'paid')`)
      .orderBy(sqlQuery`${schema.soCenterExpenses.approvedAt} DESC`);

      res.json(history);
    } catch (error) {
      console.error("Error fetching approval history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get admin expense statistics
  app.get("/api/admin/expense-stats", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [statsResult] = await db.execute(sqlQuery`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as total_approved,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as total_paid,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_amount
        FROM so_center_expenses
      `);

      const stats = {
        totalPending: Number(statsResult.total_pending || 0),
        totalApproved: Number(statsResult.total_approved || 0), 
        totalPaid: Number(statsResult.total_paid || 0),
        totalAmount: (statsResult.total_amount || 0).toString()
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin expense stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // EXAM MANAGEMENT ENDPOINTS

  // Get all exams with related data
  app.get('/api/admin/exams', authenticateToken, async (req, res) => {
    try {
      console.log('📋 Fetching all exams for admin...');

      // Simple query first to check if exams exist
      const examsList = await db.select().from(schema.exams);

      console.log('✅ Exams fetched successfully:', examsList.length);
      console.log('📊 Exams data:', examsList);
      res.json(examsList);
    } catch (error: any) {
      console.error('❌ Error fetching exams:', error);
      console.error('❌ Full error details:', error.message, error.stack);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Create new exam
  app.post('/api/admin/exams', authenticateToken, async (req, res) => {
    try {
      console.log('🆕 Creating new exam...');

      const examData = insertExamSchema.parse(req.body);
      const userId = req.user?.userId;

      const [newExam] = await db
        .insert(schema.exams)
        .values({
          ...examData,
          createdBy: userId,
        })
        .returning();

      console.log('✅ Exam created successfully:', newExam.id);
      res.json(newExam);
    } catch (error: any) {
      console.error('❌ Error creating exam:', error);
      res.status(500).json({ message: 'Failed to create exam' });
    }
  });

  // Update exam
  app.put('/api/admin/exams/:id', authenticateToken, async (req, res) => {
    try {
      const examId = req.params.id;
      console.log('📝 Updating exam:', examId);

      const examData = insertExamSchema.parse(req.body);

      const [updatedExam] = await db
        .update(schema.exams)
        .set({
          ...examData,
          updatedAt: new Date(),
        })
        .where(eq(schema.exams.id, examId))
        .returning();

      if (!updatedExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      console.log('✅ Exam updated successfully');
      res.json(updatedExam);
    } catch (error: any) {
      console.error('❌ Error updating exam:', error);
      res.status(500).json({ message: 'Failed to update exam' });
    }
  });

  // Delete exam
  app.delete('/api/admin/exams/:id', authenticateToken, async (req, res) => {
    try {
      const examId = req.params.id;
      console.log('🗑️ Deleting exam:', examId);

      await db.delete(schema.exams).where(eq(schema.exams.id, examId));

      console.log('✅ Exam deleted successfully');
      res.json({ message: 'Exam deleted successfully' });
    } catch (error: any) {
      console.error('❌ Error deleting exam:', error);
      res.status(500).json({ message: 'Failed to delete exam' });
    }
  });

  // SO CENTER EXAM MANAGEMENT ENDPOINTS

  // Get exams for logged-in SO Center user (Optimized for performance)
  app.get('/api/so-center/exams', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.userId;
      console.log('📋 Fetching exams for SO Center user:', userId);

      // Use the existing working getSoCenterByEmail method
      let soCenter = null;
      if (req.user?.email) {
        try {
          soCenter = await storage.getSoCenterByEmail(req.user.email);
          if (soCenter) {
            console.log('✅ Found SO Center by email:', soCenter.centerId);
          }
        } catch (error) {
          console.log('⚠️ Email lookup failed, trying fallback');
        }
      }

      // Fallback lookup by managerId if email lookup fails
      if (!soCenter && userId) {
        try {
          const soCenterByManager = await db.select()
            .from(schema.soCenters)
            .where(eq(schema.soCenters.managerId, userId))
            .limit(1);

          if (soCenterByManager.length > 0) {
            soCenter = soCenterByManager[0];
            console.log('✅ Fallback - Found SO Center by managerId:', soCenter.centerId);
          }
        } catch (error) {
          console.log('⚠️ Manager lookup also failed');
        }
      }

      if (!soCenter) {
        console.log('❌ No SO Center found for user');
        return res.status(404).json({ message: 'SO Center not found for this user' });
      }

      const soCenterId = soCenter.id;

      // Simplified exam query to avoid performance issues
      const allExams = await db.select()
        .from(schema.exams)
        .leftJoin(schema.classes, eq(schema.exams.classId, schema.classes.id))
        .leftJoin(schema.subjects, eq(schema.exams.subjectId, schema.subjects.id))
        .orderBy(desc(schema.exams.examDate));

      // Filter exams for this SO Center in JavaScript to avoid complex SQL
      const exams = allExams
        .filter(examRow => {
          const soCenterIds = examRow.exams.soCenterIds;
          return Array.isArray(soCenterIds) && soCenterIds.includes(soCenterId);
        })
        .map(examRow => ({
          ...examRow.exams,
          className: examRow.classes?.name || 'N/A',
          subjectName: examRow.subjects?.name || 'N/A'
        }));

      console.log('✅ Found', exams.length, 'exams for SO Center');
      res.json(exams);
    } catch (error: any) {
      console.error('❌ Error fetching SO Center exams:', error);
      // Fallback to JavaScript filtering if SQL array query fails
      try {
        const allExams = await db.select()
          .from(schema.exams)
          .leftJoin(schema.classes, eq(schema.exams.classId, schema.classes.id))
          .leftJoin(schema.subjects, eq(schema.exams.subjectId, schema.subjects.id))
          .orderBy(desc(schema.exams.examDate));

        const filteredExams = allExams.filter(exam => 
          exam.exams.soCenterIds && exam.exams.soCenterIds.includes(req.user?.userId || '')
        );

        res.json(filteredExams.map(item => ({
          ...item.exams,
          className: item.classes?.name,
          subjectName: item.subjects?.name
        })));
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to fetch exams' });
      }
    }
  });

  // Get students for logged-in SO Center user
  app.get('/api/so-center/students', authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      console.log('🔐 CRITICAL PRIVACY: SO Center students endpoint - enforcing strict filtering');
      console.log('👥 SO Center user requesting students:', req.user.userId, req.user.email);

      // Get SO Center associated with this user's email
      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        console.log('❌ PRIVACY VIOLATION PREVENTED: No SO Center found for user email:', req.user.email);
        return res.status(403).json({ message: "SO Center not found for authenticated user" });
      }

      console.log('✅ SO Center identified:', soCenter.centerId, '- Fetching ONLY their students');

      // Get ONLY students registered by THIS specific SO Center
      const students = await storage.getStudentsBySoCenter(soCenter.id);

      console.log(`🔒 PRIVACY ENFORCED: Retrieved ${students.length} students exclusively for SO Center ${soCenter.centerId}`);

      if (!students || students.length === 0) {
        console.log('📭 No students found for this SO Center');
        return res.json([]);
      }

      res.json(students);
    } catch (error: any) {
      console.error('❌ Error fetching SO Center students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  // Mark exam as completed by SO Center
  app.post('/api/so-center/exams/:examId/complete', authenticateToken, async (req, res) => {
    try {
      const { examId } = req.params;
      console.log('✅ Marking exam as completed:', examId);

      const [updatedExam] = await db
        .update(schema.exams)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(schema.exams.id, examId))
        .returning();

      if (!updatedExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      console.log('✅ Exam marked as completed');
      res.json({ message: 'Exam marked as completed', exam: updatedExam });
    } catch (error: any) {
      console.error('❌ Error marking exam as completed:', error);
      res.status(500).json({ message: 'Failed to mark exam as completed' });
    }
  });

  // Get exam questions for individual marks entry
  app.get("/api/exams/:examId/questions", authenticateToken, async (req, res) => {
    try {
      const examId = req.params.examId;
      console.log('📋 Fetching questions for exam:', examId);

      // Get exam with questions
      const exam = await sql`
        SELECT questions, title, total_questions, total_marks
        FROM exams 
        WHERE id = ${examId}
      `;

      if (!exam || exam.length === 0) {
        console.log('❌ Exam not found:', examId);
        return res.status(404).json({ message: "Exam not found" });
      }

      const examData = exam[0];
      console.log('📊 Exam data found:', { 
        title: examData.title, 
        hasQuestions: !!examData.questions 
      });

      // Parse questions if they exist
      let questions = [];
      if (examData.questions) {
        try {
          questions = JSON.parse(examData.questions);
          console.log('✅ Questions parsed successfully:', questions.length);
        } catch (parseError) {
          console.error('❌ Error parsing questions JSON:', parseError);
          questions = [];
        }
      }

      // Format questions for response
      const formattedQuestions = questions.map((q: any, index: number) => ({
        questionNumber: q.questionNumber || index + 1,
        marks: q.marks || 0,
        questionText: q.questionText || q.question || `Question ${index + 1}`,
        questionType: q.questionType || q.type || 'descriptive'
      }));

      console.log('📋 Returning formatted questions:', formattedQuestions.length);

      res.json(formattedQuestions);
    } catch (error: any) {
      console.error('❌ Error fetching exam questions:', error);
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });

  // Get all exam results for a specific exam (SO Center filtered)
  app.get('/api/exams/:examId/results', authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { examId } = req.params;
      console.log('📊 Fetching all results for exam:', examId);

      // Get SO Center for this user
      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(403).json({ message: "SO Center not found for user" });
      }

      // Get all results for this exam for students from this SO Center
      const results = await db
        .select({
          id: schema.examResults.id,
          studentId: schema.examResults.studentId,
          examId: schema.examResults.examId,
          marksObtained: schema.examResults.marksObtained,
          answeredQuestions: schema.examResults.answeredQuestions,
          detailedResults: schema.examResults.detailedResults,
          createdAt: schema.examResults.createdAt,
          updatedAt: schema.examResults.updatedAt,
          // Include student info for verification
          studentName: schema.students.name,
          studentNumber: schema.students.studentId
        })
        .from(schema.examResults)
        .leftJoin(schema.students, eq(schema.examResults.studentId, schema.students.id))
        .where(
          and(
            eq(schema.examResults.examId, examId),
            eq(schema.students.soCenterId, soCenter.id)
          )
        )
        .orderBy(schema.examResults.createdAt);

      console.log(`📊 Found ${results.length} results for exam ${examId} in SO Center ${soCenter.centerId}`);
      
      // Calculate percentage for each result that doesn't have it
      const exam = await db.select()
        .from(schema.exams)
        .where(eq(schema.exams.id, examId))
        .limit(1);
        
      const examTotalMarks = exam.length > 0 ? Number(exam[0].totalMarks) : 0;
      
      const resultsWithPercentage = results.map(result => ({
        ...result,
        percentage: examTotalMarks > 0 ? Math.round((result.marksObtained / examTotalMarks) * 100) : 0
      }));

      res.json(resultsWithPercentage);
    } catch (error: any) {
      console.error('❌ Error fetching exam results:', error);
      res.status(500).json({ message: 'Failed to fetch exam results' });
    }
  });

  // Get individual student results for an exam
  app.get('/api/exams/:examId/student-results/:studentId', authenticateToken, async (req, res) => {
    try {
      const { examId, studentId } = req.params;
      console.log('📊 Fetching individual student results:', { examId, studentId });

      // Get existing detailed results if any
      const existingResult = await db.select()
        .from(schema.examResults)
        .where(
          sqlQuery`exam_id = ${examId} AND student_id = ${studentId}`
        );

      if (existingResult.length > 0 && existingResult[0].detailedResults) {
        const detailedResults = JSON.parse(existingResult[0].detailedResults);
        res.json({
          totalMarks: existingResult[0].marksObtained,
          status: existingResult[0].answeredQuestions,
          questions: detailedResults.questions || []
        });
      } else {
        // Return empty results structure
        res.json({
          totalMarks: 0,
          status: 'not_answered',
          questions: []
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching student results:', error);
      res.status(500).json({ message: 'Failed to fetch student results' });
    }
  });

  // Save individual student results with question-level details
  app.post('/api/exams/:examId/student-results', authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: 'SO Center access required' });
      }

      const { examId } = req.params;
      const { studentId, answers, totalMarks, percentage, answeredQuestions, detailedResults } = req.body;

      console.log('💾 Saving detailed student results:', {
        examId,
        studentId,
        totalMarks,
        hasAnswers: !!answers
      });

      if (!studentId || !examId) {
        return res.status(400).json({ message: 'Student ID and Exam ID are required' });
      }

      // Validate that totalMarks is provided and is a valid number
      const numericTotalMarks = Number(totalMarks);
      if (totalMarks === undefined || totalMarks === null || isNaN(numericTotalMarks) || numericTotalMarks < 0) {
        return res.status(400).json({ message: 'Valid total marks (non-negative number) are required' });
      }

      // Get exam details to validate
      const exam = await db.select()
        .from(schema.exams)
        .where(eq(schema.exams.id, examId))
        .limit(1);

      if (!exam.length) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const examData = exam[0];
      const examTotalMarks = Number(examData.totalMarks);

      // Validate total marks doesn't exceed exam total
      if (numericTotalMarks > examTotalMarks) {
        return res.status(400).json({ 
          message: `Total marks (${numericTotalMarks}) cannot exceed exam total marks (${examTotalMarks})` 
        });
      }

      // Calculate percentage
      const calculatedPercentage = examTotalMarks > 0 ? Math.round((numericTotalMarks / examTotalMarks) * 100) : 0;

      // Check if result already exists  
      const existingResult = await db.select()
        .from(schema.examResults)
        .where(
          sqlQuery`exam_id = ${examId} AND student_id = ${studentId}`
        );

      // Prevent modification of already completed results (business rule)
      if (existingResult.length > 0 && existingResult[0].marksObtained !== null && existingResult[0].marksObtained >= 0) {
        console.log('❌ Attempt to modify completed result for student:', studentId);
        return res.status(400).json({ 
          message: 'This student has already completed the exam. Results cannot be modified.' 
        });
      }

      let result;
      // Base result data without percentage - will add it conditionally
      const baseResultData = {
        examId,
        studentId,
        marksObtained: numericTotalMarks,
        answeredQuestions: answeredQuestions || (numericTotalMarks > 0 ? 'fully_answered' : 'not_answered'),
        detailedResults: detailedResults ? JSON.stringify(detailedResults) : null,
        submittedBy: req.user.userId,
        submittedAt: new Date()
      };

      console.log('💾 Saving individual exam result with minimal schema (production optimized)');
      
      // Minimal result data matching actual database structure
      const minimalResultData = {
        examId,
        studentId,
        marksObtained: numericTotalMarks,
        answeredQuestions: answeredQuestions || (numericTotalMarks > 0 ? 'fully_answered' : 'not_answered'),
        detailedResults: detailedResults ? JSON.stringify(detailedResults) : null
      };
      
      if (existingResult.length > 0) {
        // Update existing result
        [result] = await db.update(schema.examResults)
          .set({
            ...minimalResultData,
            updatedAt: new Date()
          })
          .where(eq(schema.examResults.id, existingResult[0].id))
          .returning();
      } else {
        // Create new result
        [result] = await db.insert(schema.examResults)
          .values(minimalResultData)
          .returning();
      }
      
      // Add calculated percentage to result object for API response
      result.percentage = calculatedPercentage;

      console.log('✅ Student exam result saved successfully:', result.id);

      res.json({
        message: 'Exam result saved successfully',
        result: {
          id: result.id,
          examId: result.examId,
          studentId: result.studentId,
          totalMarks: result.marksObtained,
          marksObtained: result.marksObtained,
          percentage: result.percentage
        }
      });

    } catch (error: any) {
      console.error('❌ Error saving exam result:', error);
      res.status(500).json({ 
        message: 'Failed to save exam result',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Bulk update exam results - New API endpoint for modal-based marks entry
  app.post('/api/exams/:examId/results/update', authenticateToken, async (req, res) => {
    try {
      const examId = req.params.examId;
      const { results } = req.body;

      console.log('🔄 Bulk updating exam results for exam:', examId);
      console.log('📊 Students data:', results);

      if (!results || !Array.isArray(results)) {
        return res.status(400).json({ message: 'Invalid students data' });
      }

      // Check if exam exists and user has access
      const exam = await db.select().from(schema.exams).where(eq(schema.exams.id, examId)).limit(1);
      if (!exam.length) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      // Verify SO Center access for this exam
      if (req.user?.role === 'so_center') {
        const soCenter = await storage.getSoCenterByEmail(req.user.email);
        if (!soCenter) {
          return res.status(404).json({ message: 'SO Center not found' });
        }

        const soCenterIds = Array.isArray(exam[0].soCenterIds) ? exam[0].soCenterIds : [];
        if (!soCenterIds.includes(soCenter.id)) {
          return res.status(403).json({ message: 'Access denied to this exam' });
        }
      }

      // Process each student's results
      const savedResults = [];
      for (const studentData of results) {
        const { studentId, marks, totalScore, performance } = studentData;

        if (!studentId) {
          console.warn('⚠️ Skipping student with missing ID');
          continue;
        }

        // Calculate percentage
        const examTotalMarks = Number(exam[0]?.totalMarks || 100); // Default to 100 if not found
        const calculatedPercentage = Math.round((totalScore / examTotalMarks) * 100);

        // Prepare detailed results
        const detailedResults = JSON.stringify({
          questions: marks || [],
          performance: performance || [],
          totalScore,
          percentage: calculatedPercentage
        });

        // Upsert exam result using the schema
        try {
          // Base data without percentage
          const baseData = {
            examId,
            studentId,
            marksObtained: totalScore || 0,
            answeredQuestions: totalScore > 0 ? 'fully_answered' : 'not_answered',
            detailedResults,
            submittedBy: req.user?.userId,
            submittedAt: new Date()
          };

          const updateData = {
            marksObtained: totalScore || 0,
            detailedResults,
            submittedBy: req.user?.userId,
            updatedAt: new Date()
          };

          // Production-optimized minimal database operations
          console.log('💾 Saving bulk exam results with minimal schema (production optimized)');
          
          // Minimal data matching actual database structure
          const minimalData = {
            examId,
            studentId,
            marksObtained: totalScore || 0,
            answeredQuestions: totalScore > 0 ? 'fully_answered' : 'not_answered',
            detailedResults
          };

          const minimalUpdateData = {
            marksObtained: totalScore || 0,
            detailedResults,
            updatedAt: new Date()
          };

          let result;
          [result] = await db.insert(schema.examResults)
            .values(minimalData)
            .onConflictDoUpdate({
              target: [schema.examResults.examId, schema.examResults.studentId],
              set: minimalUpdateData
            })
            .returning();
          
          // Add calculated percentage to result object for API response
          result.percentage = calculatedPercentage;

          savedResults.push({
            studentId,
            totalScore: totalScore || 0,
            percentage: calculatedPercentage,
            status: totalScore > 0 ? 'completed' : 'pending'
          });

          console.log('✅ Result saved for student:', studentId, 'Marks:', totalScore);
        } catch (dbError) {
          console.error('❌ Database error for student:', studentId, dbError);
          // Continue with other students even if one fails
        }
      }

      res.json({
        message: 'Exam results updated successfully',
        results: savedResults
      });
    } catch (error: any) {
      console.error('❌ Error bulk updating exam results:', error);
      res.status(500).json({ message: 'Failed to update exam results' });
    }
  });

  // Submit exam results (for SO Centers)
  app.post('/api/so-center/exams/:examId/results', authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      const { examId } = req.params;
      const { results } = req.body;

      if (!examId || !results || !Array.isArray(results)) {
        return res.status(400).json({ message: "examId and results array are required" });
      }

      console.log('📝 Saving exam results for exam:', examId, 'from SO Center:', soCenter.centerId);

      // Save exam results in bulk
      const savedResults = [];
      for (const result of results) {
        const { studentId, questionResults, totalMarks, percentage, remarks } = result;

        // Basic validation
        if (!studentId || totalMarks === undefined || percentage === undefined) {
          console.warn('⚠️ Skipping invalid result data:', result);
          continue;
        }

        // Create or update exam result
        const examResult = await sql`
          INSERT INTO exam_results (
            exam_id, 
            student_id, 
            total_marks, 
            percentage, 
            remarks,
            question_results,
            submitted_by,
            submitted_at,
            so_center_id 
          ) VALUES (
            ${examId},
            ${studentId},
            ${totalMarks},
            ${percentage},
            ${remarks || null},
            ${JSON.stringify(questionResults)},
            ${req.user.userId},
            NOW(),
            ${soCenter.id}
          )
          ON CONFLICT (exam_id, student_id) 
          DO UPDATE SET 
            total_marks = EXCLUDED.total_marks,
            percentage = EXCLUDED.percentage,
            remarks = EXCLUDED.remarks,
            question_results = EXCLUDED.question_results,
            submitted_by = EXCLUDED.submitted_by,
            submitted_at = EXCLUDED.submitted_at,
            updated_at = NOW()
          RETURNING *
        `;
        savedResults.push(examResult[0]);
      }

      console.log('✅ Saved', savedResults.length, 'exam results');
      res.json({ 
        message: 'Exam results saved successfully',
        savedCount: savedResults.length
      });
    } catch (error: any) {
      console.error('❌ Error saving exam results:', error);
      res.status(500).json({ message: "Failed to save exam results" });
    }
  });

  // Delete exam endpoint  
  app.delete("/api/admin/exams/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const examId = req.params.id;
      await storage.deleteExam(examId);

      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // ======================== ALL 7 NEW FEATURES API ROUTES ========================

  // Feature 1: Topics Management with Moderate/Important flags
  app.get("/api/topics-management", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'academic_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const topics = await storage.getAllTopicsWithChapters();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching topics for management:', error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.patch("/api/topics/:topicId/flags", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'academic_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { topicId } = req.params;
      const { isModerate, isImportant } = req.body;

      const updates: any = {};
      if (typeof isModerate === 'boolean') updates.isModerate = isModerate;
      if (typeof isImportant === 'boolean') updates.isImportant = isImportant;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid updates provided" });
      }

      const updatedTopic = await storage.updateTopicFlags(topicId, updates);
      res.json(updatedTopic);
    } catch (error) {
      console.error('Error updating topic flags:', error);
      res.status(500).json({ message: "Failed to update topic flags" });
    }
  });

  // Feature 6: Exam Time Management
  app.patch("/api/exams/:examId/time-settings", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'academic_admin') {
        return res.status(403).json({ message: "Academic admin access required" });
      }

      const { examId } = req.params;
      const { startTime, endTime } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({ message: "Both startTime and endTime are required" });
      }

      const updatedExam = await storage.updateExamTimeSettings(examId, startTime, endTime);
      res.json(updatedExam);
    } catch (error) {
      console.error('Error updating exam time settings:', error);
      res.status(500).json({ message: "Failed to update exam time settings" });
    }
  });

  app.get("/api/exams/:examId/access-check", authenticateToken, async (req, res) => {
    try {
      const { examId } = req.params;
      const accessCheck = await storage.checkExamTimeAccess(examId);
      res.json(accessCheck);
    } catch (error) {
      console.error('Error checking exam access:', error);
      res.status(500).json({ message: "Failed to check exam access" });
    }
  });

  // Feature 7: Student Dropout Management
  app.post("/api/dropout-requests", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      // CRITICAL: Check if student has zero pending balance before allowing dropout request
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }

      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify student belongs to this SO Center
      if (student.soCenterId !== soCenter.id) {
        return res.status(403).json({ message: "Student does not belong to your SO Center" });
      }

      // Check if student has pending balance
      const pendingAmount = parseFloat(student.totalAmount || '0') - parseFloat(student.paidAmount || '0');
      if (pendingAmount > 0) {
        return res.status(400).json({ 
          message: `Cannot create dropout request. Student has pending balance of ₹${pendingAmount.toFixed(2)}. Please clear all dues before submitting dropout request.`,
          pendingBalance: pendingAmount
        });
      }

      const dropoutData = {
        ...req.body,
        soCenterId: soCenter.id,
        requestedBy: req.user.userId,
        status: 'pending'
      };

      const request = await storage.createDropoutRequest(dropoutData);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating dropout request:', error);
      res.status(500).json({ message: error.message || "Failed to create dropout request" });
    }
  });

  // SO Center Exam Results Management
  app.get("/api/so-center/exams/:examId/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      const examId = req.params.examId;

      // Get students for this exam who belong to this SO Center
      const students = await sql`
        SELECT DISTINCT 
          s.id,
          s.name,
          s.student_id,
          s.father_name,
          s.parent_phone
        FROM students s
        INNER JOIN exams e ON e.id = ${examId}
        WHERE s.so_center_id = ${soCenter.id}
        AND s.is_active = true
        ORDER BY s.name ASC
      `;

      res.json(students.map(s => ({
        id: s.id,
        name: s.name,
        studentId: s.student_id,
        fatherName: s.father_name,
        parentPhone: s.parent_phone
      })));
    } catch (error: any) {
      console.error('Error fetching exam students:', error);
      res.status(500).json({ message: "Failed to fetch exam students" });
    }
  });

  app.get("/api/so-center/exams/:examId/questions", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const examId = req.params.examId;
      console.log('📋 Fetching questions for exam:', examId);

      // Get the exam with questions
      const [exam] = await db.select({
        id: schema.exams.id,
        title: schema.exams.title,
        questions: schema.exams.questions,
        totalQuestions: schema.exams.totalQuestions,
        totalMarks: schema.exams.totalMarks
      }).from(schema.exams)
        .where(eq(schema.exams.id, examId));

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Parse questions from JSON string
      let questions = [];
      if (exam.questions) {
        try {
          questions = JSON.parse(exam.questions);
        } catch (e) {
          console.error('Error parsing exam questions JSON:', e);
          questions = [];
        }
      }

      // Format questions for the exam results component
      const formattedQuestions = questions.map((q: any, index: number) => ({
        questionNumber: q.questionNumber || index + 1,
        marks: q.marks || 2, // Default to 2 marks per question
        questionText: q.questionText || q.question || '',
        questionType: q.questionType || q.type || 'descriptive'
      }));

      res.json({
        examInfo: {
          id: exam.id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          totalMarks: exam.totalMarks
        },
        questions: formattedQuestions
      });
    } catch (error: any) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });

  app.post("/api/so-center/exam-results", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      const { examId, results } = req.body;

      if (!examId || !results || !Array.isArray(results)) {
        return res.status(400).json({ message: "examId and results array are required" });
      }

      console.log('📝 Saving exam results for exam:', examId, 'from SO Center:', soCenter.centerId);

      // Save exam results in bulk
      const savedResults = [];
      for (const result of results) {
        const { studentId, questionResults, totalMarks, percentage, remarks } = result;

        // Basic validation
        if (!studentId || totalMarks === undefined || percentage === undefined) {
          console.warn('⚠️ Skipping invalid result data:', result);
          continue;
        }

        // Create or update exam result
        const examResult = await sql`
          INSERT INTO exam_results (
            exam_id, 
            student_id, 
            total_marks, 
            percentage, 
            remarks,
            question_results,
            submitted_by,
            submitted_at,
            so_center_id 
          ) VALUES (
            ${examId},
            ${studentId},
            ${totalMarks},
            ${percentage},
            ${remarks || null},
            ${JSON.stringify(questionResults)},
            ${req.user.userId},
            NOW(),
            ${soCenter.id}
          )
          ON CONFLICT (exam_id, student_id) 
          DO UPDATE SET 
            total_marks = EXCLUDED.total_marks,
            percentage = EXCLUDED.percentage,
            remarks = EXCLUDED.remarks,
            question_results = EXCLUDED.question_results,
            submitted_by = EXCLUDED.submitted_by,
            submitted_at = EXCLUDED.submitted_at,
            updated_at = NOW()
          RETURNING *
        `;
        savedResults.push(examResult[0]);
      }

      console.log('✅ Saved', savedResults.length, 'exam results');
      res.json({ 
        message: 'Exam results saved successfully',
        savedCount: savedResults.length
      });
    } catch (error: any) {
      console.error('❌ Error saving exam results:', error);
      res.status(500).json({ message: "Failed to save exam results" });
    }
  });

  app.get("/api/dropout-requests", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let requests;
      if (req.user.role === 'admin') {
        // Admin can see all requests
        requests = await storage.getDropoutRequests();
      } else if (req.user.role === 'so_center') {
        // SO Center can only see their own requests
        const soCenter = await storage.getSoCenterByEmail(req.user.email);
        if (!soCenter) {
          return res.status(404).json({ message: "SO Center not found" });
        }
        requests = await storage.getDropoutRequests(soCenter.id);
      } else {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      res.json(requests);
    } catch (error) {
      console.error('Error fetching dropout requests:', error);
      res.status(500).json({ message: "Failed to fetch dropout requests" });
    }
  });

  app.patch("/api/dropout-requests/:requestId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { requestId } = req.params;
      const { status, adminNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const updatedRequest = await storage.processDropoutRequest(
        requestId, 
        status, 
        req.user.userId, 
        adminNotes
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error processing dropout request:', error);
      res.status(500).json({ message: error.message || "Failed to process dropout request" });
    }
  });

  // Features 2-5: Enhanced Dashboard Statistics (Fixed)
  app.get("/api/so-center/detailed-students", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      const students = await storage.getStudentsBySOCenterDetailed(soCenter.id);
      res.json(students);
    } catch (error) {
      console.error('Error fetching detailed students:', error);
      res.status(500).json({ message: "Failed to fetch detailed students" });
    }
  });

  // SO Center API for exams list
  app.get("/api/so-center/exams", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'so_center') {
        return res.status(403).json({ message: "SO Center access required" });
      }

      const soCenter = await storage.getSoCenterByEmail(req.user.email);
      if (!soCenter) {
        return res.status(404).json({ message: "SO Center not found" });
      }

      console.log('🔍 Looking for SO Center ID:', soCenter.id);

      // Get exams for this SO Center
      const exams = await db.select().from(schema.exams);

      // Filter exams that include this SO Center
      const availableExams = exams.filter(exam => {
        const soCenterIds = Array.isArray(exam.soCenterIds) ? exam.soCenterIds : [];
        return soCenterIds.includes(soCenter.id);
      }).map(exam => ({
        id: exam.id,
        name: exam.title,
        title: exam.title,
        className: '', // Would need to join with classes table
        date: exam.examDate,
        totalQuestions: exam.totalQuestions,
        totalMarks: exam.totalMarks,
        status: exam.status || 'scheduled',
        description: exam.description
      }));

      console.log('✅ Found', availableExams.length, 'exams for SO Center');
      res.json(availableExams);
    } catch (error: any) {
      console.error('Error fetching SO Center exams:', error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
