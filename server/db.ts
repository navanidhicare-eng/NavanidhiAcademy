// MANDATORY SUPABASE DATABASE CONNECTION - NEON COMPLETELY DISABLED
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// FORCE SUPABASE DATABASE URL AS PRIMARY CONNECTION
const SUPABASE_CONNECTION = process.env.SUPABASE_DATABASE_URL;
if (!SUPABASE_CONNECTION) {
  throw new Error("SUPABASE_DATABASE_URL is required - System enforces Supabase exclusively");
}

console.log('🚫 FORCING NEON DISCONNECTION - ORIGINAL DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 30) + '...');

// CRITICAL: OVERRIDE DATABASE_URL TO FORCE DRIZZLE TO USE SUPABASE
// This ensures drizzle.config.ts uses Supabase instead of Neon
process.env.DATABASE_URL = SUPABASE_CONNECTION;

console.log('✅ DATABASE_URL OVERRIDDEN TO SUPABASE:', process.env.DATABASE_URL?.slice(0, 30) + '...');

// COMPLETE REMOVAL OF ALL NEON/LOCAL DATABASE VARIABLES
delete process.env.PGHOST;
delete process.env.PGPORT; 
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;

console.log('🚫 NEON DATABASE COMPLETELY DISABLED');
console.log('🔗 SUPABASE DATABASE ENFORCED:', SUPABASE_CONNECTION.slice(0, 60) + '...');
console.log('✅ DATABASE_URL REDIRECTED TO SUPABASE');

// CREATE SUPABASE CONNECTION WITH REGULAR PG POOL (NO NEON DEPENDENCIES)
export const pool = new Pool({ 
  connectionString: SUPABASE_CONNECTION,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });

// IMMEDIATE CONNECTION VERIFICATION TO SUPABASE
pool.query('SELECT current_database(), current_user, version()', (err, result) => {
  if (err) {
    console.error('❌ SUPABASE CONNECTION FAILED:', err.message);
    throw new Error('Supabase connection mandatory - cannot proceed with Neon');
  } else {
    console.log('✅ SUPABASE DATABASE CONNECTED SUCCESSFULLY:');
    console.log('   Database:', result.rows[0].current_database);
    console.log('   User:', result.rows[0].current_user);
    console.log('   PostgreSQL Version:', result.rows[0].version.slice(0, 50) + '...');
    console.log('🎉 ALL DATABASE OPERATIONS NOW USE SUPABASE EXCLUSIVELY');
  }
});
