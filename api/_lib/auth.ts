import crypto from 'crypto';
import * as cookie from 'cookie';
import { SessionPayload } from './types.js';

const COOKIE_NAME = 'trashmap_session';
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is missing.');
    }
    return 'default-dev-secret-do-not-use-in-production-trashmap-session';
  }
  return secret;
}

export function signToken(payload: SessionPayload): string {
  const secret = getSecret();
  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataStr);
  const signature = hmac.digest('base64url');
  return `${dataStr}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [dataStr, signature] = parts;
    const secret = getSecret();

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(dataStr);
    const expectedSig = hmac.digest('base64url');

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload || !payload.authenticated || typeof payload.exp !== 'number') {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword || appPassword.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_PASSWORD environment variable is missing.');
    }
    return password === 'admin123';
  }

  // Timing safe comparison
  const inputBuf = Buffer.from(password);
  const targetBuf = Buffer.from(appPassword);
  if (inputBuf.length !== targetBuf.length) {
    crypto.timingSafeEqual(inputBuf, inputBuf);
    return false;
  }
  return crypto.timingSafeEqual(inputBuf, targetBuf);
}

export function createSessionCookie(): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const token = signToken({ authenticated: true, exp });
  const isProd = process.env.NODE_ENV === 'production';

  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export function createLogoutCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
}

export function getSessionFromCookie(cookieHeader: string | undefined): SessionPayload | null {
  if (!cookieHeader) return null;
  const cookies = cookie.parse(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export function verifyRequestSession(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const rawCookie = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
  const session = getSessionFromCookie(rawCookie);
  return session !== null && session.authenticated === true;
}

export function verifyOrigin(req: {
  headers: Record<string, string | string[] | undefined>;
}): boolean {
  const originHeader = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const hostHeader = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;

  if (!originHeader) {
    return true;
  }

  try {
    const originUrl = new URL(originHeader);
    if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
      return true;
    }

    if (hostHeader && originUrl.host === hostHeader) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
