import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// COMPLETELY DISCONNECT FROM NEON - SUPABASE ONLY
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!supabaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL is required");
}

// Delete all references to Neon database
delete process.env.DATABASE_URL;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

console.log('🚫 NEON DATABASE COMPLETELY DISCONNECTED');
console.log('🔗 CONNECTING EXCLUSIVELY TO SUPABASE:', supabaseUrl.slice(0, 50) + '...');

// Force only Supabase connection
export const pool = new Pool({ 
  connectionString: supabaseUrl,
  max: 10,
  connectionTimeoutMillis: 5000
});
export const db = drizzle({ client: pool, schema });
