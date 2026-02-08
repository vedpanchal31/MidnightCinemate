
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

async function setupDatabase() {
  console.log(`Connecting to PostgreSQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  
  // Connect to 'postgres' database first to create the new database
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432'),
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to server.');

    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Database '${DB_NAME}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database '${DB_NAME}' created successfully.`);
    } else {
      console.log(`Database '${DB_NAME}' already exists.`);
    }
  } catch (err) {
    console.error('Error connecting to database server or creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }

  // Now connect to the new database to apply schema
  const dbClient = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432'),
    database: DB_NAME,
  });

  try {
    console.log(`Connecting to ${DB_NAME}...`);
    await dbClient.connect();

    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Applying schema...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await dbClient.query(schemaSql);
      console.log('Schema applied successfully.');
    } else {
      console.warn('schema.sql not found. Skipping schema application.');
    }

  } catch (err) {
    console.error(`Error applying schema to ${DB_NAME}:`, err);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

setupDatabase();
