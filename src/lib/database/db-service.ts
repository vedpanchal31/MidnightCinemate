import { db } from '@/lib/db';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  is_email_verified: boolean;
  is_active: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
  last_login?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OTP {
  id: string;
  email: string;
  code: string;
  type: number;
  expires_at: Date;
  attempts: number;
  is_used: boolean;
  created_at: Date;
}

// User operations
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await db.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<User> => {
  const result = await db.query(
    `INSERT INTO "User" (email, password, name, phone, "is_email_verified", "is_active", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [userData.email, userData.password, userData.name, userData.phone || null]
  );
  return result.rows[0];
};

export const updateUser = async (email: string, updates: Partial<User>): Promise<boolean> => {
  const updateFields: string[] = [];
  const values: (string | number | boolean | Date)[] = [];
  let paramCount = 1;

  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) return false;

  // Always update updatedAt
  updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  values.push(email);

  const query = `UPDATE "User" SET ${updateFields.join(', ')} WHERE email = $${paramCount}`;
  const result = await db.query(query, values);
  
  return result.rowCount ? result.rowCount > 0 : false;
};

// OTP operations
export const createOTP = async (otpData: {
  email: string;
  code: string;
  type: number;
  expires_at: Date;
}): Promise<OTP> => {
  const result = await db.query(
    `INSERT INTO "OTP" (email, code, type, expires_at, attempts, is_used, created_at)
     VALUES ($1, $2, $3, $4, 0, false, CURRENT_TIMESTAMP)
     RETURNING *`,
    [otpData.email, otpData.code, otpData.type, otpData.expires_at]
  );
  return result.rows[0];
};

export const findValidOTP = async (
  email: string,
  code: string,
  type: number
): Promise<OTP | null> => {
  const result = await db.query(
    `SELECT * FROM "OTP" 
     WHERE email = $1 
     AND code = $2 
     AND type = $3 
     AND is_used = false 
     AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code, type]
  );
  return result.rows[0] || null;
};

export const markOTPAsUsed = async (
  email: string,
  code: string,
  type: number
): Promise<boolean> => {
  const result = await db.query(
    `UPDATE "OTP" 
     SET is_used = true, attempts = attempts + 1 
     WHERE email = $1 AND code = $2 AND type = $3`,
    [email, code, type]
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const findRecentOTP = async (
  email: string,
  type: number,
  minutesAgo: number = 2
): Promise<OTP | null> => {
  const result = await db.query(
    `SELECT * FROM "OTP" 
     WHERE email = $1 
     AND type = $2 
     AND is_used = false 
     AND created_at > (CURRENT_TIMESTAMP - INTERVAL '${minutesAgo} minutes')
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, type]
  );
  return result.rows[0] || null;
};
