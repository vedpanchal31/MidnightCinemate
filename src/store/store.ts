// Clean, auth-only store
import { configureStore, Reducer, UnknownAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import auth and movies API
import authReducer, { AuthState } from "./authSlice";
import { authApi } from "./authApi";
import { moviesApi } from "./moviesApi";

// Auth persist configuration
const authPersistConfig = {
  key: "auth",
  version: 1,
  storage,
  whitelist: [
    "user", "token", "refreshToken", "userType", "preferences", "roleType",
    "email", "verifyUserEmail", "verifyUserMobile",
    "forgotPasswordUserMobile", "resendOTPTimer",
    "isGuestUser", "fcmToken", "redirectPath",
    "mobile", "countryCode", "resetPasswordToken"
  ],
};

// Configure auth-only store
export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer) as Reducer<unknown, UnknownAction, unknown>,
    [authApi.reducerPath]: authApi.reducer,
    [moviesApi.reducerPath]: moviesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    })
      .concat(authApi.middleware)
      .concat(moviesApi.middleware),
});

// Persistor for redux-persist
export const persistor = persistStore(store);

// Infer types from store itself
export type RootState = ReturnType<typeof store.getState> & {
  auth: AuthState; // Use proper AuthState type
};
export type AppDispatch = typeof store.dispatch;

export default store;