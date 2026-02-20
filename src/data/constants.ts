export const KEEP_UNUSED_DATA_FOR = 180;

export enum OTPType {
  EMAIL_VERIFICATION = 1,
  PASSWORD_RESET = 2,
}

export enum BookingStatus {
  PaymentPending = 1,
  Confirmed = 2,
  Failed = 3,
  EXPIRED = 4,
  Cancelled = 5,
  Refunded = 6,
}
