import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
}

let quotationCounter = 1;

export function generateQuotationNumber(year: number): string {
  const padded = String(quotationCounter++).padStart(4, '0');
  return `ABO-${year}-${padded}`;
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const num = Math.floor(Math.random() * 9000) + 1000;
  const c1 = chars[Math.floor(Math.random() * chars.length)];
  const c2 = chars[Math.floor(Math.random() * chars.length)];
  return `ABO-${num}-${c1}${c2}`;
}
