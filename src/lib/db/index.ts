import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

if (connectionString) {
  const pool = new Pool({ connectionString });
  dbInstance = drizzle(pool, { schema });
} else {
  // Graceful fallback for local development before DATABASE_URL is configured
  console.warn('[DB] DATABASE_URL not detected. Drizzle ORM running in development placeholder mode.');
}

export const db = dbInstance;
export { schema };
