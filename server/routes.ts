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

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { email, password, role } = req.body;
      
      if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
      }
      
      // Demo users for testing
      const demoUsers = [
        {
          id: "demo-admin-1",
          email: "admin@demo.com",
          password: "admin123",
          name: "Admin User",
          role: "admin"
        },
        {
          id: "demo-so-1", 
          email: "so@demo.com",
          password: "so123",
          name: "SO Center Manager",
          role: "so_center"
        },
        {
          id: "demo-teacher-1",
          email: "teacher@demo.com", 
          password: "teacher123",
          name: "Math Teacher",
          role: "teacher"
        }
      ];

      // Check for demo users first
      console.log("Checking demo users for:", email, role);
      const demoUser = demoUsers.find(u => 
        u.email === email && 
        u.password === password && 
        u.role === role
      );
      
      if (demoUser) {
        console.log("Demo user found:", demoUser.email);
        try {
          const token = jwt.sign(
            { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          console.log("Token generated successfully");
          return res.json({
            token,
            user: {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
            }
          });
        } catch (jwtError) {
          console.error("JWT Error:", jwtError);
          return res.status(500).json({ message: "Token generation failed" });
        }
      }

      console.log("No demo user found, trying database...");
      // Try database users
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.role !== role) {
          return res.status(401).json({ message: "Invalid role selection" });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
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

  // Student routes
  app.get("/api/students", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { soCenterId } = req.query;
      
      if (req.user.role === 'so_center' && soCenterId) {
        const students = await storage.getStudentsBySoCenter(soCenterId as string);
        res.json(students);
      } else if (req.user.role === 'admin') {
        // Admin can see all students - implement if needed
        res.json([]);
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

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Return mock stats for now - replace with actual calculations
      const stats = {
        totalStudents: 156,
        paymentsThisMonth: 45200,
        topicsCompleted: 1247,
        walletBalance: 12450,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Wallet endpoint
  app.get("/api/wallet/:userId", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Return mock wallet data for now
      const walletData = {
        balance: 12450,
        transactions: [
          { 
            id: 1, 
            type: 'credit', 
            amount: 2500, 
            description: 'Payment from Arjun Reddy', 
            date: new Date().toLocaleDateString() 
          },
          { 
            id: 2, 
            type: 'credit', 
            amount: 3000, 
            description: 'Payment from Sneha Patel', 
            date: new Date(Date.now() - 86400000).toLocaleDateString() 
          },
          { 
            id: 3, 
            type: 'debit', 
            amount: 5000, 
            description: 'Collection by Agent', 
            date: new Date(Date.now() - 172800000).toLocaleDateString() 
          },
        ]
      };

      res.json(walletData);
    } catch (error) {
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

  app.get("/api/admin/addresses/districts/:stateId", authenticateToken, async (req, res) => {
    try {
      const districts = await storage.getDistrictsByState(req.params.stateId);
      res.json(districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
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
    } catch (error) {
      console.error('Error creating SO Center:', error);
      res.status(500).json({ message: 'Failed to create SO Center' });
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

  const httpServer = createServer(app);
  return httpServer;
}
