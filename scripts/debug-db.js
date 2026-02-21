import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "wappnet-07",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "cinemate",
  password: process.env.DB_PASSWORD,
});

async function test() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Connection successful:", res.rows[0]);

    const tableRes = await pool.query('SELECT * FROM "MovieBooking" LIMIT 1');
    console.log("Table query successful:", tableRes.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

test();
