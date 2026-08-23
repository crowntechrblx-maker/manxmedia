/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin authentication: username/password check + signed, httpOnly session
 * cookie (JWT). This replaces the old scheme where the frontend just set a
 * flag in sessionStorage after login — that never actually protected any
 * API endpoint. Now every write endpoint verifies the cookie server-side.
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const COOKIE_NAME = 'manx_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured in environment variables.');
  }
  return secret;
}

/** Timing-safe comparison so login isn't vulnerable to a timing attack. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkCredentials(username: string, password: string): { ok: boolean; error?: string } {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return { ok: false, error: 'CMS login is disabled. Define ADMIN_USERNAME and ADMIN_PASSWORD in your environment variables.' };
  }

  const usernameOk = safeEqual(username, expectedUsername);
  const passwordOk = safeEqual(password, expectedPassword);

  if (usernameOk && passwordOk) {
    return { ok: true };
  }
  return { ok: false, error: 'Invalid username or password credentials.' };
}

export function createSessionCookie(username: string): string {
  const token = jwt.sign({ sub: username }, getSessionSecret(), { expiresIn: SESSION_DURATION_SECONDS });
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function createLogoutCookie(): string {
  return serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Reads the raw Cookie header (works the same on Express req.headers.cookie and Vercel's req.headers.cookie). */
export function isAdminRequest(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  try {
    const cookies = parse(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return false;
    jwt.verify(token, getSessionSecret());
    return true;
  } catch {
    return false;
  }
}
