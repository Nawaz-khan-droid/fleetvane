import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fleetvane-secret-key-change-in-production');

export interface JWTPayload {
  userId: string;
  id?: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'DRIVER' | 'MANAGER' | 'ADMIN';
  createdAt?: string;
  companyName?: string;
}

/** Sign a JWT with the user payload */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/** Verify and decode a JWT, returning the payload or null */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Hash a password using bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Compare a plain password against a hash */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}