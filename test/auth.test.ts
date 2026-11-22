import { describe, expect, it } from 'vitest';
import {
  createLogoutCookie,
  createSessionCookie,
  getSessionFromCookie,
  signToken,
  verifyOrigin,
  verifyPassword,
  verifyToken,
} from '../lib/auth';

describe('Authentication & Session Unit Tests', () => {
  it('signs and verifies a valid session token', () => {
    const payload = {
      authenticated: true,
      exp: Date.now() + 60 * 1000,
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.authenticated).toBe(true);
  });

  it('rejects a tampered session token', () => {
    const payload = {
      authenticated: true,
      exp: Date.now() + 60 * 1000,
    };

    const token = signToken(payload);
    const [dataStr, sig] = token.split('.');

    // Tamper with payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ authenticated: true, exp: Date.now() + 999999999 })
    ).toString('base64url');

    const tamperedToken = `${tamperedPayload}.${sig}`;
    expect(verifyToken(tamperedToken)).toBeNull();

    // Tamper with signature
    const badSigToken = `${dataStr}.invalidSignature`;
    expect(verifyToken(badSigToken)).toBeNull();
  });

  it('rejects an expired session token', () => {
    const expiredPayload = {
      authenticated: true,
      exp: Date.now() - 5000, // Expired 5 seconds ago
    };

    const token = signToken(expiredPayload);
    expect(verifyToken(token)).toBeNull();
  });

  it('correctly creates and parses session cookies', () => {
    const cookieHeader = createSessionCookie();
    expect(cookieHeader).toContain('trashmap_session=');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Lax');

    const session = getSessionFromCookie(cookieHeader);
    expect(session).not.toBeNull();
    expect(session?.authenticated).toBe(true);
  });

  it('creates an expired logout cookie', () => {
    const logoutCookie = createLogoutCookie();
    expect(logoutCookie).toContain('trashmap_session=;');
    expect(logoutCookie).toContain('Max-Age=0');
  });

  it('verifies password against environment variable or fallback', () => {
    process.env.APP_PASSWORD = 'rahasia-petugas-2026';

    expect(verifyPassword('rahasia-petugas-2026')).toBe(true);
    expect(verifyPassword('salah')).toBe(false);
    expect(verifyPassword('')).toBe(false);
  });

  it('validates request origin correctly', () => {
    // Missing origin (e.g. server-to-server or curl)
    expect(verifyOrigin({ headers: {} })).toBe(true);

    // Localhost
    expect(
      verifyOrigin({
        headers: {
          origin: 'http://localhost:5173',
          host: 'localhost:5173',
        },
      })
    ).toBe(true);

    // Matching production host
    expect(
      verifyOrigin({
        headers: {
          origin: 'https://trashmap.vercel.app',
          host: 'trashmap.vercel.app',
        },
      })
    ).toBe(true);

    // Malicious external origin
    expect(
      verifyOrigin({
        headers: {
          origin: 'https://evil-hacker.com',
          host: 'trashmap.vercel.app',
        },
      })
    ).toBe(false);
  });
});
