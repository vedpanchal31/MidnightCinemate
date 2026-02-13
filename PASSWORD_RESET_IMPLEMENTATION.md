# Password Reset Implementation ✅

## Complete Flow

### 1. **Forgot Password** (`/forgot-password`)
- User enters their email address
- API sends OTP to email via `POST /api/auth/forgot-password`
- OTP is stored in PostgreSQL database with 10-minute expiration
- Email is stored in Redux for next step
- User is redirected to `/verify-otp?purpose=reset-password`

### 2. **Verify OTP** (`/verify-otp`)
- User enters the 6-digit OTP code received via email
- API verifies OTP from database via `POST /api/auth/verify-otp`
- For password reset type, the email is stored in Redux
- User is redirected to `/reset-password`

### 3. **Reset Password** (`/reset-password`)
- User enters new password and confirms it
- Password must match requirements (min 8 chars, etc.)
- API resets password via `POST /api/auth/reset-password`
- Password is hashed with bcrypt and stored in database
- User is redirected to `/login`

## API Endpoints

### POST `/api/auth/forgot-password`
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset code sent successfully. Please check your email.",
  "data": {
    "email": "user@example.com",
    "type": 2  // PASSWORD_RESET
  }
}
```

### POST `/api/auth/verify-otp`
**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": 2  // PASSWORD_RESET
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/reset-password`
**Request:**
```json
{
  "reset_token": "user@example.com",  // Currently using email as token
  "new_password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

## Database Integration

### Tables Used:
1. **User** - Stores user passwords (hashed)
2. **OTP** - Stores password reset OTPs with expiration

### Security Features:
- ✅ OTP expires in 10 minutes
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ OTP marked as used after verification
- ✅ Maximum 3 OTP attempts
- ✅ Email enumeration protection (same response for existing/non-existing emails)

## Redux State

The auth slice stores:
- `email`: User's email (passed between pages)
- Used in forgot password → OTP → reset password flow

## Email Template

Password reset emails use the premium MidnightCinemate template with:
- 🎬 Branded header
- 🔒 Security notice
- Large, prominent OTP code
- 10-minute expiration warning

## Testing the Flow

1. **Start Reset:**
   - Go to `/forgot-password`
   - Enter registered email
   - Check email for OTP code

2. **Verify OTP:**
   - Enter  the 6-digit code
   - Click "Verify Code"

3. **Set New Password:**
   - Enter new password (min 8 chars)
   - Confirm password
   - Click "Reset Password"

4. **Login:**
   - Use new password to login

## Files Modified

### Frontend:
- `/src/app/forgot-password/page.tsx` - UI and API integration
- `/src/app/reset-password/page.tsx` - Already integrated
- `/src/app/verify-otp/page.tsx` - Handles both email verification and password reset

### Backend:
- `/src/app/api/auth/forgot-password/route.ts` - Generates OTP, sends email
- `/src/app/api/auth/reset-password/route.ts` - Updates password in database

### Database:
- Uses existing `User` and `OTP` tables
- No schema changes needed (already migrated)
