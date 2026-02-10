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

import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export function generateJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '1h'): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development';
    return jwt.verify(token, secret) as { userId: string };
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}
