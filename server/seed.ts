import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  try {
    console.log("Seeding database...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [adminUser] = await db.insert(schema.users).values({
      email: "admin@navanidhi.com",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
      phone: "+91 98765 43210"
    }).returning();

    console.log("Created admin user:", adminUser.email);

    // Create SO Center
    const [soCenter] = await db.insert(schema.soCenters).values({
      name: "Main SO Center",
      address: "123 Education Street, Hyderabad",
      phone: "+91 87654 32109",
      managerId: adminUser.id
    }).returning();

    console.log("Created SO Center:", soCenter.name);

    // Create SO Center manager user
    const soCenterPassword = await bcrypt.hash("so123", 10);
    const [soCenterUser] = await db.insert(schema.users).values({
      email: "so@navanidhi.com",
      password: soCenterPassword,
      name: "SO Center Manager",
      role: "so_center",
      phone: "+91 76543 21098"
    }).returning();

    console.log("Created SO Center user:", soCenterUser.email);

    // Create classes
    const classes = await db.insert(schema.classes).values([
      { name: "Class 10", description: "Secondary School Class 10" },
      { name: "Class 12", description: "Higher Secondary Class 12" },
      { name: "Navodaya", description: "Navodaya Entrance Preparation" },
      { name: "POLYCET", description: "Polytechnic Common Entrance Test" }
    ]).returning();

    console.log("Created classes:", classes.map(c => c.name));

    // Create subjects for Class 10
    const subjects = await db.insert(schema.subjects).values([
      { name: "Mathematics", classId: classes[0].id, description: "Mathematics for Class 10" },
      { name: "Physics", classId: classes[0].id, description: "Physics for Class 10" },
      { name: "Chemistry", classId: classes[0].id, description: "Chemistry for Class 10" }
    ]).returning();

    console.log("Created subjects:", subjects.map(s => s.name));

    // Create chapters for Mathematics
    const chapters = await db.insert(schema.chapters).values([
      { name: "Quadratic Equations", subjectId: subjects[0].id, description: "Introduction to quadratic equations", orderIndex: 1 },
      { name: "Arithmetic Progressions", subjectId: subjects[0].id, description: "Arithmetic progressions and series", orderIndex: 2 }
    ]).returning();

    console.log("Created chapters:", chapters.map(c => c.name));

    // Create topics for Quadratic Equations
    const topics = await db.insert(schema.topics).values([
      { name: "Introduction to Quadratic Equations", chapterId: chapters[0].id, description: "Understanding the standard form ax² + bx + c = 0", orderIndex: 1 },
      { name: "Methods of Solving Quadratic Equations", chapterId: chapters[0].id, description: "Factorization, completing the square, and quadratic formula", orderIndex: 2 },
      { name: "Nature of Roots", chapterId: chapters[0].id, description: "Discriminant and nature of roots", orderIndex: 3 }
    ]).returning();

    console.log("Created topics:", topics.map(t => t.name));

    // Create sample students
    const students = await db.insert(schema.students).values([
      {
        name: "Arjun Reddy",
        classId: classes[0].id,
        parentPhone: "+91 98765 43210",
        parentName: "Rajesh Reddy",
        soCenterId: soCenter.id,
        courseType: "monthly_tuition"
      },
      {
        name: "Sneha Patel",
        classId: classes[2].id, // Navodaya
        parentPhone: "+91 87654 32109",
        parentName: "Suresh Patel",
        soCenterId: soCenter.id,
        courseType: "fixed_fee"
      }
    ]).returning();

    console.log("Created students:", students.map(s => s.name));

    console.log("Database seeded successfully!");
    console.log("\nLogin credentials:");
    console.log("Admin: admin@navanidhi.com / admin123");
    console.log("SO Center: so@navanidhi.com / so123");

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();