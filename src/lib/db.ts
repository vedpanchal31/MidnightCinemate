/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const poolConfig: any = {
  user: process.env.DB_USER || 'wappnet-07',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cinemate',
};

// Only add password if it's actually set
if (process.env.DB_PASSWORD) {
  poolConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(poolConfig);

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

export default db;
