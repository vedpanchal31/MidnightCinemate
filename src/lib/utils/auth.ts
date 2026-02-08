/* eslint-disable @typescript-eslint/no-explicit-any */
// Authentication utility functions

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function generateJWTToken(payload: any, secret: string, expiresIn: string): string {
  // This would use jsonwebtoken in a real implementation
  // For now, return a mock token
  return `mock_jwt_${Date.now()}_${Math.random().toString(36)}`;
}

export function verifyJWTToken(token: string, secret: string): any {
  // This would use jsonwebtoken in a real implementation
  // For now, return mock payload
  if (token.startsWith('mock_jwt_')) {
    return {
      userId: 'mock_user_id',
      email: 'mock@example.com'
    };
  }
  return null;
}
