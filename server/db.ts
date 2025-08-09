import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// FORCE EXCLUSIVE SUPABASE DATABASE CONNECTION
// Override any DATABASE_URL with SUPABASE_DATABASE_URL to prevent local DB usage
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!supabaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL is required - local database disabled");
}

// Force override DATABASE_URL to prevent any local database connections
process.env.DATABASE_URL = supabaseUrl;

console.log('🔗 FORCING connection to Supabase database ONLY');
console.log('⚠️  All DATABASE_URL references redirected to Supabase');
export const pool = new Pool({ connectionString: supabaseUrl });
export const db = drizzle({ client: pool, schema });
