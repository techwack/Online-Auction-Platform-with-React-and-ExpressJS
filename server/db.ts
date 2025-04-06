import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg; // Destructure Pool from the default export
import * as schema from '../shared/schema';
import 'dotenv/config'; // Add this line

if (!process.env.DATABASE_URL) {
  throw new Error('No DATABASE_URL environment variable found');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });