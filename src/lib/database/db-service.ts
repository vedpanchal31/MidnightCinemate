import { db } from "@/lib/db";
import {
  TimeSlot,
  CreateTimeSlotRequest,
  UpdateTimeSlotRequest,
  TimeSlotQuery,
  Booking,
  CreateBookingRequest,
  BookingStatus,
  Payment,
} from "./schema";

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
  const result = await db.query('SELECT * FROM "User" WHERE email = $1', [
    email,
  ]);
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
    [userData.email, userData.password, userData.name, userData.phone || null],
  );
  return result.rows[0];
};

export const updateUser = async (
  email: string,
  updates: Partial<User>,
): Promise<boolean> => {
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

  const query = `UPDATE "User" SET ${updateFields.join(", ")} WHERE email = $${paramCount}`;
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
    [otpData.email, otpData.code, otpData.type, otpData.expires_at],
  );
  return result.rows[0];
};

export const findValidOTP = async (
  email: string,
  code: string,
  type: number,
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
    [email, code, type],
  );
  return result.rows[0] || null;
};

export const markOTPAsUsed = async (
  email: string,
  code: string,
  type: number,
): Promise<boolean> => {
  const result = await db.query(
    `UPDATE "OTP" 
     SET is_used = true, attempts = attempts + 1 
     WHERE email = $1 AND code = $2 AND type = $3`,
    [email, code, type],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const findRecentOTP = async (
  email: string,
  type: number,
  minutesAgo: number = 2,
): Promise<OTP | null> => {
  const result = await db.query(
    `SELECT * FROM "OTP" 
     WHERE email = $1 
     AND type = $2 
     AND is_used = false 
     AND created_at > (CURRENT_TIMESTAMP - INTERVAL '${minutesAgo} minutes')
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, type],
  );
  return result.rows[0] || null;
};

// Time Slot operations (using existing Timeslot table)
export const createTimeSlot = async (
  timeSlotData: CreateTimeSlotRequest,
): Promise<TimeSlot> => {
  const result = await db.query(
    `INSERT INTO "Timeslot" 
     (tmdb_movie_id, show_date, "startTime", "endTime", screen_type, total_seats, available_seats, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      timeSlotData.tmdb_movie_id,
      timeSlotData.show_date,
      timeSlotData.show_time,
      timeSlotData.show_time, // using show_time for both start and end for now
      timeSlotData.screen_type,
      timeSlotData.total_seats,
      timeSlotData.total_seats, // initially all seats are available
    ],
  );

  // Transform to match TimeSlot interface
  const moment = (await import("moment")).default;
  const row = result.rows[0];
  return {
    id: row.id,
    tmdb_movie_id: row.tmdb_movie_id,
    show_date: moment(row.show_date).format("YYYY-MM-DD"),
    show_time: row.startTime,
    total_seats: row.total_seats,
    available_seats: row.available_seats,
    price: 12.99, // default price
    screen_type: row.screen_type,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
};

export const getTimeSlotsByMovie = async (
  tmdb_movie_id: number,
  date_from?: string,
  date_to?: string,
): Promise<TimeSlot[]> => {
  let query = `
    SELECT 
      t.*,
      COALESCE(b.booked_count, 0) as booked_count
    FROM "Timeslot" t
    LEFT JOIN (
      SELECT timeslot_id, tmdb_movie_id, COUNT(*) as booked_count
      FROM "MovieBooking"
      WHERE status IN ($2, $3)
      GROUP BY timeslot_id, tmdb_movie_id
    ) b ON t.id = b.timeslot_id AND b.tmdb_movie_id = $1
    WHERE t."isActive" = true AND t.tmdb_movie_id IS NULL
  `;
  const params: (string | number)[] = [
    tmdb_movie_id,
    BookingStatus.CONFIRMED,
    BookingStatus.PENDING_PAYMENT,
  ];
  let paramCount = 4;

  if (date_from) {
    query += ` AND t.show_date >= $${paramCount}`;
    params.push(date_from);
    paramCount++;
  }

  if (date_to) {
    query += ` AND t.show_date <= $${paramCount}`;
    params.push(date_to);
    paramCount++;
  }

  query += ` ORDER BY t.show_date, t."startTime"`;

  const result = await db.query(query, params);

  // Transform to match TimeSlot interface
  const moment = (await import("moment")).default;
  return result.rows.map((row) => ({
    id: row.id,
    tmdb_movie_id: tmdb_movie_id,
    show_date: moment(row.show_date).format("YYYY-MM-DD"),
    show_time: row.startTime,
    total_seats: row.total_seats,
    available_seats: row.total_seats - parseInt(row.booked_count),
    price: 12.99,
    screen_type: row.screen_type || "2D",
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }));
};

export const getTimeSlotById = async (id: string): Promise<TimeSlot | null> => {
  const result = await db.query(
    'SELECT * FROM "Timeslot" WHERE id = $1 AND isActive = true',
    [id],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    tmdb_movie_id: 0, // default value since column doesn't exist
    show_date: row.show_date,
    show_time: row.startTime,
    total_seats: row.total_seats,
    available_seats: row.available_seats,
    price: 12.99, // default price since column doesn't exist
    screen_type: row.screen_type || "2D",
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
};

export const updateTimeSlot = async (
  id: string,
  updates: UpdateTimeSlotRequest,
): Promise<TimeSlot | null> => {
  const updateFields: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`"${key}" = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) return null;

  updateFields.push(`"updated_at" = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE "TimeSlot" SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);

  return result.rows[0] || null;
};

export const deleteTimeSlot = async (id: string): Promise<boolean> => {
  const result = await db.query(
    'UPDATE "TimeSlot" SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const updateAvailableSeats = async (
  id: string,
  seatsChange: number,
): Promise<TimeSlot | null> => {
  const result = await db.query(
    `UPDATE "TimeSlot" 
     SET available_seats = available_seats + $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND available_seats + $1 >= 0
     RETURNING *`,
    [seatsChange, id],
  );
  return result.rows[0] || null;
};

export const getAllTimeSlots = async (
  query?: TimeSlotQuery,
): Promise<TimeSlot[]> => {
  let sql = `
    SELECT * FROM "Timeslot" 
    WHERE "isActive" = true
  `;
  const params: (string | number)[] = [];
  let paramCount = 1;

  if (query) {
    if (query.tmdb_movie_id) {
      sql += ` AND tmdb_movie_id = $${paramCount}`;
      params.push(query.tmdb_movie_id);
      paramCount++;
    }

    if (query.date_from) {
      sql += ` AND show_date >= $${paramCount}`;
      params.push(query.date_from);
      paramCount++;
    }

    if (query.date_to) {
      sql += ` AND show_date <= $${paramCount}`;
      params.push(query.date_to);
      paramCount++;
    }

    if (query.screen_type) {
      sql += ` AND screen_type = $${paramCount}`;
      params.push(query.screen_type);
      paramCount++;
    }
  }

  sql += ` ORDER BY show_date, "startTime"`;

  const result = await db.query(sql, params);

  // Transform to match TimeSlot interface (independent time slots)
  return result.rows.map((row) => ({
    id: row.id,
    tmdb_movie_id: 0, // not associated with any movie
    show_date: row.show_date,
    show_time: row.startTime,
    total_seats: row.total_seats,
    available_seats: row.available_seats,
    price: 12.99, // default price since column doesn't exist
    screen_type: row.screen_type || "2D",
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }));
};

// Booking Operations
export const createBooking = async (
  bookingData: CreateBookingRequest,
): Promise<Booking[]> => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Check if ANY of the requested seats are already booked OR pending for this movie/slot
    const checkSeatsQuery = `
      SELECT seat_id FROM "MovieBooking"
      WHERE timeslot_id = $1 AND tmdb_movie_id = $2 AND seat_id = ANY($3) 
      AND status IN ($4, $5)
    `;
    const checkSeatsResult = await client.query(checkSeatsQuery, [
      bookingData.timeslot_id,
      bookingData.tmdb_movie_id,
      bookingData.seat_ids,
      BookingStatus.CONFIRMED,
      BookingStatus.PENDING_PAYMENT,
    ]);

    if (checkSeatsResult.rows.length > 0) {
      const taken = checkSeatsResult.rows.map((r) => r.seat_id).join(", ");
      throw new Error(`Seats already taken: ${taken}`);
    }

    const values: (string | number)[] = [];
    const placeholders: string[] = [];
    let paramCount = 1;

    const pricePerSeat = bookingData.amount / bookingData.seat_ids.length;

    bookingData.seat_ids.forEach((seatId) => {
      placeholders.push(
        `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`,
      );
      values.push(
        bookingData.user_id || "guest",
        bookingData.tmdb_movie_id,
        bookingData.show_date,
        bookingData.show_time,
        seatId,
        pricePerSeat,
        BookingStatus.PENDING_PAYMENT,
        bookingData.timeslot_id,
      );
      paramCount += 8;
    });

    const insertQuery = `
      INSERT INTO "MovieBooking" (user_id, tmdb_movie_id, show_date, show_time, seat_id, price, status, timeslot_id)
      VALUES ${placeholders.join(", ")}
      RETURNING *
    `;

    const result = await client.query(insertQuery, values);

    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getBookingsByMovieAndTime = async (
  tmdb_movie_id: number,
  show_date: string,
  show_time: string,
): Promise<Booking[]> => {
  // Ensure show_time is in a consistent format
  const sanitizedTime = show_time.includes(":")
    ? show_time.split(":").slice(0, 3).join(":")
    : show_time;

  const result = await db.query(
    `SELECT * FROM "MovieBooking" 
     WHERE tmdb_movie_id = $1 
     AND show_date = $2::date
     AND show_time = $3::time
     AND status IN ($4, $5)`,
    [
      tmdb_movie_id,
      show_date,
      sanitizedTime,
      BookingStatus.CONFIRMED,
      BookingStatus.PENDING_PAYMENT,
    ],
  );
  return result.rows;
};

export const getBookingsByUser = async (
  user_id: string,
): Promise<Booking[]> => {
  const result = await db.query(
    `SELECT * FROM "MovieBooking" 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [user_id],
  );
  return result.rows;
};

// Payment Operations
export const createPayment = async (
  paymentData: Partial<Payment>,
): Promise<Payment> => {
  const result = await db.query(
    `INSERT INTO "Payment" (stripe_session_id, stripe_payment_id, amount, currency, status, payment_method)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      paymentData.stripe_session_id,
      paymentData.stripe_payment_id || null,
      paymentData.amount,
      paymentData.currency || "inr",
      paymentData.status || "pending",
      paymentData.payment_method || "card",
    ],
  );
  return result.rows[0];
};

export const updatePaymentStatus = async (
  sessionId: string,
  status: string,
  paymentId?: string,
): Promise<boolean> => {
  const result = await db.query(
    `UPDATE "Payment" 
     SET status = $2, stripe_payment_id = COALESCE($3, stripe_payment_id)
     WHERE stripe_session_id = $1`,
    [sessionId, status, paymentId || null],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const updateBookingStatusBySession = async (
  sessionId: string,
  status: BookingStatus,
  paymentId?: string,
): Promise<boolean> => {
  const result = await db.query(
    `UPDATE "MovieBooking" 
     SET status = $2, stripe_payment_id = COALESCE($3, stripe_payment_id)
     WHERE stripe_session_id = $1`,
    [sessionId, status, paymentId || null],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};
