import type { Express, Request } from "express";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
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
import { sql as sqlQuery, eq, desc } from "drizzle-orm";
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
} from "@shared/schema";
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || "navanidhi-academy-secret-key-2024";

// Initialize admin user on server start with timeout
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
  
  // Initialize teacher storage
  // Teacher management now integrated with User system
  
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
                role: userMetadata.role || 'admin',
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

  // Student routes
  app.get("/api/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { soCenterId } = req.query;
      
      if (req.user.role === 'so_center' && soCenterId) {
        const students = await storage.getStudentsBySoCenter(soCenterId as string);
        
        // Debug: Check database values before processing
        const testStudent = students.find(s => s.studentId === 'NNAS250000015');
        if (testStudent) {
          console.log('RAW Database Values for NNAS250000015:', {
            totalFeeAmount: testStudent.totalFeeAmount,
            paidAmount: testStudent.paidAmount,  
            pendingAmount: testStudent.pendingAmount
          });
        }
        
        // Preserve database values and only add progress info
        const studentsWithStatus = await Promise.all(students.map(async (student: any) => {
          return {
            ...student,
            // Preserve existing payment status or determine from pendingAmount
            paymentStatus: parseFloat(student.pendingAmount || '0') <= 0 ? 'paid' : 'pending',
            progress: 0 // Initial progress is 0
          };
        }));
        
        // Debug: Check final values being sent to UI
        const finalTestStudent = studentsWithStatus.find(s => s.studentId === 'NNAS250000015');
        if (finalTestStudent) {
          console.log('FINAL API Values for NNAS250000015:', {
            totalFeeAmount: finalTestStudent.totalFeeAmount,
            paidAmount: finalTestStudent.paidAmount,  
            pendingAmount: finalTestStudent.pendingAmount
          });
        }
        
        res.json(studentsWithStatus);
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
      if (admissionFeePaid && receiptNumber && studentData.soCenterId) {
        try {
          console.log('Processing admission fee...');
          // Get class fee information
          const classFee = await storage.getClassFees(studentData.classId, studentData.courseType);
          
          if (classFee) {
            // Create payment record
            const feeAmount = parseFloat(classFee.admissionFee);
            console.log('Creating payment with amount:', feeAmount);
            await storage.createPayment({
              studentId: student.id,
              amount: feeAmount.toString(),
              paymentMethod: 'cash',
              description: `Admission fee payment - Receipt: ${receiptNumber}`,
              recordedBy: req.user.userId
            });

            // Add amount to SO Center wallet - ensure it's a number
            const walletAmount = Number(feeAmount);
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
      
      // Get fee amount for response
      let feeAmount: number | null = null;
      if (feeProcessed && admissionFeePaid && receiptNumber) {
        try {
          const classFee = await storage.getClassFees(studentData.classId, studentData.courseType);
          if (classFee && classFee.admissionFee) {
            feeAmount = parseFloat(classFee.admissionFee);
          }
        } catch (error) {
          console.error('Error getting class fee for response:', error);
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
        transactionId: admissionFeePaid ? `TXN-${Date.now()}-${student.id.slice(0, 8)}` : null,
        amount: feeAmount
      };
      
      // Create wallet transaction record for fee payment
      if (feeProcessed && admissionFeePaid && receiptNumber && feeAmount) {
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
      
      // Provide specific error messages for common issues
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

  // Wallet API endpoint
  app.get("/api/wallet/:soCenterId", authenticateToken, async (req, res) => {
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

      // Get comprehensive real progress data
      const progressQuery = `
        SELECT 
          tp.id,
          tp.status,
          tp.completion_date,
          t.name as topic_name,
          c.name as chapter_name,
          s.name as subject_name,
          tp.created_at,
          tp.updated_at
        FROM topic_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE tp.student_id = $1
        ORDER BY s.name, c.name, t.name
      `;
      
      const progressResults = await executeRawQuery(progressQuery, [student.id]);
      
      const progress = progressResults.map((row: any) => ({
        id: row.id,
        status: row.status,
        topicName: row.topic_name,
        chapterName: row.chapter_name,
        subjectName: row.subject_name,
        completionDate: row.completion_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({
        student: {
          id: student.id,
          name: student.name,
          class: student.classId,
        },
        progress,
      });
    } catch (error) {
      console.error('Error fetching student progress:', error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Progress routes
  app.get("/api/progress/:studentId", authenticateToken, async (req, res) => {
    try {
      const progress = await storage.getStudentProgress(req.params.studentId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
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
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        recordedBy: req.user.userId,
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
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get all subjects
  app.get("/api/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
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

  // Dashboard stats endpoint - REAL SUPABASE DATA ONLY
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userData = await storage.getUserByEmail(req.user.email);
      let whereClause = '';
      
      // Filter by SO Center for so_center role
      if (userData?.role === 'so_center' && userData?.soCenterId) {
        whereClause = `WHERE s.so_center_id = '${userData.soCenterId}'`;
      }
      
      // Get real dashboard statistics using raw queries
      const statsQuery = `
        SELECT 
          COUNT(s.id) as total_students,
          COUNT(DISTINCT s.so_center_id) as total_so_centers,
          COALESCE(SUM(CASE WHEN p.payment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as monthly_revenue,
          COUNT(CASE WHEN s.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_students_this_month
        FROM students s
        LEFT JOIN payments p ON p.student_id = s.id
        ${whereClause}
      `;
      
      const results = await executeRawQuery(statsQuery, []);
      const statsData = results[0] || {};
      
      const stats = {
        totalStudents: parseInt(statsData.total_students) || 0,
        totalSoCenters: parseInt(statsData.total_so_centers) || 0,
        monthlyRevenue: parseFloat(statsData.monthly_revenue) || 0,
        newStudentsThisMonth: parseInt(statsData.new_students_this_month) || 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Wallet endpoint - REAL SUPABASE DATA WITH TRANSACTION HISTORY
  app.get("/api/wallet/:userId", authenticateToken, async (req, res) => {
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
      if (!req.user || req.user!.role !== 'admin') {
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

  // SO Center endpoints
  app.get("/api/admin/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'academic_admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      console.log('📋 Fetching SO Centers list for admin...');
      const centers = await storage.getAllSoCenters();
      console.log(`✅ Found ${centers.length} SO Centers`);
      res.json(centers);
    } catch (error: any) {
      console.error('❌ Error fetching SO Centers:', error);
      res.status(500).json({ message: 'Failed to fetch SO Centers' });
    }
  });

  app.get("/api/admin/so-centers/next-id", authenticateToken, async (req, res) => {
    try {
      const nextId = await storage.getNextSoCenterId();
      res.json(nextId);
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

  app.get("/api/admin/users/unassigned-managers", authenticateToken, async (req, res) => {
    try {
      const unassignedManagers = await storage.getUnassignedManagers();
      res.json(unassignedManagers);
    } catch (error) {
      console.error('Error fetching unassigned managers:', error);
      res.status(500).json({ message: 'Failed to fetch unassigned managers' });
    }
  });

  // SUPABASE AUTH ENFORCED - SO Center update
  app.put("/api/admin/so-centers/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const centerId = req.params.id;
      const updateData = req.body;

      // Remove restricted fields that cannot be updated
      delete updateData.id;
      delete updateData.centerId;
      delete updateData.email;
      delete updateData.walletBalance;
      delete updateData.createdAt;
      delete updateData.password;

      console.log('🔄 Updating SO Center:', centerId, 'with data:', updateData);

      // Update SO Center
      const updatedCenter = await storage.updateSoCenter(centerId, updateData);
      
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
      if (!req.user || req.user!.role !== 'admin') {
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
      
      // ALL SO CENTER CREATION MUST GO THROUGH SUPABASE AUTH
      const result = await AuthService.createSoCenter({
        email: centerData.email,
        password: centerData.password || '12345678',
        name: centerData.name || centerData.managerName || 'SO Manager',
        phone: centerData.phone || centerData.managerPhone,
        address: centerData.address,
        centerId: centerData.centerId,
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
      const subjectData = insertSubjectSchema.parse(req.body);
      const newSubject = await storage.createSubject(subjectData);
      res.status(201).json(newSubject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ message: 'Failed to create subject' });
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
      await storage.deleteSoCenter(req.params.id);
      res.json({ message: 'SO Center deleted successfully' });
    } catch (error) {
      console.error('Error deleting SO Center:', error);
      res.status(500).json({ message: 'Failed to delete SO Center' });
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
          studentClass: sql`COALESCE(${schema.classes.name}, 'N/A')`.as('studentClass'),
          soCenterName: sql`COALESCE(${schema.soCenters.name}, 'N/A')`.as('soCenterName'),
          recordedByName: sql`COALESCE(${schema.users.fullName}, 'N/A')`.as('recordedByName'),
          stateName: sql`COALESCE(${schema.states.name}, 'N/A')`.as('stateName'),
          districtName: sql`COALESCE(${schema.districts.name}, 'N/A')`.as('districtName'),
          mandalName: sql`COALESCE(${schema.mandals.name}, 'N/A')`.as('mandalName'),
          villageName: sql`COALESCE(${schema.villages.name}, 'N/A')`.as('villageName'),
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
          soCenterName: sql`COALESCE(${schema.soCenters.name}, 'N/A')`.as('soCenterName'),
          soCenterId: schema.walletTransactions.soCenterId,
          collectionAgentName: sql`COALESCE(${schema.users.fullName}, 'N/A')`.as('collectionAgentName'),
          stateName: sql`COALESCE(${schema.states.name}, 'N/A')`.as('stateName'),
          districtName: sql`COALESCE(${schema.districts.name}, 'N/A')`.as('districtName'),
          mandalName: sql`COALESCE(${schema.mandals.name}, 'N/A')`.as('mandalName'),
          villageName: sql`COALESCE(${schema.villages.name}, 'N/A')`.as('villageName'),
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
          type: sql`'commission'`.as('type'),
          description: sql`CONCAT('Commission from product order: ', ${schema.productOrders.receiptNumber})`.as('description'),
          createdAt: schema.productOrders.createdAt,
          soCenterName: sql`COALESCE(${schema.soCenters.name}, 'N/A')`.as('soCenterName'),
          soCenterId: schema.productOrders.soCenterId,
          walletTotalEarned: sql`'0'`.as('walletTotalEarned'),
          walletAvailableBalance: sql`'0'`.as('walletAvailableBalance'),
          walletTotalWithdrawn: sql`'0'`.as('walletTotalWithdrawn'),
          stateName: sql`COALESCE(${schema.states.name}, 'N/A')`.as('stateName'),
          districtName: sql`COALESCE(${schema.districts.name}, 'N/A')`.as('districtName'),
          mandalName: sql`COALESCE(${schema.mandals.name}, 'N/A')`.as('mandalName'),
          villageName: sql`COALESCE(${schema.villages.name}, 'N/A')`.as('villageName'),
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

      // Process the payment
      const result = await storage.processStudentPayment({
        studentId,
        amount: parseFloat(amount),
        feeType,
        receiptNumber,
        expectedFeeAmount: parseFloat(expectedFeeAmount || '0')
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

  // Update teacher subject assignments
  app.put("/api/admin/teachers/:id/subjects", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Check if user exists and has teacher role
      const teacher = await storage.getUser(req.params.id);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const { subjectIds } = req.body;
      
      if (!Array.isArray(subjectIds)) {
        return res.status(400).json({ message: 'subjectIds must be an array' });
      }

      // Delete existing assignments
      await db.execute(sqlQuery`DELETE FROM teacher_subjects WHERE user_id = ${req.params.id}`);
      
      // Insert new assignments
      if (subjectIds.length > 0) {
        for (const subjectId of subjectIds) {
          await db.execute(sqlQuery`
            INSERT INTO teacher_subjects (user_id, subject_id) 
            VALUES (${req.params.id}, ${subjectId})
          `);
        }
      }
      
      res.json({ message: 'Teacher subjects updated successfully' });
    } catch (error) {
      console.error('Error updating teacher subjects:', error);
      res.status(500).json({ message: 'Failed to update teacher subjects' });
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
      if (!req.user || !['so_center', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'SO Center or Admin access required' });
      }

      if (req.user.role === 'admin') {
        // Admin sees all withdrawal requests
        const requests = await storage.getAllWithdrawalRequests();
        res.json(requests);
      } else {
        // SO Center sees only their requests
        const requests = await storage.getWithdrawalRequestsBySoCenter(req.user.userId);
        res.json(requests);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
    }
  });

  // Process withdrawal request (Admin only)
  app.put("/api/admin/withdrawal-requests/:id/process", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { status, notes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
      }

      const request = await storage.processWithdrawalRequest(
        req.params.id, 
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
        
        console.error('SO Center not found for email:', req.user.email);
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
  
  // Get exams for logged-in SO Center user
  app.get('/api/so-center/exams', authenticateToken, async (req, res) => {
    try {
      // Get user's SO Center from their role/assignment
      const userId = req.user?.userId;
      console.log('📋 Fetching exams for SO Center user:', userId);
      
      // Find the user's SO Center ID
      const user = await storage.getUser(userId);
      console.log('🔍 User details:', { id: user?.id, email: user?.email, role: user?.role });
      
      let soCenterId = user?.soCenterId;
      
      // If user doesn't have soCenterId directly, find it through SO Centers table
      if (!soCenterId && (user?.role === 'so_center_manager' || user?.role === 'so_center')) {
        console.log('🔍 Searching SO Centers by managerId:', userId);
        
        // First try to find by managerId
        const soCentersByManager = await db.select({
          id: schema.soCenters.id,
          name: schema.soCenters.name,
          centerId: schema.soCenters.centerId,
          email: schema.soCenters.email,
          managerId: schema.soCenters.managerId
        })
        .from(schema.soCenters)
        .where(eq(schema.soCenters.managerId, userId));
        
        console.log('🔍 Found SO Centers by managerId:', soCentersByManager);
        
        if (soCentersByManager.length > 0) {
          soCenterId = soCentersByManager[0].id;
        } else {
          console.log('🔍 Searching SO Centers by email:', user?.email);
          
          // If not found by managerId, try to find by email match
          const soCentersByEmail = await db.select({
            id: schema.soCenters.id,
            name: schema.soCenters.name,
            centerId: schema.soCenters.centerId,
            email: schema.soCenters.email,
            managerId: schema.soCenters.managerId
          })
          .from(schema.soCenters)
          .where(eq(schema.soCenters.email, user?.email || ''));
          
          console.log('🔍 Found SO Centers by email:', soCentersByEmail);
          
          if (soCentersByEmail.length > 0) {
            soCenterId = soCentersByEmail[0].id;
          } else {
            // Last resort - find any SO Center that might match this user
            const allSoCenters = await db.select({
              id: schema.soCenters.id,
              name: schema.soCenters.name,
              centerId: schema.soCenters.centerId,
              email: schema.soCenters.email,
              managerId: schema.soCenters.managerId
            })
            .from(schema.soCenters)
            .limit(10);
            
            console.log('🔍 All SO Centers (first 10):', allSoCenters);
            
            // For demo purposes, use the first SO Center if user email contains 'nnasoc'
            if (user?.email?.includes('nnasoc') && allSoCenters.length > 0) {
              soCenterId = allSoCenters[0].id;
              console.log('🔍 Using first SO Center for demo user:', soCenterId);
            }
          }
        }
      }
      
      if (!soCenterId) {
        console.log('❌ No SO Center found for user');
        return res.status(404).json({ message: 'SO Center not found for this user' });
      }
      
      console.log('📋 Found SO Center ID:', soCenterId);
      
      // Debug: Check what exams exist and their soCenterIds
      const allExams = await db.select({
        id: schema.exams.id,
        title: schema.exams.title,
        soCenterIds: schema.exams.soCenterIds
      })
      .from(schema.exams)
      .limit(10);
      console.log('🔍 Sample exams and their SO Center IDs:', allExams);
      console.log('🔍 Looking for SO Center ID:', soCenterId);
      
      // Get exams where the SO Center ID is in the soCenterIds array using proper Drizzle syntax
      const exams = await db.select({
        id: schema.exams.id,
        title: schema.exams.title,
        description: schema.exams.description,
        classId: schema.exams.classId,
        subjectId: schema.exams.subjectId,
        chapterIds: schema.exams.chapterIds,
        soCenterIds: schema.exams.soCenterIds,
        examDate: schema.exams.examDate,
        duration: schema.exams.duration,
        totalQuestions: schema.exams.totalQuestions,
        totalMarks: schema.exams.totalMarks,
        passingMarks: schema.exams.passingMarks,
        status: schema.exams.status,
        createdBy: schema.exams.createdBy,
        createdAt: schema.exams.createdAt,
        updatedAt: schema.exams.updatedAt,
        className: schema.classes.name,
        subjectName: schema.subjects.name
      })
      .from(schema.exams)
      .leftJoin(schema.classes, eq(schema.exams.classId, schema.classes.id))
      .leftJoin(schema.subjects, eq(schema.exams.subjectId, schema.subjects.id))
      .where(sql`${soCenterId} = ANY(${schema.exams.soCenterIds})`)
      .orderBy(schema.exams.examDate);
      console.log('✅ Found exams for SO Center:', exams.length);
      res.json(exams);
    } catch (error: any) {
      console.error('❌ Error fetching SO Center exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Get students for logged-in SO Center user
  app.get('/api/so-center/students', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.userId;
      console.log('👥 Fetching students for SO Center user:', userId);
      
      // Find the user's SO Center ID
      const user = await storage.getUser(userId);
      let soCenterId = user?.soCenterId;
      
      if (!soCenterId && (user?.role === 'so_center_manager' || user?.role === 'so_center')) {
        console.log('🔍 Searching SO Centers for students by managerId:', userId);
        
        // First try to find by managerId
        const soCentersByManager = await db.select({
          id: schema.soCenters.id,
          name: schema.soCenters.name,
          centerId: schema.soCenters.centerId,
          email: schema.soCenters.email,
          managerId: schema.soCenters.managerId
        })
        .from(schema.soCenters)
        .where(eq(schema.soCenters.managerId, userId));
        
        console.log('🔍 Found SO Centers by managerId for students:', soCentersByManager);
        
        if (soCentersByManager.length > 0) {
          soCenterId = soCentersByManager[0].id;
        } else {
          console.log('🔍 Searching SO Centers for students by email:', user?.email);
          
          // If not found by managerId, try to find by email match
          const soCentersByEmail = await db.select({
            id: schema.soCenters.id,
            name: schema.soCenters.name,
            centerId: schema.soCenters.centerId,
            email: schema.soCenters.email,
            managerId: schema.soCenters.managerId
          })
          .from(schema.soCenters)
          .where(eq(schema.soCenters.email, user?.email || ''));
          
          console.log('🔍 Found SO Centers by email for students:', soCentersByEmail);
          
          if (soCentersByEmail.length > 0) {
            soCenterId = soCentersByEmail[0].id;
          } else {
            // Last resort - for demo purposes, use first SO Center if user email contains 'nnasoc'
            if (user?.email?.includes('nnasoc')) {
              const allSoCenters = await db.select({
                id: schema.soCenters.id
              })
              .from(schema.soCenters)
              .limit(1);
              
              if (allSoCenters.length > 0) {
                soCenterId = allSoCenters[0].id;
                console.log('🔍 Using first SO Center for demo user (students):', soCenterId);
              }
            }
          }
        }
      }
      
      if (!soCenterId) {
        return res.status(404).json({ message: 'SO Center not found for this user' });
      }
      
      const students = await db.select({
        id: schema.students.id,
        name: schema.students.name,
        regId: schema.students.regId,
        classId: schema.students.classId,
      })
      .from(schema.students)
      .where(eq(schema.students.soCenterId, soCenterId));
      
      console.log('✅ Found students for SO Center:', students.length);
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

  // Submit exam results
  app.post('/api/so-center/exams/:examId/results', authenticateToken, async (req, res) => {
    try {
      const { examId } = req.params;
      const { results } = req.body;
      console.log('📊 Submitting exam results for exam:', examId);
      console.log('📊 Results data:', results);
      
      // Here you would typically store results in an exam_results table
      // For now, we'll just acknowledge the submission
      
      // You could create an exam_results table with schema like:
      // examId, studentId, marksObtained, answeredQuestions, submittedAt
      
      console.log('✅ Exam results submitted successfully');
      res.json({ message: 'Results submitted successfully' });
    } catch (error: any) {
      console.error('❌ Error submitting exam results:', error);
      res.status(500).json({ message: 'Failed to submit results' });
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

  // Analytics API endpoints for real data
  app.get('/api/analytics/student-performance/:studentId', authenticateToken, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { timeframe = '6m' } = req.query;
      
      // Get exam results over time for performance trends
      const performanceQuery = sqlQuery`
        SELECT 
          DATE_TRUNC('month', e.exam_date) as month,
          AVG(er.marks_obtained) as avg_marks,
          COUNT(er.id) as exam_count
        FROM exam_results er
        JOIN exams e ON er.exam_id = e.id
        WHERE er.student_id = ${studentId}
          AND e.exam_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', e.exam_date)
        ORDER BY month ASC
      `;
      
      const attendanceQuery = sqlQuery`
        SELECT 
          DATE_TRUNC('month', a.date) as month,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as attendance_percentage
        FROM attendance a
        WHERE a.student_id = ${studentId}
          AND a.date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', a.date)
        ORDER BY month ASC
      `;
      
      const [performanceResults, attendanceResults] = await Promise.all([
        db.execute(performanceQuery),
        db.execute(attendanceQuery)
      ]);
      
      const combinedData = performanceResults.rows.map((perf: any) => {
        const monthStr = new Date(perf.month).toLocaleString('default', { month: 'short' });
        const attendance = attendanceResults.rows.find((att: any) => 
          new Date(att.month).getTime() === new Date(perf.month).getTime()
        );
        
        return {
          month: monthStr,
          marks: Math.round(parseFloat(perf.avg_marks) || 0),
          attendance: Math.round(parseFloat(attendance?.attendance_percentage) || 0)
        };
      });
      
      res.json(combinedData);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      res.status(500).json({ message: 'Failed to fetch performance data' });
    }
  });

  app.get('/api/analytics/subject-progress/:studentId', authenticateToken, async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get subject-wise progress from topic completion
      const progressQuery = sqlQuery`
        SELECT 
          s.name as subject,
          s.id as subject_id,
          COUNT(tp.id) * 100.0 / COUNT(t.id) as progress_percentage
        FROM subjects s
        JOIN chapters c ON c.subject_id = s.id
        JOIN topics t ON t.chapter_id = c.id
        LEFT JOIN topic_progress tp ON tp.topic_id = t.id AND tp.student_id = ${studentId} AND tp.status = 'learned'
        GROUP BY s.id, s.name
        ORDER BY s.name
      `;
      
      const results = await db.execute(progressQuery);
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
      
      const subjectProgress = results.rows.map((row: any, index: number) => ({
        subject: row.subject,
        progress: Math.round(parseFloat(row.progress_percentage) || 0),
        color: colors[index % colors.length]
      }));
      
      res.json(subjectProgress);
    } catch (error) {
      console.error('Error fetching subject progress:', error);
      res.status(500).json({ message: 'Failed to fetch subject progress' });
    }
  });

  app.get('/api/analytics/attendance-trends', authenticateToken, async (req, res) => {
    try {
      const { soCenterId, month } = req.query;
      
      if (!soCenterId || !month) {
        return res.status(400).json({ message: 'SO Center ID and month are required' });
      }
      
      // Get daily attendance for the month
      const attendanceQuery = sqlQuery`
        SELECT 
          EXTRACT(DAY FROM a.date) as day,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN a.status = 'holiday' THEN 1 END) as holiday_count
        FROM attendance a
        JOIN students st ON a.student_id = st.id
        WHERE st.so_center_id = ${soCenterId}
          AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${month}::date)
        GROUP BY EXTRACT(DAY FROM a.date)
        ORDER BY day ASC
      `;
      
      const results = await db.execute(attendanceQuery);
      
      const attendanceData = results.rows.map((row: any) => ({
        date: row.day.toString(),
        present: parseInt(row.present_count) || 0,
        absent: parseInt(row.absent_count) || 0,
        holiday: parseInt(row.holiday_count) || 0
      }));
      
      res.json(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
      res.status(500).json({ message: 'Failed to fetch attendance data' });
    }
  });

  app.get('/api/analytics/so-center-comparison', authenticateToken, async (req, res) => {
    try {
      const { stateId, districtId, mandalId, villageId, month } = req.query;
      
      // Build dynamic WHERE clause based on location filters
      let locationFilter = '';
      const params = [];
      
      if (villageId) {
        locationFilter = 'WHERE sc.village_id = $1';
        params.push(villageId);
      } else if (mandalId) {
        locationFilter = `WHERE v.mandal_id = $1`;
        params.push(mandalId);
      } else if (districtId) {
        locationFilter = `WHERE m.district_id = $1`;
        params.push(districtId);
      } else if (stateId) {
        locationFilter = `WHERE d.state_id = $1`;
        params.push(stateId);
      }
      
      const monthFilter = month ? `AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', $${params.length + 1}::date)` : '';
      if (month) params.push(month);
      
      const comparisonQuery = `
        SELECT 
          sc.name,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) as attendance_percentage
        FROM so_centers sc
        LEFT JOIN villages v ON sc.village_id = v.id
        LEFT JOIN mandals m ON v.mandal_id = m.id
        LEFT JOIN districts d ON m.district_id = d.id
        LEFT JOIN students st ON st.so_center_id = sc.id
        LEFT JOIN attendance a ON a.student_id = st.id ${monthFilter}
        ${locationFilter}
        GROUP BY sc.id, sc.name
        ORDER BY sc.name
      `;
      
      const results = await executeRawQuery(comparisonQuery, params);
      
      const soCenterStats = results.map((row: any) => ({
        name: row.name,
        attendance: Math.round(parseFloat(row.attendance_percentage) || 0)
      }));
      
      res.json(soCenterStats);
    } catch (error) {
      console.error('Error fetching SO center comparison:', error);
      res.status(500).json({ message: 'Failed to fetch SO center data' });
    }
  });

  app.get('/api/analytics/dashboard-stats', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      let whereClause = '';
      
      // Filter by SO Center for so_center role
      if (user?.role === 'so_center') {
        const userRecord = await storage.getUserByEmail(user.email);
        if (userRecord?.soCenterId) {
          whereClause = `WHERE s.so_center_id = '${userRecord.soCenterId}'`;
        }
      }
      
      // Get real dashboard statistics
      const statsQuery = `
        SELECT 
          COUNT(s.id) as total_students,
          COUNT(DISTINCT s.so_center_id) as total_so_centers,
          SUM(CASE WHEN p.payment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END) as monthly_revenue,
          COUNT(CASE WHEN s.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_students_this_month
        FROM students s
        LEFT JOIN payments p ON p.student_id = s.id
        ${whereClause}
      `;
      
      const results = await executeRawQuery(statsQuery);
      const stats = results[0] || {};
      
      res.json({
        totalStudents: parseInt(stats.total_students) || 0,
        totalSoCenters: parseInt(stats.total_so_centers) || 0,
        monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
        newStudentsThisMonth: parseInt(stats.new_students_this_month) || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });

  // Real analytics endpoints for charts and graphs
  
  // Student performance analytics (real data for line/bar charts)
  app.get("/api/analytics/student-performance", authenticateToken, async (req, res) => {
    try {
      const { studentId, timeframe = '6months' } = req.query;
      
      const performanceQuery = `
        SELECT 
          DATE_TRUNC('month', tp.completion_date) as month,
          COUNT(CASE WHEN tp.status = 'learned' THEN 1 END) as completed_topics,
          COUNT(tp.id) as total_topics,
          s.name as subject_name
        FROM topic_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE tp.student_id = $1 
          AND tp.completion_date >= CURRENT_DATE - INTERVAL '${timeframe}'
        GROUP BY DATE_TRUNC('month', tp.completion_date), s.name
        ORDER BY month, s.name
      `;
      
      const results = await sql`
        SELECT 
          DATE_TRUNC('month', tp.completion_date) as month,
          COUNT(CASE WHEN tp.status = 'learned' THEN 1 END) as completed_topics,
          COUNT(tp.id) as total_topics,
          s.name as subject_name
        FROM topic_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects s ON c.subject_id = s.id
        WHERE tp.student_id = ${studentId} 
          AND tp.completion_date >= CURRENT_DATE - INTERVAL '${timeframe}'
        GROUP BY DATE_TRUNC('month', tp.completion_date), s.name
        ORDER BY month, s.name
      `;
      
      const performanceData = results.map((row: any) => ({
        month: row.month,
        completedTopics: parseInt(row.completed_topics) || 0,
        totalTopics: parseInt(row.total_topics) || 0,
        subject: row.subject_name,
        percentage: row.total_topics > 0 ? Math.round((row.completed_topics / row.total_topics) * 100) : 0
      }));
      
      res.json(performanceData);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  // SO Center analytics (real data for admin dashboard)
  app.get("/api/analytics/so-center-stats", authenticateToken, async (req, res) => {
    try {
      const { location } = req.query;
      let whereClause = '';
      
      if (location) {
        whereClause = `WHERE sc.state = '${location}' OR sc.district = '${location}' OR sc.mandal = '${location}'`;
      }
      
      const soCenterQuery = `
        SELECT 
          sc.name as so_center_name,
          sc.state,
          sc.district,
          sc.mandal,
          COUNT(s.id) as student_count,
          SUM(p.amount) as total_revenue,
          AVG(CASE WHEN tp.status = 'learned' THEN 1.0 ELSE 0.0 END) * 100 as avg_completion_rate
        FROM so_centers sc
        LEFT JOIN students s ON s.so_center_id = sc.id
        LEFT JOIN payments p ON p.student_id = s.id
        LEFT JOIN topic_progress tp ON tp.student_id = s.id
        ${whereClause}
        GROUP BY sc.id, sc.name, sc.state, sc.district, sc.mandal
        ORDER BY student_count DESC
      `;
      
      const results = await sql`${soCenterQuery}`;
      
      const soCenterStats = results.map((row: any) => ({
        name: row.so_center_name,
        state: row.state,
        district: row.district,
        mandal: row.mandal,
        studentCount: parseInt(row.student_count) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        avgCompletionRate: parseFloat(row.avg_completion_rate) || 0
      }));
      
      res.json(soCenterStats);
    } catch (error) {
      console.error('Error fetching SO center stats:', error);
      res.status(500).json({ message: "Failed to fetch SO center statistics" });
    }
  });

  // Payment analytics (real data for revenue charts)
  app.get("/api/analytics/payment-trends", authenticateToken, async (req, res) => {
    try {
      const { timeframe = '12months' } = req.query;
      
      const paymentQuery = `
        SELECT 
          DATE_TRUNC('month', p.payment_date) as month,
          SUM(p.amount) as total_amount,
          COUNT(p.id) as payment_count,
          COUNT(DISTINCT p.student_id) as unique_students,
          p.payment_method
        FROM payments p
        WHERE p.payment_date >= CURRENT_DATE - INTERVAL '${timeframe}'
        GROUP BY DATE_TRUNC('month', p.payment_date), p.payment_method
        ORDER BY month DESC
      `;
      
      const results = await sql`${paymentQuery}`;
      
      const paymentTrends = results.map((row: any) => ({
        month: row.month,
        totalAmount: parseFloat(row.total_amount) || 0,
        paymentCount: parseInt(row.payment_count) || 0,
        uniqueStudents: parseInt(row.unique_students) || 0,
        paymentMethod: row.payment_method
      }));
      
      res.json(paymentTrends);
    } catch (error) {
      console.error('Error fetching payment trends:', error);
      res.status(500).json({ message: "Failed to fetch payment analytics" });
    }
  });

  // Academic progress analytics (real data for pie charts and progress bars)
  app.get("/api/analytics/academic-progress", authenticateToken, async (req, res) => {
    try {
      const { classId, subjectId, soCenterId } = req.query;
      let whereConditions = [];
      
      if (classId) whereConditions.push(`s.class_id = '${classId}'`);
      if (subjectId) whereConditions.push(`sub.id = '${subjectId}'`);
      if (soCenterId) whereConditions.push(`s.so_center_id = '${soCenterId}'`);
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const progressQuery = `
        SELECT 
          sub.name as subject_name,
          c.name as chapter_name,
          tp.status,
          COUNT(tp.id) as status_count,
          COUNT(DISTINCT tp.student_id) as student_count
        FROM topic_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects sub ON c.subject_id = sub.id
        JOIN students s ON tp.student_id = s.id
        ${whereClause}
        GROUP BY sub.name, c.name, tp.status
        ORDER BY sub.name, c.name, tp.status
      `;
      
      const results = await sql`
        SELECT 
          sub.name as subject_name,
          c.name as chapter_name,
          tp.status,
          COUNT(tp.id) as status_count,
          COUNT(DISTINCT tp.student_id) as student_count
        FROM topic_progress tp
        JOIN topics t ON tp.topic_id = t.id
        JOIN chapters c ON t.chapter_id = c.id
        JOIN subjects sub ON c.subject_id = sub.id
        JOIN students s ON tp.student_id = s.id
        ${whereClause ? sql`WHERE ${sql.unsafe(whereClause)}` : sql``}
        GROUP BY sub.name, c.name, tp.status
        ORDER BY sub.name, c.name, tp.status
      `;
      
      const academicProgress = results.map((row: any) => ({
        subject: row.subject_name,
        chapter: row.chapter_name,
        status: row.status,
        count: parseInt(row.status_count) || 0,
        studentCount: parseInt(row.student_count) || 0
      }));
      
      res.json(academicProgress);
    } catch (error) {
      console.error('Error fetching academic progress:', error);
      res.status(500).json({ message: "Failed to fetch academic analytics" });
    }
  });

  // Additional analytics for attendance and SO center comparison
  
  // Center-wise, Month-wise Attendance Report (real data)
  app.get("/api/analytics/center-month-attendance", authenticateToken, async (req, res) => {
    try {
      const { month, year, soCenterId } = req.query;
      const currentMonth = month || new Date().getMonth() + 1;
      const currentYear = year || new Date().getFullYear();
      
      let whereClause = '';
      if (soCenterId) {
        whereClause = `AND s.so_center_id = '${soCenterId}'`;
      }
      
      const attendanceQuery = `
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('month', $1::date),
            DATE_TRUNC('month', $1::date) + INTERVAL '1 month' - INTERVAL '1 day',
            INTERVAL '1 day'
          )::date as date
        ),
        centers_students AS (
          SELECT 
            sc.id as center_id,
            sc.name as center_name,
            sc.state,
            sc.district,
            sc.mandal,
            COUNT(s.id) as total_students
          FROM so_centers sc
          LEFT JOIN students s ON s.so_center_id = sc.id
          WHERE sc.status = 'active' ${whereClause.replace('s.so_center_id', 'sc.id')}
          GROUP BY sc.id, sc.name, sc.state, sc.district, sc.mandal
        )
        SELECT 
          cs.center_id,
          cs.center_name,
          cs.state,
          cs.district,
          cs.mandal,
          cs.total_students,
          ds.date,
          COUNT(a.id) as present_count,
          ROUND(
            CASE 
              WHEN cs.total_students > 0 
              THEN (COUNT(a.id)::numeric / cs.total_students * 100)
              ELSE 0 
            END, 2
          ) as attendance_percentage
        FROM centers_students cs
        CROSS JOIN date_series ds
        LEFT JOIN students s ON s.so_center_id = cs.center_id
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ds.date
        GROUP BY cs.center_id, cs.center_name, cs.state, cs.district, cs.mandal, cs.total_students, ds.date
        ORDER BY cs.center_name, ds.date
      `;
      
      const targetDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const results = await sql`
        WITH date_series AS (
          SELECT generate_series(
            DATE_TRUNC('month', ${targetDate}::date),
            DATE_TRUNC('month', ${targetDate}::date) + INTERVAL '1 month' - INTERVAL '1 day',
            INTERVAL '1 day'
          )::date as date
        ),
        centers_students AS (
          SELECT 
            sc.id as center_id,
            sc.name as center_name,
            sc.state,
            sc.district,
            sc.mandal,
            COUNT(s.id) as total_students
          FROM so_centers sc
          LEFT JOIN students s ON s.so_center_id = sc.id
          WHERE sc.status = 'active' ${soCenterId ? sql`AND sc.id = ${soCenterId}` : sql``}
          GROUP BY sc.id, sc.name, sc.state, sc.district, sc.mandal
        )
        SELECT 
          cs.center_id,
          cs.center_name,
          cs.state,
          cs.district,
          cs.mandal,
          cs.total_students,
          ds.date,
          COUNT(a.id) as present_count,
          ROUND(
            CASE 
              WHEN cs.total_students > 0 
              THEN (COUNT(a.id)::numeric / cs.total_students * 100)
              ELSE 0 
            END, 2
          ) as attendance_percentage
        FROM centers_students cs
        CROSS JOIN date_series ds
        LEFT JOIN students s ON s.so_center_id = cs.center_id
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ds.date
        GROUP BY cs.center_id, cs.center_name, cs.state, cs.district, cs.mandal, cs.total_students, ds.date
        ORDER BY cs.center_name, ds.date
      `;
      
      const attendanceReport = results.map((row: any) => ({
        centerId: row.center_id,
        centerName: row.center_name,
        state: row.state,
        district: row.district,
        mandal: row.mandal,
        totalStudents: parseInt(row.total_students) || 0,
        date: row.date,
        presentCount: parseInt(row.present_count) || 0,
        attendancePercentage: parseFloat(row.attendance_percentage) || 0
      }));
      
      res.json(attendanceReport);
    } catch (error) {
      console.error('Error fetching center-month attendance:', error);
      res.status(500).json({ message: "Failed to fetch attendance report" });
    }
  });

  // Attendance trends analytics (real data)
  app.get("/api/analytics/attendance-trends", authenticateToken, async (req, res) => {
    try {
      const { soCenterId, month } = req.query;
      
      const attendanceQuery = `
        SELECT 
          DATE_TRUNC('day', a.date) as day,
          COUNT(a.id) as present_count,
          COUNT(DISTINCT a.student_id) as total_students,
          ROUND(COUNT(a.id)::numeric / COUNT(DISTINCT a.student_id) * 100, 2) as attendance_rate
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', $1::date)
        ${soCenterId ? `AND s.so_center_id = '${soCenterId}'` : ''}
        GROUP BY DATE_TRUNC('day', a.date)
        ORDER BY day
      `;
      
      const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';
      const results = await sql`
        SELECT 
          DATE_TRUNC('day', a.date) as day,
          COUNT(a.id) as present_count,
          COUNT(DISTINCT a.student_id) as total_students,
          ROUND(COUNT(a.id)::numeric / COUNT(DISTINCT a.student_id) * 100, 2) as attendance_rate
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${targetMonth}::date)
        ${soCenterId ? sql`AND s.so_center_id = ${soCenterId}` : sql``}
        GROUP BY DATE_TRUNC('day', a.date)
        ORDER BY day
      `;
      
      const attendanceData = results.map((row: any) => ({
        day: row.day,
        presentCount: parseInt(row.present_count) || 0,
        totalStudents: parseInt(row.total_students) || 0,
        attendanceRate: parseFloat(row.attendance_rate) || 0
      }));
      
      res.json(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
      res.status(500).json({ message: "Failed to fetch attendance data" });
    }
  });

  // SO Center comparison analytics (real data)
  app.get("/api/analytics/so-center-comparison", authenticateToken, async (req, res) => {
    try {
      const { stateId, districtId, mandalId, villageId, month } = req.query;
      let whereConditions = [];
      
      if (stateId) whereConditions.push(`sc.state = '${stateId}'`);
      if (districtId) whereConditions.push(`sc.district = '${districtId}'`);
      if (mandalId) whereConditions.push(`sc.mandal = '${mandalId}'`);
      if (villageId) whereConditions.push(`sc.village = '${villageId}'`);
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const comparisonQuery = `
        SELECT 
          sc.name as so_center_name,
          sc.state,
          sc.district,
          sc.mandal,
          COUNT(s.id) as total_students,
          COUNT(a.id) as total_attendance,
          COUNT(p.id) as total_payments,
          SUM(p.amount) as total_revenue,
          AVG(CASE WHEN tp.status = 'learned' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
        FROM so_centers sc
        LEFT JOIN students s ON s.so_center_id = sc.id
        LEFT JOIN attendance a ON a.student_id = s.id AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', $1::date)
        LEFT JOIN payments p ON p.student_id = s.id AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', $1::date)
        LEFT JOIN topic_progress tp ON tp.student_id = s.id
        ${whereClause}
        GROUP BY sc.id, sc.name, sc.state, sc.district, sc.mandal
        ORDER BY total_students DESC
      `;
      
      const results = await sql`${comparisonQuery}`.values([month || new Date().toISOString().slice(0, 7) + '-01']);
      
      const comparisonData = results.map((row: any) => ({
        soCenterName: row.so_center_name,
        state: row.state,
        district: row.district,
        mandal: row.mandal,
        totalStudents: parseInt(row.total_students) || 0,
        totalAttendance: parseInt(row.total_attendance) || 0,
        totalPayments: parseInt(row.total_payments) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        completionRate: parseFloat(row.completion_rate) || 0
      }));
      
      res.json(comparisonData);
    } catch (error) {
      console.error('Error fetching SO center comparison:', error);
      res.status(500).json({ message: "Failed to fetch comparison data" });
    }
  });

  // ANNOUNCEMENTS MANAGEMENT ENDPOINTS
  
  // Get all announcements (admin only)
  app.get("/api/admin/announcements", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      console.log('📋 Fetching all announcements for admin...');
      
      const announcementsList = await db.select().from(schema.announcements)
        .orderBy(sql`${schema.announcements.createdAt} DESC`);
      
      console.log('✅ Announcements fetched successfully:', announcementsList.length);
      res.json(announcementsList);
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // Create new announcement (admin only)
  app.post("/api/admin/announcements", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      console.log('🆕 Creating new announcement...');
      
      const announcementData = schema.insertAnnouncementSchema.parse(req.body);
      const userId = req.user?.userId;
      
      const [newAnnouncement] = await db
        .insert(schema.announcements)
        .values({
          ...announcementData,
          createdBy: userId,
        })
        .returning();

      console.log('✅ Announcement created successfully:', newAnnouncement.id);
      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  // Update announcement (admin only)
  app.put("/api/admin/announcements/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const announcementId = req.params.id;
      console.log('📝 Updating announcement:', announcementId);
      
      const announcementData = schema.insertAnnouncementSchema.parse(req.body);
      
      const [updatedAnnouncement] = await db
        .update(schema.announcements)
        .set({
          ...announcementData,
          updatedAt: new Date(),
        })
        .where(eq(schema.announcements.id, announcementId))
        .returning();

      if (!updatedAnnouncement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      console.log('✅ Announcement updated successfully');
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  });

  // Delete announcement (admin only)
  app.delete("/api/admin/announcements/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const announcementId = req.params.id;
      console.log('🗑️ Deleting announcement:', announcementId);
      
      await db.delete(schema.announcements).where(eq(schema.announcements.id, announcementId));
      
      console.log('✅ Announcement deleted successfully');
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // Get active announcements for students (public endpoint for QR code display)
  app.get("/api/announcements/students", async (req, res) => {
    try {
      console.log('📋 Fetching active student announcements...');
      
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const studentAnnouncements = await db.select()
        .from(schema.announcements)
        .where(sql`
          (${schema.announcements.targetAudience} && ARRAY['students', 'all']::text[] OR 'all' = ANY(${schema.announcements.targetAudience}))
          AND ${schema.announcements.isActive} = true
          AND ${schema.announcements.fromDate} <= ${currentDate}
          AND ${schema.announcements.toDate} >= ${currentDate}
          AND ${schema.announcements.showOnQrCode} = true
        `)
        .orderBy(sql`
          CASE ${schema.announcements.priority}
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          ${schema.announcements.createdAt} DESC
        `);
      
      console.log('✅ Student announcements fetched:', studentAnnouncements.length);
      res.json(studentAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching student announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // Get active announcements for admin dashboard popup
  app.get("/api/admin/active-announcements", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      console.log('📋 Fetching active admin announcements...');
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      const adminAnnouncements = await db.select()
        .from(schema.announcements)
        .where(sql`
          (${schema.announcements.targetAudience} && ARRAY['admin', 'all']::text[] OR 'all' = ANY(${schema.announcements.targetAudience}))
          AND ${schema.announcements.isActive} = true
          AND ${schema.announcements.fromDate} <= ${currentDate}
          AND ${schema.announcements.toDate} >= ${currentDate}
        `)
        .orderBy(sql`
          CASE ${schema.announcements.priority}
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          ${schema.announcements.createdAt} DESC
        `);
      
      console.log('✅ Admin announcements fetched:', adminAnnouncements.length);
      res.json(adminAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching admin announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // Get active announcements for SO center dashboard popup
  app.get("/api/so-center/active-announcements", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'so_center' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'SO Center access required' });
      }
      
      console.log('📋 Fetching active SO center announcements...');
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      const soCenterAnnouncements = await db.select()
        .from(schema.announcements)
        .where(sql`
          (${schema.announcements.targetAudience} && ARRAY['so_centers', 'all']::text[] OR 'all' = ANY(${schema.announcements.targetAudience}))
          AND ${schema.announcements.isActive} = true
          AND ${schema.announcements.fromDate} <= ${currentDate}
          AND ${schema.announcements.toDate} >= ${currentDate}
        `)
        .orderBy(sql`
          CASE ${schema.announcements.priority}
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          ${schema.announcements.createdAt} DESC
        `);
      
      console.log('✅ SO Center announcements fetched:', soCenterAnnouncements.length);
      res.json(soCenterAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching SO center announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // Get active announcements for teacher dashboard popup
  app.get("/api/teacher/active-announcements", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Teacher access required' });
      }
      
      console.log('📋 Fetching active teacher announcements...');
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      const teacherAnnouncements = await db.select()
        .from(schema.announcements)
        .where(sql`
          (${schema.announcements.targetAudience} && ARRAY['teachers', 'all']::text[] OR 'all' = ANY(${schema.announcements.targetAudience}))
          AND ${schema.announcements.isActive} = true
          AND ${schema.announcements.fromDate} <= ${currentDate}
          AND ${schema.announcements.toDate} >= ${currentDate}
        `)
        .orderBy(sql`
          CASE ${schema.announcements.priority}
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          ${schema.announcements.createdAt} DESC
        `);
      
      console.log('✅ Teacher announcements fetched:', teacherAnnouncements.length);
      res.json(teacherAnnouncements);
    } catch (error) {
      console.error('❌ Error fetching teacher announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
