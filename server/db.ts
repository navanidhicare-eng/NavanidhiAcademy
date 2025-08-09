// BYPASS NEON COMPLETELY - USE REGULAR PG POOL FOR SUPABASE
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// HARDCODED SUPABASE CONNECTION - NO NEON IMPORTS OR REFERENCES
const SUPABASE_CONNECTION = process.env.SUPABASE_DATABASE_URL;
if (!SUPABASE_CONNECTION) {
  throw new Error("SUPABASE_DATABASE_URL is required - Neon completely disabled");
}

// FORCE DELETE ALL NEON/LOCAL DATABASE ENVIRONMENT VARIABLES
delete process.env.DATABASE_URL;
delete process.env.PGHOST;
delete process.env.PGPORT; 
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

console.log('🚫 NEON SERVERLESS COMPLETELY BYPASSED');
console.log('🔗 SUPABASE DIRECT CONNECTION:', SUPABASE_CONNECTION.slice(0, 60) + '...');

// CREATE DIRECT SUPABASE CONNECTION WITH REGULAR PG POOL (NOT NEON)
export const pool = new Pool({ 
  connectionString: SUPABASE_CONNECTION,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });

// Test the connection immediately after creating the pool
pool.query('SELECT current_database(), current_user, version()', (err, result) => {
  if (err) {
    console.error('❌ SUPABASE CONNECTION FAILED:', err.message);
  } else {
    console.log('✅ SUPABASE CONNECTION VERIFIED:');
    console.log('   Database:', result.rows[0].current_database);
    console.log('   User:', result.rows[0].current_user);
    console.log('   Version:', result.rows[0].version.slice(0, 50) + '...');
  }
});
