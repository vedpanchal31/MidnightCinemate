import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserWithoutPassword } from '@/lib/database/schema';

interface AuthState {
  user: UserWithoutPassword | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  fcmToken: string | null;
  email: string | null;
  mobile: string | null;
  countryCode: string | null;
  verifyUserEmail: boolean;
  verifyUserMobile: boolean;
  forgotPasswordUserMobile: boolean;
  resetPasswordToken: string | null;
  resendOTPTimer: number;
  isGuestUser: boolean;
  redirectPath: { path: string; venueId?: string } | null;
  currencyRates?: Record<string, number>;
  userType: number;
  preferences: {
    language: string;
    currency: string;
    isSidebarCollapsed: boolean;
    localcurrency: boolean;
  };
  userUpdateProfileImage: File | null;
  roleType: number | undefined;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  fcmToken: null,
  email: null,
  mobile: null,
  countryCode: null,
  verifyUserEmail: false,
  verifyUserMobile: false,
  forgotPasswordUserMobile: false,
  resendOTPTimer: 120, // 2 minutes in seconds
  resetPasswordToken: null,
  isGuestUser: true,
  redirectPath: null,
  currencyRates: {},
  userType: 1, // Default user type
  preferences: {
    language: 'EN',
    currency: 'SAR',
    isSidebarCollapsed: false,
    localcurrency: false,
  },
  userUpdateProfileImage: null,
  roleType: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: UserWithoutPassword; token: string; refreshToken: string }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      state.isGuestUser = false;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isGuestUser = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setEmail: (state, action: PayloadAction<string | null>) => {
      state.email = action.payload;
    },
    setMobile: (state, action: PayloadAction<{ mobile: string | null; countryCode: string | null }>) => {
      state.mobile = action.payload.mobile;
      state.countryCode = action.payload.countryCode;
    },
    setVerifyUserEmail: (state, action: PayloadAction<boolean>) => {
      state.verifyUserEmail = action.payload;
    },
    setVerifyUserMobile: (state, action: PayloadAction<boolean>) => {
      state.verifyUserMobile = action.payload;
    },
    setForgotPasswordUserMobile: (state, action: PayloadAction<boolean>) => {
      state.forgotPasswordUserMobile = action.payload;
    },
    setResendOTPTimer: (state, action: PayloadAction<number>) => {
      state.resendOTPTimer = action.payload;
    },
    startResendCooldown: (state) => {
      state.resendOTPTimer = 120; // 2 minutes in seconds
    },
    decrementResendCooldown: (state) => {
      if (state.resendOTPTimer > 0) {
        state.resendOTPTimer -= 1;
      }
    },
    setResetToken: (state, action: PayloadAction<string | null>) => {
      state.resetPasswordToken = action.payload;
    },
    clearOTPState: (state) => {
      state.email = null;
      state.mobile = null;
      state.countryCode = null;
      state.verifyUserEmail = false;
      state.verifyUserMobile = false;
      state.forgotPasswordUserMobile = false;
      state.resendOTPTimer = 120;
      state.resetPasswordToken = null;
    },
    setUserType: (state, action: PayloadAction<number>) => {
      state.userType = action.payload;
    },
    setFcmToken: (state, action: PayloadAction<string | null>) => {
      state.fcmToken = action.payload;
    },
    setGuestUserStatus: (state, action: PayloadAction<boolean>) => {
      state.isGuestUser = action.payload;
    },
    setRedirectPath: (state, action: PayloadAction<{ path: string; venueId?: string } | null>) => {
      state.redirectPath = action.payload;
    },
    clearRedirectPath: (state) => {
      state.redirectPath = null;
    },
    setCurrencyRates: (state, action: PayloadAction<Record<string, number>>) => {
      state.currencyRates = action.payload;
    },
    changeLanguageSelection: (state, action: PayloadAction<string>) => {
      state.preferences.language = action.payload;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.preferences.currency = action.payload;
    },
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.preferences.isSidebarCollapsed = action.payload;
    },
    setLocalCurrency: (state, action: PayloadAction<boolean>) => {
      state.preferences.localcurrency = action.payload;
    },
    setVerificationStatus: (state, action: PayloadAction<boolean>) => {
      state.verifyUserEmail = action.payload;
      if (state.user) {
        state.user = {
          ...state.user,
          is_email_verified: action.payload,
        };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  setEmail,
  setMobile,
  setVerifyUserEmail,
  setVerifyUserMobile,
  setForgotPasswordUserMobile,
  setResendOTPTimer,
  startResendCooldown,
  decrementResendCooldown,
  setResetToken,
  clearOTPState,
  setUserType,
  setFcmToken,
  setGuestUserStatus,
  setRedirectPath,
  clearRedirectPath,
  setCurrencyRates,
  changeLanguageSelection,
  setCurrency,
  setIsSidebarCollapsed,
  setLocalCurrency,
  setVerificationStatus,
} = authSlice.actions;

export default authSlice.reducer;
export type { AuthState };
