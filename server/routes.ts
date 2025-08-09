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
import { storage, db, getUsersByRole, executeRawQuery } from "./storage";
import { FeeCalculationService } from './feeCalculationService';
import { MonthlyFeeScheduler } from './monthlyFeeScheduler';
// import { supabaseAdmin } from './supabaseClient';
// import { createAdminUser } from './createAdminUser';
import { sql as sqlQuery } from "drizzle-orm";
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
} from "@shared/schema";
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || "navanidhi-academy-secret-key-2024";

// Initialize admin user on server start - temporarily disabled
// Will enable after Supabase setup is complete
// (async () => {
//   try {
//     await createAdminUser();
//   } catch (error) {
//     console.error('Failed to initialize admin user:', error);
//   }
// })();

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize teacher storage
  // Teacher management now integrated with User system
  
  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
  });

  // Auth routes - Supabase Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      try {
        // Temporary authentication until Supabase is properly configured
        console.log(`🔐 Looking up user: ${email}`);
        
        // Check if this is the admin user we need to create
        if (email === 'navanidhi.care@gmail.com' && password === 'Psd@1986') {
          // Create admin user if doesn't exist
          let user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log('🔧 Creating admin user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await storage.createUser({
              email: email,
              role: 'admin',
              name: 'Admin User',
              isActive: true,
              password: hashedPassword
            });
            console.log('✅ Admin user created:', user.id);
          }
          
          console.log(`✅ Admin user found:`, { id: user.id, email: user.email, role: user.role });
        } else {
          // Regular user authentication
          let user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`❌ User not found: ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
          }
          
          const isValidPassword = await bcrypt.compare(password, user.password || '');
          if (!isValidPassword) {
            console.log(`❌ Password mismatch for user: ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
          }
          
          console.log(`✅ User authenticated:`, { id: user.id, email: user.email, role: user.role });
        }

        // Get user from database (needed for both cases)
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          console.log(`❌ User not found in database: ${email}`);
          return res.status(401).json({ message: "User not found" });
        }

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
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
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

  // Public route for QR code progress (no auth required)
  app.get("/api/public/progress/:qrCode", async (req, res) => {
    try {
      const student = await storage.getStudentByQr(req.params.qrCode);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const progress = await storage.getStudentProgress(student.id);
      res.json({
        student,
        progress,
      });
    } catch (error) {
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

  app.get("/api/subjects/:classId", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getSubjectsByClass(req.params.classId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
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

      // Calculate real stats from Supabase database
      const soCenterId = '84bf6d19-8830-4abd-8374-2c29faecaa24';
      const soCenter = await storage.getSoCenter(soCenterId);
      const totalStudents = await storage.getStudentsBySoCenter(soCenterId);
      
      // Calculate payments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const payments = await storage.getPaymentsByDateRange(soCenterId, startOfMonth, new Date());
      const paymentsThisMonth = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const stats = {
        totalStudents: totalStudents.length,
        paymentsThisMonth: Math.round(paymentsThisMonth),
        topicsCompleted: 0, // TODO: Calculate from progress data
        walletBalance: parseFloat(soCenter?.walletBalance || '0'),
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

  // Enhanced user creation endpoint
  app.post("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Convert numeric fields to strings before validation
      const bodyWithStringFields = {
        ...req.body,
        salary: req.body.salary ? String(req.body.salary) : undefined,
      };

      const userData = insertUserSchema.parse(bodyWithStringFields);
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
        // isPasswordChanged defaults to false in schema
      });

      // Remove password from response
      const { password, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // SO Center endpoints
  app.get("/api/admin/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
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

  app.post("/api/admin/so-centers", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Convert numeric fields to strings before validation
      const centerDataWithStringFields = {
        ...req.body,
        rentAmount: req.body.rentAmount ? String(req.body.rentAmount) : undefined,
        rentalAdvance: req.body.rentalAdvance ? String(req.body.rentalAdvance) : undefined,
        electricityAmount: req.body.electricityAmount ? String(req.body.electricityAmount) : undefined,
        internetAmount: req.body.internetAmount ? String(req.body.internetAmount) : undefined,
      };

      const hashedPassword = await bcrypt.hash(centerDataWithStringFields.password || '12345678', 12);
      
      const newCenter = await storage.createSoCenter({
        ...centerDataWithStringFields,
        password: hashedPassword
        // isPasswordChanged defaults to false in schema
      });

      // Remove password from response
      const { password, ...centerResponse } = newCenter;
      res.status(201).json(centerResponse);
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

  // Update user
  app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 12);
      }
      const user = await storage.updateUser(req.params.id, updates);
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteUser(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
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
      const fees = await storage.getAllFeeStructures();
      res.json(fees);
    } catch (error) {
      console.error('Error fetching fees:', error);
      res.status(500).json({ message: 'Failed to fetch fees' });
    }
  });

  app.post("/api/admin/fees", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const feeData = req.body;
      const newFee = await storage.createFeeStructure(feeData);
      res.status(201).json(newFee);
    } catch (error) {
      console.error('Error creating fee:', error);
      res.status(500).json({ message: 'Failed to create fee' });
    }
  });

  app.put("/api/admin/fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const updates = req.body;
      const updatedFee = await storage.updateFeeStructure(req.params.id, updates);
      res.json(updatedFee);
    } catch (error) {
      console.error('Error updating fee:', error);
      res.status(500).json({ message: 'Failed to update fee' });
    }
  });

  app.delete("/api/admin/fees/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      await storage.deleteFeeStructure(req.params.id);
      res.json({ message: 'Fee deleted successfully' });
    } catch (error) {
      console.error('Error deleting fee:', error);
      res.status(500).json({ message: 'Failed to delete fee' });
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

  const httpServer = createServer(app);
  return httpServer;
}
