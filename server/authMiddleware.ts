import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const SESSION_SECRET = process.env.APP_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer | string) => {
      body += chunk.toString();
      // Protect against oversized JSON payloads
      if (body.length > 10000) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

export function createSessionToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payloadObj = { role: 'admin', expiresAt, issuedAt: Date.now() };
  const payloadBase64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('base64url');
  return {
    token: `${payloadBase64}.${signature}`,
    expiresAt,
  };
}

export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('base64url');

  if (!safeCompare(signature, expectedSig)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function authMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0];

  // Route 1: POST /api/auth/pin
  if (url === '/api/auth/pin' && req.method === 'POST') {
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = rateLimitMap.get(clientIp);
    if (!entry) {
      entry = { attempts: 0, lockedUntil: null };
      rateLimitMap.set(clientIp, entry);
    }

    // Check if locked out
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
      return sendJson(res, 429, {
        success: false,
        error: `Too many failed attempts. Keypad locked for ${retryAfter}s.`,
        retryAfter,
      });
    }

    parseJsonBody(req)
      .then(body => {
        const submittedPin = typeof body?.pin === 'string' ? body.pin.trim() : '';
        // APP_MASTER_PIN is server-only environment variable, default fallback '2026'
        const serverPin = (process.env.APP_MASTER_PIN || '2026').trim();

        if (safeCompare(submittedPin, serverPin)) {
          // Success: reset attempts
          entry.attempts = 0;
          entry.lockedUntil = null;

          const session = createSessionToken();
          // Set cookie for browser session
          res.setHeader(
            'Set-Cookie',
            `jmkt_auth=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
          );

          return sendJson(res, 200, {
            success: true,
            token: session.token,
            expiresAt: session.expiresAt,
          });
        } else {
          // Failure: increment attempts
          entry.attempts += 1;
          if (entry.attempts >= MAX_ATTEMPTS) {
            entry.lockedUntil = now + LOCKOUT_DURATION_MS;
            return sendJson(res, 429, {
              success: false,
              error: 'Too many failed attempts. Keypad locked for 30 seconds.',
              retryAfter: 30,
            });
          }

          const remaining = MAX_ATTEMPTS - entry.attempts;
          return sendJson(res, 401, {
            success: false,
            error: `Incorrect Master PIN (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left)`,
            attemptsRemaining: remaining,
          });
        }
      })
      .catch(() => {
        sendJson(res, 400, { success: false, error: 'Invalid request payload' });
      });
    return;
  }

  // Route 2: POST /api/auth/verify
  if (url === '/api/auth/verify' && (req.method === 'POST' || req.method === 'GET')) {
    parseJsonBody(req)
      .then(body => {
        let token = body?.token;
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
          token = req.headers.authorization.slice(7);
        }
        if (!token && req.headers.cookie) {
          const match = req.headers.cookie.match(/jmkt_auth=([^;]+)/);
          if (match) token = match[1];
        }

        const valid = verifySessionToken(token);
        return sendJson(res, 200, { valid });
      })
      .catch(() => {
        sendJson(res, 200, { valid: false });
      });
    return;
  }

  next();
}
