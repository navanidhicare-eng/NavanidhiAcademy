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
import { storage } from "./storage";
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
  insertSoCenterSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "navanidhi-academy-secret-key-2024";

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
  
  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
  });

  // Auth routes - Single login with automatic role detection
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      let user = null;
      let loginIdentifier = email;

      try {
        // First, try to find user by email
        console.log(`🔍 Looking up user by email: ${email}`);
        user = await storage.getUserByEmail(email);
        
        // If not found by email, check if it's a SO Center ID
        if (!user) {
          console.log(`📱 Trying to find SO Center by Center ID: ${email}`);
          const soCenter = await storage.getSoCenterByCenterId(email);
          
          if (soCenter && soCenter.email) {
            console.log(`🏢 Found SO Center: ${soCenter.name}, looking up user by email: ${soCenter.email}`);
            user = await storage.getUserByEmail(soCenter.email);
            loginIdentifier = soCenter.email;
          }
        }
        
        if (!user) {
          console.log(`❌ User not found for identifier: ${email}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log(`✅ User found: ${user.name} (${user.email}) with role: ${user.role}`);
        console.log(`🔐 Verifying password...`);
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`🔐 Password verification result: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log(`❌ Password mismatch for user: ${loginIdentifier}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        console.log(`🎉 Authentication successful for ${loginIdentifier}`);

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
      const user = await storage.getUser(req.user!.userId);
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

  // Student routes
  app.get("/api/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { soCenterId } = req.query;
      
      if (req.user.role === 'so_center' && soCenterId) {
        const students = await storage.getStudentsBySoCenter(soCenterId as string);
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

  const httpServer = createServer(app);
  return httpServer;
}
