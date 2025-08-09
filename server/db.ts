import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use Supabase database connection
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set to connect to Supabase database",
  );
}

console.log('🔗 Connecting to Supabase database...');
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
