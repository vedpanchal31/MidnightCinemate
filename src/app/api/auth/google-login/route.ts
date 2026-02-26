import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ErrorResponse, LoginResponse } from "@/lib/database/schema";
import {
  createUser,
  findUserByEmail,
  updateUser,
} from "@/lib/database/db-service";
import { generateJWTToken, generateRefreshToken } from "@/lib/utils/auth";

interface GoogleLoginRequest {
  idToken?: string;
  accessToken?: string;
}

interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  issued_to?: string;
  email?: string;
  email_verified?: "true" | "false" | boolean;
  name?: string;
}

interface GoogleUserInfo {
  name?: string;
}

export async function GET() {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      message: "Method not allowed. Use POST with accessToken or idToken.",
    },
    { status: 405 },
  );
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || error.name || "Unknown error";
  }
  if (typeof error === "string") {
    return error || "Unknown error";
  }
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      code?: string;
      detail?: string;
      constraint?: string;
    };
    return (
      maybeError.message ||
      maybeError.detail ||
      maybeError.code ||
      "Unknown error"
    );
  }
  return "Unknown error";
};

export async function POST(request: Request) {
  let step = "request:start";
  try {
    let body: GoogleLoginRequest;
    step = "request:parse-body";
    try {
      body = (await request.json()) as GoogleLoginRequest;
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 },
      );
    }

    if (!body.idToken && !body.accessToken) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Google token is required",
        },
        { status: 400 },
      );
    }

    const configuredClientId =
      process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!configuredClientId) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message:
            "Google login is not configured. Set GOOGLE_CLIENT_ID and restart server.",
        },
        { status: 500 },
      );
    }

    const tokenInfoUrl = body.idToken
      ? `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.idToken)}`
      : `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(body.accessToken || "")}`;

    let tokenInfoResponse: Response;
    step = "google:tokeninfo-fetch";
    try {
      tokenInfoResponse = await fetch(tokenInfoUrl, { cache: "no-store" });
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Unable to reach Google token service",
        },
        { status: 502 },
      );
    }

    if (!tokenInfoResponse.ok) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Invalid Google token",
        },
        { status: 401 },
      );
    }

    step = "google:tokeninfo-parse";
    const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo;

    const audience = tokenInfo.aud || tokenInfo.azp || tokenInfo.issued_to;

    if (audience && audience !== configuredClientId) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Google token audience mismatch",
        },
        { status: 401 },
      );
    }

    const isEmailVerified =
      tokenInfo.email_verified === "true" || tokenInfo.email_verified === true;

    if (!tokenInfo.email || !isEmailVerified) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: "Google account email is not verified",
        },
        { status: 401 },
      );
    }

    const email = tokenInfo.email;
    let displayName = tokenInfo.name || email.split("@")[0] || "User";

    if (body.accessToken && !tokenInfo.name) {
      step = "google:userinfo-fetch";
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${body.accessToken}`,
          },
        },
      );

      if (userInfoResponse.ok) {
        const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
        if (userInfo.name) {
          displayName = userInfo.name;
        }
      }
    }

    step = "db:find-user";
    let user = await findUserByEmail(email);
    const now = new Date();

    if (!user) {
      const randomPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      step = "crypto:hash-password";
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      try {
        step = "db:create-user";
        user = await createUser({
          email,
          password: hashedPassword,
          name: displayName,
        });
      } catch (dbError) {
        // Handle race: if another request created the same user, continue with existing user.
        const maybePgError = dbError as { code?: string };
        if (maybePgError.code === "23505") {
          const existingUser = await findUserByEmail(email);
          if (!existingUser) {
            throw dbError;
          }
          user = existingUser;
        } else {
          throw dbError;
        }
      }
      step = "db:update-user-after-create";
      await updateUser(email, {
        is_email_verified: true,
        last_login: now,
      });
      user = {
        ...user,
        is_email_verified: true,
        last_login: now,
      };
    } else {
      if (!user.is_active) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            message: "Account has been deactivated",
          },
          { status: 401 },
        );
      }

      step = "db:update-existing-user";
      await updateUser(email, {
        is_email_verified: true,
        last_login: now,
      });

      user = {
        ...user,
        is_email_verified: true,
        last_login: now,
      };
    }

    step = "auth:generate-jwt";
    const token = generateJWTToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      "1h",
    );

    step = "auth:generate-refresh-token";
    const refreshToken = generateRefreshToken(user.id);

    const response: LoginResponse = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_email_verified: true,
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_active: user.is_active,
          last_login: now,
        },
        token,
        refresh_token: refreshToken,
        is_email_verified: true,
      },
    };

    step = "response:success";
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = normalizeError(error);
    const isDev = process.env.NODE_ENV !== "production";
    const maybeError = error as { code?: string; detail?: string };
    console.error(`Google login error at ${step}:`, error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: "Internal server error",
        error: isDev
          ? `[${step}] ${errorMessage}${maybeError?.code ? ` (code: ${maybeError.code})` : ""}${maybeError?.detail ? ` - ${maybeError.detail}` : ""}`
          : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}
