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
  Notification,
} from "./schema";
import { getScreenTypeCapacity, type ScreenType } from "@/data/screenLayouts";
import { getIO } from "@/lib/socket/io";
import { getPusherServer } from "@/lib/pusher/server";

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
  created_at: Date;
  updated_at: Date;
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
    `INSERT INTO "User" (email, password, name, phone, "is_email_verified", "is_active", created_at, updated_at)
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
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
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
const DEFAULT_SCREEN_TYPES: ScreenType[] = ["2D", "3D", "IMAX", "4DX"];
const DEFAULT_SCREEN_CAPACITIES = DEFAULT_SCREEN_TYPES.map((screenType) =>
  getScreenTypeCapacity(screenType),
);
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
  const screenType = String(row.screen_type ?? "2D");
  const storedTotalSeats = Number(row.total_seats ?? 0);
  const totalSeats = Math.min(
    storedTotalSeats,
    getScreenTypeCapacity(screenType),
  );
  const storedAvailableSeats = Number(row.available_seats ?? 0);
  const bookedCount = Number(row.booked_count ?? 0);
  const rawAvailableSeats =
    bookedCount > 0 ? totalSeats - bookedCount : storedAvailableSeats;
  const normalizedAvailableSeats = Math.max(
    0,
    Math.min(totalSeats, rawAvailableSeats),
  );
  const normalizedBookedSeats = Math.max(
    0,
    Math.min(totalSeats, totalSeats - normalizedAvailableSeats),
  );

  return {
    id: String(row.id),
    tmdb_movie_id: tmdbMovieId,
    show_date: await formatDbDate((row.show_date as string | Date) ?? ""),
    show_time: String(row.start_time ?? row.show_time),
    total_seats: totalSeats,
    available_seats: normalizedAvailableSeats,
    booked_seats: normalizedBookedSeats,
    price: Number(row.price ?? 12.99),
    screen_type: (screenType as TimeSlot["screen_type"]) || "2D",
    is_active: Boolean(row.isActive ?? row.is_active),
    created_at: (row.created_at ?? row.createdAt) as Date,
    updated_at: (row.updated_at ?? row.updatedAt) as Date,
  };
};

export const ensureTimeSlotInfrastructure = async (): Promise<void> => {
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timeslot_movie_date_time_screen_unique
    ON "Timeslot"(tmdb_movie_id, show_date, start_time, screen_type)
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

  // Allow seat re-booking after cancellation/refund while still preventing
  // duplicate active reservations for the same seat in a slot.
  await db.query(
    'ALTER TABLE "MovieBooking" DROP CONSTRAINT IF EXISTS unique_movie_slot_seat',
  );
  await db.query("DROP INDEX IF EXISTS idx_movie_booking_active_seat_unique");
  await db.query(
    'ALTER TABLE "MovieBooking" ALTER COLUMN seat_id DROP NOT NULL',
  );
  await db.query(`
    CREATE TABLE IF NOT EXISTS "BookingSeat" (
      id BIGSERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES "MovieBooking"(id) ON DELETE CASCADE,
      tmdb_movie_id INTEGER NOT NULL,
      timeslot_id UUID NOT NULL,
      seat_id VARCHAR(10) NOT NULL,
      status INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_booking_seat_booking_id
    ON "BookingSeat"(booking_id);
  `);
  await db.query(`
    INSERT INTO "BookingSeat"(booking_id, tmdb_movie_id, timeslot_id, seat_id, status, created_at, updated_at)
    SELECT
      mb.id,
      mb.tmdb_movie_id,
      mb.timeslot_id,
      mb.seat_id,
      CASE
        WHEN mb.status::text ~ '^[0-9]+$' THEN mb.status::int
        WHEN LOWER(mb.status::text) = 'pending_payment' THEN ${BookingStatus.PENDING_PAYMENT}
        WHEN LOWER(mb.status::text) = 'confirmed' THEN ${BookingStatus.CONFIRMED}
        WHEN LOWER(mb.status::text) = 'failed' THEN ${BookingStatus.FAILED}
        WHEN LOWER(mb.status::text) = 'expired' THEN ${BookingStatus.EXPIRED}
        WHEN LOWER(mb.status::text) = 'cancelled' THEN ${BookingStatus.CANCELLED}
        WHEN LOWER(mb.status::text) = 'refunded' THEN ${BookingStatus.REFUNDED}
        ELSE ${BookingStatus.CANCELLED}
      END,
      mb.created_at,
      mb.updated_at
    FROM "MovieBooking" mb
    LEFT JOIN "BookingSeat" bs
      ON bs.booking_id = mb.id AND bs.seat_id = mb.seat_id
    WHERE mb.seat_id IS NOT NULL
      AND bs.id IS NULL;
  `);
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seat_active_unique
    ON "BookingSeat"(tmdb_movie_id, timeslot_id, seat_id)
    WHERE status IN (${BookingStatus.PENDING_PAYMENT}, ${BookingStatus.CONFIRMED});
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
       SELECT * FROM unnest($5::text[], $6::int[]) AS s(screen_type, total_seats)
     )
     INSERT INTO "Timeslot"
       (tmdb_movie_id, show_date, start_time, end_time, screen_type, total_seats, available_seats, is_active, created_at, updated_at)
     SELECT
       $1,
       d.show_date,
       t.show_time,
       t.show_time,
       s.screen_type,
       s.total_seats,
       s.total_seats,
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
         AND existing.start_time = t.show_time
         AND existing.screen_type = s.screen_type
     )
     RETURNING id`,
    [
      tmdb_movie_id,
      startDate,
      endDate,
      DEFAULT_SHOW_TIMES,
      DEFAULT_SCREEN_TYPES,
      DEFAULT_SCREEN_CAPACITIES,
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
     (tmdb_movie_id, show_date, start_time, end_time, screen_type, total_seats, available_seats, is_active, created_at, updated_at)
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
      FROM "BookingSeat"
      WHERE status IN ($2, $3)
      GROUP BY timeslot_id, tmdb_movie_id
    ) b ON t.id = b.timeslot_id AND b.tmdb_movie_id = $1
    WHERE t.is_active = true
      AND (t.show_date::timestamp + t.start_time) > (CURRENT_TIMESTAMP + INTERVAL '1 hour')
      AND t.tmdb_movie_id = $1
      AND (t.show_date::timestamp + t.start_time) > (CURRENT_TIMESTAMP + INTERVAL '1 hour')
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

  query += ` ORDER BY t.show_date, t.start_time`;

  const result = await db.query(query, params);

  return Promise.all(
    result.rows.map((row) => mapTimeslotRowToModel(row, tmdb_movie_id)),
  );
};

export const getTimeSlotById = async (id: string): Promise<TimeSlot | null> => {
  const result = await db.query(
    'SELECT * FROM "Timeslot" WHERE id = $1 AND is_active = true',
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
        updateFields.push(`start_time = $${paramCount}`);
      } else if (key === "is_active") {
        updateFields.push(`is_active = $${paramCount}`);
      } else {
        updateFields.push(`"${key}" = $${paramCount}`);
      }
      values.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) return null;

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE "Timeslot" SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);

  if (result.rows.length === 0) return null;
  return mapTimeslotRowToModel(result.rows[0]);
};

export const deleteTimeSlot = async (id: string): Promise<boolean> => {
  const result = await db.query(
    'UPDATE "Timeslot" SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
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
     SET available_seats = available_seats + $1, updated_at = CURRENT_TIMESTAMP 
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
      FROM "BookingSeat"
      WHERE status IN ($1, $2)
      GROUP BY timeslot_id, tmdb_movie_id
    ) b ON t.id = b.timeslot_id AND b.tmdb_movie_id = t.tmdb_movie_id
    WHERE t.is_active = true
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

  sql += ` ORDER BY t.tmdb_movie_id, t.show_date, t.start_time, t.screen_type`;

  const result = await db.query(sql, params);

  return Promise.all(result.rows.map((row) => mapTimeslotRowToModel(row)));
};

// Booking Operations
export const createBooking = async (
  bookingData: CreateBookingRequest,
): Promise<Booking[]> => {
  const client = await db.pool.connect();
  let booking: Booking | null = null;
  let seatIds: string[] = [];
  try {
    await client.query("BEGIN");
    const uniqueSeatIds = [...new Set(bookingData.seat_ids)];
    if (uniqueSeatIds.length !== bookingData.seat_ids.length) {
      throw new Error("Duplicate seats selected");
    }

    // 0. Validate that the slot belongs to the same TMDB movie and is active.
    // Lock row to avoid race conditions while we reserve seats.
    const slotResult = await client.query(
      `SELECT
         id,
         tmdb_movie_id,
         show_date,
         start_time,
         screen_type,
         total_seats,
         is_active,
         to_char(show_date, 'YYYY-MM-DD') AS slot_show_date,
         to_char(start_time, 'HH24:MI') AS slot_show_time
       FROM "Timeslot"
       WHERE id = $1
       FOR UPDATE`,
      [bookingData.timeslot_id],
    );

    if (slotResult.rows.length === 0) {
      throw new Error("Invalid timeslot_id");
    }

    const slot = slotResult.rows[0];
    if (!slot.is_active) {
      throw new Error("Selected time slot is not active");
    }

    if (Number(slot.tmdb_movie_id) !== Number(bookingData.tmdb_movie_id)) {
      throw new Error("Time slot does not belong to this movie");
    }

    const slotDate = String(slot.slot_show_date);
    const bookingDate = new Date(String(bookingData.show_date))
      .toISOString()
      .slice(0, 10);

    if (slotDate !== bookingDate) {
      throw new Error(
        `Selected date does not match the time slot. Timeslot is for ${slotDate}, but you selected ${bookingDate}`,
      );
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
       FROM "BookingSeat"
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
    const totalSeats = Math.min(
      Number(slot.total_seats || 0),
      getScreenTypeCapacity(slot.screen_type as ScreenType),
    );
    const requestedSeats = uniqueSeatIds.length;

    if (bookedCount + requestedSeats > totalSeats) {
      throw new Error("Not enough seats available for this time slot");
    }

    // 2. Check if any requested seats are already booked/pending for this movie/slot.
    const checkSeatsQuery = `
      SELECT seat_id FROM "BookingSeat"
      WHERE timeslot_id = $1 AND tmdb_movie_id = $2 AND seat_id = ANY($3) 
      AND status IN ($4, $5)
    `;
    const checkSeatsResult = await client.query(checkSeatsQuery, [
      bookingData.timeslot_id,
      bookingData.tmdb_movie_id,
      uniqueSeatIds,
      BookingStatus.CONFIRMED,
      BookingStatus.PENDING_PAYMENT,
    ]);

    if (checkSeatsResult.rows.length > 0) {
      const taken = checkSeatsResult.rows.map((r) => r.seat_id).join(", ");
      throw new Error(`Seats already taken: ${taken}`);
    }

    const bookingResult = await client.query(
      `INSERT INTO "MovieBooking" (user_id, tmdb_movie_id, show_date, show_time, price, status, timeslot_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        bookingData.user_id || "guest",
        bookingData.tmdb_movie_id,
        bookingData.show_date,
        bookingData.show_time,
        bookingData.amount,
        BookingStatus.PENDING_PAYMENT,
        bookingData.timeslot_id,
      ],
    );

    const bookingRow = bookingResult.rows[0] as Booking | undefined;
    booking = bookingRow ?? null;
    if (!bookingRow) {
      throw new Error("Failed to create booking");
    }

    const seatValues: (string | number)[] = [];
    const seatPlaceholders: string[] = [];
    let seatParamCount = 1;
    uniqueSeatIds.forEach((seatId) => {
      seatPlaceholders.push(
        `($${seatParamCount}, $${seatParamCount + 1}, $${seatParamCount + 2}, $${seatParamCount + 3}, $${seatParamCount + 4})`,
      );
      seatValues.push(
        bookingRow.id,
        bookingData.tmdb_movie_id,
        bookingData.timeslot_id,
        seatId,
        BookingStatus.PENDING_PAYMENT,
      );
      seatParamCount += 5;
    });

    await client.query(
      `INSERT INTO "BookingSeat" (booking_id, tmdb_movie_id, timeslot_id, seat_id, status)
       VALUES ${seatPlaceholders.join(", ")}`,
      seatValues,
    );

    await client.query("COMMIT");
    seatIds = uniqueSeatIds;
    return [{ ...bookingRow, seat_ids: uniqueSeatIds }];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    if (booking && booking.user_id && booking.user_id !== "guest") {
      await createNotification({
        user_id: String(booking.user_id),
        type: "booking_created",
        title: "Booking Created",
        message: `Your booking is initiated and pending payment for ${seatIds.length} seat(s).`,
        data: {
          booking_id: booking.id,
          tmdb_movie_id: booking.tmdb_movie_id,
          timeslot_id: booking.timeslot_id,
          seat_ids: seatIds,
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
      await createNotification({
        user_id: String(booking.user_id),
        type: "seats_reserved",
        title: "Seats Reserved",
        message:
          "We’ve held your seats for 10 minutes. Please complete payment to confirm your booking.",
        data: {
          booking_id: booking.id,
          tmdb_movie_id: booking.tmdb_movie_id,
          timeslot_id: booking.timeslot_id,
          seat_ids: seatIds,
        },
      });
    }
  }
};

export const getBookingsByMovieAndTime = async (
  tmdb_movie_id: number,
  show_date: string,
  show_time: string,
): Promise<Array<{ seat_id: string }>> => {
  // Ensure show_time is in a consistent format
  const sanitizedTime = show_time.includes(":")
    ? show_time.split(":").slice(0, 3).join(":")
    : show_time;

  const result = await db.query(
    `SELECT bs.seat_id
     FROM "BookingSeat" bs
     INNER JOIN "MovieBooking" mb ON mb.id = bs.booking_id
     WHERE bs.tmdb_movie_id = $1 
     AND show_date = $2::date
     AND show_time = $3::time
     AND bs.status IN ($4, $5)`,
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
    `SELECT
      mb.*,
      COALESCE(
        ARRAY_AGG(bs.seat_id ORDER BY bs.seat_id)
          FILTER (WHERE bs.seat_id IS NOT NULL),
        '{}'
      ) AS seat_ids
     FROM "MovieBooking" mb
     LEFT JOIN "BookingSeat" bs ON bs.booking_id = mb.id
     WHERE mb.user_id = $1
     GROUP BY mb.id
     ORDER BY mb.created_at DESC`,
    [user_id],
  );
  return result.rows;
};

export const getTransactionsByUser = async (
  user_id: string,
): Promise<Booking[]> => {
  const result = await db.query(
    `SELECT
      mb.*,
      COALESCE(
        ARRAY_AGG(bs.seat_id ORDER BY bs.seat_id)
          FILTER (WHERE bs.seat_id IS NOT NULL),
        '{}'
      ) AS seat_ids
     FROM "MovieBooking" mb
     LEFT JOIN "BookingSeat" bs ON bs.booking_id = mb.id
     WHERE mb.user_id = $1 AND mb.status <> $2
     GROUP BY mb.id
     ORDER BY mb.created_at DESC`,
    [user_id, BookingStatus.REFUNDED],
  );
  return result.rows;
};

export const getRefundsByUser = async (user_id: string): Promise<Booking[]> => {
  const result = await db.query(
    `SELECT
      mb.*,
      COALESCE(
        ARRAY_AGG(bs.seat_id ORDER BY bs.seat_id)
          FILTER (WHERE bs.seat_id IS NOT NULL),
        '{}'
      ) AS seat_ids
     FROM "MovieBooking" mb
     LEFT JOIN "BookingSeat" bs ON bs.booking_id = mb.id
     WHERE mb.user_id = $1 AND mb.status = $2
     GROUP BY mb.id
     ORDER BY mb.created_at DESC`,
    [user_id, BookingStatus.REFUNDED],
  );
  return result.rows;
};

export const getBookingSummaryByIds = async (
  bookingIds: number[],
): Promise<{
  id: number;
  user_id: string;
  tmdb_movie_id: number;
  show_date: string;
  show_time: string;
  timeslot_id: string;
  seat_ids: string[];
  amount: number;
  status: number;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
} | null> => {
  if (!bookingIds.length) return null;
  const result = await db.query(
    `SELECT
       MIN(mb.id) AS id,
       MIN(mb.user_id::text) AS user_id,
       MIN(mb.tmdb_movie_id) AS tmdb_movie_id,
       MIN(mb.show_date) AS show_date,
       MIN(mb.show_time) AS show_time,
       MIN(mb.timeslot_id::text) AS timeslot_id,
       COALESCE(
         ARRAY_AGG(bs.seat_id ORDER BY bs.seat_id)
           FILTER (WHERE bs.seat_id IS NOT NULL),
         '{}'
       ) AS seat_ids,
       MIN(mb.price)::numeric(10,2) AS amount,
       MIN(mb.status) AS status,
       MIN(mb.stripe_session_id) AS stripe_session_id,
       MIN(mb.stripe_payment_id) AS stripe_payment_id,
       MIN(mb.created_at) AS created_at
     FROM "MovieBooking" mb
     LEFT JOIN "BookingSeat" bs ON bs.booking_id = mb.id
     WHERE mb.id = ANY($1)
     GROUP BY mb.user_id, mb.tmdb_movie_id, mb.show_date, mb.show_time, mb.timeslot_id
     ORDER BY MIN(mb.created_at) DESC
     LIMIT 1`,
    [bookingIds],
  );

  return result.rows[0] ?? null;
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
  const client = await db.pool.connect();
  let updatedBookings: Array<{
    id: number;
    user_id: string;
    tmdb_movie_id: number;
    timeslot_id: string;
    show_date: string;
    show_time: string;
  }> = [];
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE "MovieBooking" 
       SET status = $2, stripe_payment_id = COALESCE($3, stripe_payment_id)
       WHERE stripe_session_id = $1
       RETURNING id, user_id, tmdb_movie_id, timeslot_id, show_date, show_time`,
      [sessionId, status, paymentId || null],
    );
    const updatedIds = result.rows.map((row) => Number(row.id));
    updatedBookings = result.rows.map((row) => ({
      id: Number(row.id),
      user_id: String(row.user_id),
      tmdb_movie_id: Number(row.tmdb_movie_id),
      timeslot_id: String(row.timeslot_id),
      show_date: String(row.show_date),
      show_time: String(row.show_time),
    }));
    if (updatedIds.length > 0) {
      await client.query(
        `UPDATE "BookingSeat"
         SET status = $1
         WHERE booking_id = ANY($2)`,
        [status, updatedIds],
      );
    }
    await client.query("COMMIT");
    await emitBookingStatusNotifications(updatedBookings, status, paymentId);
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const cancelBookingsByIds = async (
  userId: string,
  bookingIds: number[],
): Promise<number> => {
  if (!bookingIds.length) return 0;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE "MovieBooking"
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
         AND id = ANY($3)
         AND status IN ($4, $5)
       RETURNING id`,
      [
        BookingStatus.CANCELLED,
        userId,
        bookingIds,
        BookingStatus.PENDING_PAYMENT,
        BookingStatus.CONFIRMED,
      ],
    );
    const updatedIds = result.rows.map((row) => Number(row.id));
    if (updatedIds.length > 0) {
      await client.query(
        `UPDATE "BookingSeat"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = ANY($2)`,
        [BookingStatus.CANCELLED, updatedIds],
      );
    }
    await client.query("COMMIT");
    if (updatedIds.length > 0 && userId && userId !== "guest") {
      await createNotification({
        user_id: userId,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking has been cancelled (${updatedIds.length} ticket(s)).`,
        data: { booking_ids: updatedIds },
      });
      await createNotification({
        user_id: userId,
        type: "seats_available",
        title: "Seats Available",
        message: "Cancelled seats are now available for rebooking.",
        data: { booking_ids: updatedIds },
      });
    }
    return result.rowCount || 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const expirePendingBookingsBeforeShow = async (): Promise<number> => {
  const client = await db.pool.connect();
  let updatedBookings: Array<{ id: number; user_id: string }> = [];
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE "MovieBooking"
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE status = $2
         AND (show_date::timestamp + show_time) <= (CURRENT_TIMESTAMP + INTERVAL '1 hour')
       RETURNING id, user_id`,
      [BookingStatus.EXPIRED, BookingStatus.PENDING_PAYMENT],
    );
    const updatedIds = result.rows.map((row) => Number(row.id));
    updatedBookings = result.rows.map((row) => ({
      id: Number(row.id),
      user_id: String(row.user_id),
    }));
    if (updatedIds.length > 0) {
      await client.query(
        `UPDATE "BookingSeat"
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = ANY($2)`,
        [BookingStatus.EXPIRED, updatedIds],
      );
    }
    await client.query("COMMIT");
    await emitExpiredBookingNotifications(updatedBookings);
    return result.rowCount || 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Notification helpers
export const createNotification = async (payload: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
}): Promise<Notification> => {
  const result = await db.query(
    `INSERT INTO "Notification" (user_id, type, title, message, data, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, false, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      payload.user_id,
      payload.type,
      payload.title,
      payload.message,
      JSON.stringify(payload.data || {}),
    ],
  );

  const notification = result.rows[0] as Notification;
  const io = getIO();
  if (io) {
    const unread = await getUnreadNotificationCount(payload.user_id);
    io.to(`user:${payload.user_id}`).emit("notification:new", notification);
    io.to(`user:${payload.user_id}`).emit("notification:count", {
      unread_count: unread,
    });
  }
  const pusher = getPusherServer();
  if (pusher) {
    const unread = await getUnreadNotificationCount(payload.user_id);
    await pusher.trigger(
      `notifications-${payload.user_id}`,
      "notification:new",
      {
        notification,
        unread_count: unread,
      },
    );
    await pusher.trigger(
      `notifications-${payload.user_id}`,
      "notification:count",
      { unread_count: unread },
    );
  }

  return notification;
};

export const getUnreadNotificationCount = async (
  userId: string,
): Promise<number> => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM "Notification"
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return Number(result.rows[0]?.count || 0);
};

export const getNotificationsByUser = async (
  userId: string,
  limit = 20,
  offset = 0,
): Promise<Notification[]> => {
  const result = await db.query(
    `SELECT *
     FROM "Notification"
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows as Notification[];
};

export const markNotificationRead = async (
  userId: string,
  notificationId: number,
): Promise<boolean> => {
  const result = await db.query(
    `UPDATE "Notification"
     SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const markAllNotificationsRead = async (
  userId: string,
): Promise<number> => {
  const result = await db.query(
    `UPDATE "Notification"
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return result.rowCount || 0;
};

export const createNotificationOnce = async (payload: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  booking_id?: number;
}): Promise<Notification | null> => {
  if (payload.booking_id) {
    const exists = await db.query(
      `SELECT 1
       FROM "Notification"
       WHERE user_id = $1
         AND type = $2
         AND (data->>'booking_id')::int = $3
       LIMIT 1`,
      [payload.user_id, payload.type, payload.booking_id],
    );
    if (exists.rowCount && exists.rowCount > 0) {
      return null;
    }
  }

  return createNotification({
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data,
  });
};

export const getConfirmedBookingsInWindow = async (
  startMinutes: number,
  endMinutes: number,
): Promise<
  Array<{
    id: number;
    user_id: string;
    tmdb_movie_id: number;
    show_date: string;
    show_time: string;
  }>
> => {
  const result = await db.query(
    `SELECT id, user_id, tmdb_movie_id, show_date, show_time
     FROM "MovieBooking"
     WHERE status = $1
       AND user_id IS NOT NULL
       AND user_id <> 'guest'
       AND (show_date::timestamp + show_time)
         BETWEEN (CURRENT_TIMESTAMP + ($2 * INTERVAL '1 minute'))
         AND (CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'))`,
    [BookingStatus.CONFIRMED, startMinutes, endMinutes],
  );
  return result.rows;
};

export const deleteNotification = async (
  userId: string,
  notificationId: number,
): Promise<boolean> => {
  const result = await db.query(
    `DELETE FROM "Notification"
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const deleteAllNotifications = async (
  userId: string,
): Promise<number> => {
  const result = await db.query(
    `DELETE FROM "Notification"
     WHERE user_id = $1`,
    [userId],
  );
  return result.rowCount || 0;
};

const emitBookingStatusNotifications = async (
  bookings: Array<{
    id: number;
    user_id: string;
    tmdb_movie_id: number;
    timeslot_id: string;
    show_date: string;
    show_time: string;
  }>,
  status: BookingStatus,
  paymentId?: string,
): Promise<void> => {
  const grouped = new Map<string, number[]>();
  const movieByUser = new Map<string, number>();
  bookings.forEach((booking) => {
    if (!booking.user_id || booking.user_id === "guest") return;
    const existing = grouped.get(booking.user_id) || [];
    existing.push(booking.id);
    grouped.set(booking.user_id, existing);
    if (!movieByUser.has(booking.user_id)) {
      movieByUser.set(booking.user_id, booking.tmdb_movie_id);
    }
  });

  for (const [userId, bookingIds] of grouped.entries()) {
    const tmdbMovieId = movieByUser.get(userId);
    if (status === BookingStatus.CONFIRMED) {
      const amountResult = await db.query(
        `SELECT COALESCE(SUM(price), 0) AS total_amount
         FROM "MovieBooking"
         WHERE id = ANY($1)`,
        [bookingIds],
      );
      const totalAmount = Number(amountResult.rows[0]?.total_amount || 0);
      await createNotification({
        user_id: userId,
        type: "payment_success",
        title: "Payment Successful",
        message: "Your payment was successful.",
        data: {
          booking_ids: bookingIds,
          payment_id: paymentId || null,
          tmdb_movie_id: tmdbMovieId,
          amount: totalAmount,
        },
      });
      await createNotification({
        user_id: userId,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: "Your booking is confirmed. Enjoy the show.",
        data: { booking_ids: bookingIds, tmdb_movie_id: tmdbMovieId },
      });
    }

    if (status === BookingStatus.EXPIRED) {
      await createNotification({
        user_id: userId,
        type: "booking_expired",
        title: "Booking Expired",
        message: "Your pending booking expired due to timeout.",
        data: { booking_ids: bookingIds },
      });
      await createNotification({
        user_id: userId,
        type: "seats_available",
        title: "Seats Available",
        message: "Expired seats are now available for rebooking.",
        data: { booking_ids: bookingIds },
      });
    }

    if (status === BookingStatus.FAILED) {
      await createNotification({
        user_id: userId,
        type: "payment_failed",
        title: "Payment Failed",
        message: "Your payment failed. Please try again.",
        data: { booking_ids: bookingIds },
      });
    }
  }
};

const emitExpiredBookingNotifications = async (
  bookings: Array<{ id: number; user_id: string }>,
): Promise<void> => {
  const grouped = new Map<string, number[]>();
  bookings.forEach((booking) => {
    if (!booking.user_id || booking.user_id === "guest") return;
    const existing = grouped.get(booking.user_id) || [];
    existing.push(booking.id);
    grouped.set(booking.user_id, existing);
  });

  for (const [userId, bookingIds] of grouped.entries()) {
    await createNotification({
      user_id: userId,
      type: "booking_expired",
      title: "Booking Expired",
      message: "Your pending booking expired due to timeout.",
      data: { booking_ids: bookingIds },
    });
    await createNotification({
      user_id: userId,
      type: "seats_available",
      title: "Seats Available",
      message: "Expired seats are now available for rebooking.",
      data: { booking_ids: bookingIds },
    });
  }
};
