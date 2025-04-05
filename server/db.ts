import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create the connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('No DATABASE_URL environment variable found');
}

// Create the connection
export const client = postgres(connectionString);

// Create the database connection with the schema
export const db = drizzle(client, { schema });