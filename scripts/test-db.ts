import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/lib/db';

console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.query('SELECT version()');
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    console.log('\nListing tables...');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    await db.pool.end();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
