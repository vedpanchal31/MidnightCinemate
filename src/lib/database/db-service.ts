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

const DEFAULT_SHOW_TIMES = ["10:00", "13:30", "17:00", "20:30"];
const DEFAULT_SCREEN_TYPES: TimeSlot["screen_type"][] = [
  "2D",
  "3D",
  "IMAX",
  "4DX",
];
const DEFAULT_TOTAL_SEATS = 100;
const SLOT_WINDOW_DAYS = 365;

const formatDbDate = async (value: string | Date): Promise<string> => {
  const moment = (await import("moment")).default;
  return moment(value).format("YYYY-MM-DD");
};

const mapTimeslotRowToModel = async (
  row: Record<string, unknown>,
  fallbackMovieId?: number,
): Promise<TimeSlot> => {
  const tmdbMovieId = Number(row.tmdb_movie_id ?? fallbackMovieId ?? 0);
  const totalSeats = Number(row.total_seats ?? 0);
  const availableSeats = Number(row.available_seats ?? 0);
  const bookedCount = Number(row.booked_count ?? 0);

  return {
    id: String(row.id),
    tmdb_movie_id: tmdbMovieId,
    show_date: await formatDbDate((row.show_date as string | Date) ?? ""),
    show_time: String(row.startTime ?? row.show_time),
    total_seats: totalSeats,
    available_seats:
      bookedCount > 0 ? Math.max(0, totalSeats - bookedCount) : availableSeats,
    booked_seats:
      bookedCount > 0 ? bookedCount : Math.max(0, totalSeats - availableSeats),
    price: Number(row.price ?? 12.99),
    screen_type: (row.screen_type as TimeSlot["screen_type"]) || "2D",
    is_active: Boolean(row.isActive ?? row.is_active),
    created_at: row.createdAt as Date,
    updated_at: row.updatedAt as Date,
  };
};

export const ensureTimeSlotInfrastructure = async (): Promise<void> => {
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
    ON "Timeslot"(tmdb_movie_id, show_date, "startTime", screen_type)
    WHERE tmdb_movie_id IS NOT NULL;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS "TimeSlotApiLog" (
      id BIGSERIAL PRIMARY KEY,
      tmdb_movie_id INTEGER,
      date_from DATE,
      date_to DATE,
      request_payload JSONB,
      response_count INTEGER DEFAULT 0,
      status VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(
    'ALTER TABLE "TimeSlotApiLog" DROP COLUMN IF EXISTS endpoint, DROP COLUMN IF EXISTS error_message',
  );

  await db.query(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY tmdb_movie_id
          ORDER BY created_at DESC, id DESC
        ) AS rn
      FROM "TimeSlotApiLog"
      WHERE tmdb_movie_id IS NOT NULL
    )
    DELETE FROM "TimeSlotApiLog" l
    USING ranked r
    WHERE l.id = r.id AND r.rn > 1;
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_api_log_tmdb_movie_id_unique
    ON "TimeSlotApiLog"(tmdb_movie_id)
    WHERE tmdb_movie_id IS NOT NULL;
  `);
};

export const logTimeSlotApiActivity = async ({
  tmdb_movie_id,
  date_from,
  date_to,
  request_payload,
  response_count,
  status,
}: {
  tmdb_movie_id?: number;
  date_from?: string;
  date_to?: string;
  request_payload?: Record<string, unknown>;
  response_count?: number;
  status: "success" | "error";
}): Promise<void> => {
  if (!tmdb_movie_id || tmdb_movie_id <= 0) {
    return;
  }

  await db.query(
    `INSERT INTO "TimeSlotApiLog"
      (tmdb_movie_id, date_from, date_to, request_payload, response_count, status)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     ON CONFLICT (tmdb_movie_id) WHERE tmdb_movie_id IS NOT NULL
     DO UPDATE SET
      date_from = EXCLUDED.date_from,
      date_to = EXCLUDED.date_to,
      request_payload = EXCLUDED.request_payload,
      response_count = EXCLUDED.response_count,
      status = EXCLUDED.status,
      created_at = CURRENT_TIMESTAMP`,
    [
      tmdb_movie_id,
      date_from || null,
      date_to || null,
      JSON.stringify(request_payload || {}),
      response_count || 0,
      status,
    ],
  );
};

const getDateRange = (date_from?: string, date_to?: string) => {
  const today = new Date();
  const start = date_from ? new Date(date_from) : today;
  const minimumEnd = new Date(
    start.getTime() + (SLOT_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000,
  );
  const requestedEnd = date_to ? new Date(date_to) : minimumEnd;
  const end = requestedEnd > minimumEnd ? requestedEnd : minimumEnd;

  const normalizedStart = new Date(start);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(0, 0, 0, 0);

  return {
    start: normalizedStart,
    end: normalizedEnd,
  };
};

export const ensureTimeSlotsForMovie = async (
  tmdb_movie_id: number,
  date_from?: string,
  date_to?: string,
): Promise<number> => {
  const { start, end } = getDateRange(date_from, date_to);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const result = await db.query(
    `WITH dates AS (
       SELECT generate_series($2::date, $3::date, interval '1 day')::date AS show_date
     ),
     times AS (
       SELECT unnest($4::time[]) AS show_time
     ),
     screens AS (
       SELECT unnest($5::text[]) AS screen_type
     )
     INSERT INTO "Timeslot"
       (tmdb_movie_id, show_date, "startTime", "endTime", screen_type, total_seats, available_seats, "isActive", "createdAt", "updatedAt")
     SELECT
       $1,
       d.show_date,
       t.show_time,
       t.show_time,
       s.screen_type,
       $6,
       $6,
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
     FROM dates d
     CROSS JOIN times t
     CROSS JOIN screens s
     WHERE NOT EXISTS (
       SELECT 1
       FROM "Timeslot" existing
       WHERE existing.tmdb_movie_id = $1
         AND existing.show_date = d.show_date
         AND existing."startTime" = t.show_time
         AND existing.screen_type = s.screen_type
     )
     RETURNING id`,
    [
      tmdb_movie_id,
      startDate,
      endDate,
      DEFAULT_SHOW_TIMES,
      DEFAULT_SCREEN_TYPES,
      DEFAULT_TOTAL_SEATS,
    ],
  );

  return result.rowCount || 0;
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

  return mapTimeslotRowToModel(result.rows[0]);
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
    WHERE t."isActive" = true AND t.tmdb_movie_id = $1
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

  return Promise.all(
    result.rows.map((row) => mapTimeslotRowToModel(row, tmdb_movie_id)),
  );
};

export const getTimeSlotById = async (id: string): Promise<TimeSlot | null> => {
  const result = await db.query(
    'SELECT * FROM "Timeslot" WHERE id = $1 AND isActive = true',
    [id],
  );

  if (result.rows.length === 0) return null;

  return mapTimeslotRowToModel(result.rows[0]);
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
      if (key === "show_time") {
        updateFields.push(`"startTime" = $${paramCount}`);
      } else if (key === "is_active") {
        updateFields.push(`"isActive" = $${paramCount}`);
      } else {
        updateFields.push(`"${key}" = $${paramCount}`);
      }
      values.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) return null;

  updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE "Timeslot" SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);

  if (result.rows.length === 0) return null;
  return mapTimeslotRowToModel(result.rows[0]);
};

export const deleteTimeSlot = async (id: string): Promise<boolean> => {
  const result = await db.query(
    'UPDATE "Timeslot" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
    [id],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const updateAvailableSeats = async (
  id: string,
  seatsChange: number,
): Promise<TimeSlot | null> => {
  const result = await db.query(
    `UPDATE "Timeslot" 
     SET available_seats = available_seats + $1, "updatedAt" = CURRENT_TIMESTAMP 
     WHERE id = $2 AND available_seats + $1 >= 0
     RETURNING *`,
    [seatsChange, id],
  );
  if (result.rows.length === 0) return null;
  return mapTimeslotRowToModel(result.rows[0]);
};

export const getAllTimeSlots = async (
  query?: TimeSlotQuery,
): Promise<TimeSlot[]> => {
  let sql = `
    SELECT
      t.*,
      COALESCE(b.booked_count, 0) AS booked_count
    FROM "Timeslot" t
    LEFT JOIN (
      SELECT timeslot_id, tmdb_movie_id, COUNT(*) AS booked_count
      FROM "MovieBooking"
      WHERE status IN ($1, $2)
      GROUP BY timeslot_id, tmdb_movie_id
    ) b ON t.id = b.timeslot_id AND b.tmdb_movie_id = t.tmdb_movie_id
    WHERE t."isActive" = true
  `;
  const params: (string | number)[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.PENDING_PAYMENT,
  ];
  let paramCount = 3;

  if (query) {
    if (query.tmdb_movie_id) {
      sql += ` AND t.tmdb_movie_id = $${paramCount}`;
      params.push(query.tmdb_movie_id);
      paramCount++;
    }

    if (query.date_from) {
      sql += ` AND t.show_date >= $${paramCount}`;
      params.push(query.date_from);
      paramCount++;
    }

    if (query.date_to) {
      sql += ` AND t.show_date <= $${paramCount}`;
      params.push(query.date_to);
      paramCount++;
    }

    if (query.screen_type) {
      sql += ` AND t.screen_type = $${paramCount}`;
      params.push(query.screen_type);
      paramCount++;
    }
  }

  sql += ` ORDER BY t.tmdb_movie_id, t.show_date, t."startTime", t.screen_type`;

  const result = await db.query(sql, params);

  return Promise.all(result.rows.map((row) => mapTimeslotRowToModel(row)));
};

// Booking Operations
export const createBooking = async (
  bookingData: CreateBookingRequest,
): Promise<Booking[]> => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 0. Validate that the slot belongs to the same TMDB movie and is active.
    // Lock row to avoid race conditions while we reserve seats.
    const slotResult = await client.query(
      `SELECT
         id,
         tmdb_movie_id,
         show_date,
         "startTime",
         total_seats,
         "isActive",
         to_char(show_date, 'YYYY-MM-DD') AS slot_show_date,
         to_char("startTime", 'HH24:MI') AS slot_show_time
       FROM "Timeslot"
       WHERE id = $1
       FOR UPDATE`,
      [bookingData.timeslot_id],
    );

    if (slotResult.rows.length === 0) {
      throw new Error("Invalid timeslot_id");
    }

    const slot = slotResult.rows[0];
    if (!slot.isActive) {
      throw new Error("Selected time slot is not active");
    }

    if (Number(slot.tmdb_movie_id) !== Number(bookingData.tmdb_movie_id)) {
      throw new Error("Time slot does not belong to this movie");
    }

    const slotDate = String(slot.slot_show_date);
    const bookingDate = String(bookingData.show_date).slice(0, 10);
    if (slotDate !== bookingDate) {
      throw new Error("Selected date does not match the time slot");
    }

    const slotTime = String(slot.slot_show_time);
    const bookingTime = String(bookingData.show_time)
      .split(":")
      .slice(0, 2)
      .join(":");
    if (slotTime !== bookingTime) {
      throw new Error("Selected time does not match the time slot");
    }

    // 1. Enforce total seat capacity by movie/slot.
    const bookedCountResult = await client.query(
      `SELECT COUNT(*)::int AS booked_count
       FROM "MovieBooking"
       WHERE timeslot_id = $1
         AND tmdb_movie_id = $2
         AND status IN ($3, $4)`,
      [
        bookingData.timeslot_id,
        bookingData.tmdb_movie_id,
        BookingStatus.CONFIRMED,
        BookingStatus.PENDING_PAYMENT,
      ],
    );

    const bookedCount = Number(bookedCountResult.rows[0]?.booked_count || 0);
    const totalSeats = Number(slot.total_seats || 0);
    const requestedSeats = bookingData.seat_ids.length;

    if (bookedCount + requestedSeats > totalSeats) {
      throw new Error("Not enough seats available for this time slot");
    }

    // 2. Check if any requested seats are already booked/pending for this movie/slot.
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

    // Split total using integer paise to avoid floating-point drift.
    const totalPaise = Math.round(bookingData.amount * 100);
    const seatCount = bookingData.seat_ids.length;
    const baseSeatPaise = Math.floor(totalPaise / seatCount);
    const remainderPaise = totalPaise - baseSeatPaise * seatCount;

    bookingData.seat_ids.forEach((seatId, index) => {
      const seatPaise = baseSeatPaise + (index < remainderPaise ? 1 : 0);
      const seatPrice = seatPaise / 100;
      placeholders.push(
        `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`,
      );
      values.push(
        bookingData.user_id || "guest",
        bookingData.tmdb_movie_id,
        bookingData.show_date,
        bookingData.show_time,
        seatId,
        seatPrice,
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

export const cancelBookingsByIds = async (
  userId: string,
  bookingIds: number[],
): Promise<number> => {
  if (!bookingIds.length) return 0;

  const result = await db.query(
    `UPDATE "MovieBooking"
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2
       AND id = ANY($3)
       AND status IN ($4, $5)`,
    [
      BookingStatus.CANCELLED,
      userId,
      bookingIds,
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.CONFIRMED,
    ],
  );

  return result.rowCount || 0;
};

export const expirePendingBookingsBeforeShow = async (): Promise<number> => {
  const result = await db.query(
    `UPDATE "MovieBooking"
     SET status = $1
     WHERE status = $2
       AND (show_date::timestamp + show_time) <= (CURRENT_TIMESTAMP + INTERVAL '1 hour')`,
    [BookingStatus.EXPIRED, BookingStatus.PENDING_PAYMENT],
  );

  return result.rowCount || 0;
};
