/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

// Use DATABASE_URL if available (for production), otherwise fall back to individual vars
const connectionString = process.env.DATABASE_URL;

const poolConfig: any = connectionString
  ? { connectionString }
  : {
      user: process.env.DB_USER || "wappnet-07",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "cinemate",
    };

// Only add password if not using connection string and it's actually set
if (!connectionString && process.env.DB_PASSWORD) {
  poolConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(poolConfig);

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

export default db;
