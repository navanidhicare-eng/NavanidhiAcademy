import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function createUsers() {
  try {
    console.log("Creating test users...");

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(schema.users).values({
      email: "admin@navanidhi.com",
      password: hashedAdminPassword,
      name: "Admin User",
      role: "admin",
      phone: "+91 98765 43210"
    }).returning();

    // Create SO Center user
    const hashedSoPassword = await bcrypt.hash("so123", 10);
    const [soUser] = await db.insert(schema.users).values({
      email: "so@navanidhi.com", 
      password: hashedSoPassword,
      name: "SO Center Manager",
      role: "so_center",
      phone: "+91 87654 32109"
    }).returning();

    // Create teacher user
    const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);
    const [teacherUser] = await db.insert(schema.users).values({
      email: "teacher@navanidhi.com",
      password: hashedTeacherPassword,
      name: "Math Teacher",
      role: "teacher",
      phone: "+91 76543 21098"
    }).returning();

    console.log("✓ Created Admin User:", adminUser.email);
    console.log("✓ Created SO Center User:", soUser.email);
    console.log("✓ Created Teacher User:", teacherUser.email);

    console.log("\n=== LOGIN CREDENTIALS ===");
    console.log("Admin Login:");
    console.log("  Email: admin@navanidhi.com");
    console.log("  Password: admin123");
    console.log("  Role: Admin");
    
    console.log("\nSO Center Login:");
    console.log("  Email: so@navanidhi.com");
    console.log("  Password: so123");
    console.log("  Role: SO Center");
    
    console.log("\nTeacher Login:");
    console.log("  Email: teacher@navanidhi.com");
    console.log("  Password: teacher123");
    console.log("  Role: Teacher");

  } catch (error) {
    console.error("Error creating users:", error);
  }
}

createUsers();