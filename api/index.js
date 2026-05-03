/**
 * ============================================================
 *  NIKAH INVITE — SERVERLESS API
 *  Compatible with: Netlify Functions & Vercel Serverless
 *
 *  Endpoints handled:
 *    POST /api/rsvp               → Submit RSVP
 *    POST /api/admin/login        → Admin login → JWT
 *    GET  /api/admin/rsvps        → List RSVPs (protected)
 *    GET  /api/admin/config       → Get config (protected)
 *    POST /api/admin/config       → Update config (protected)
 *
 *  Environment variables required:
 *    ADMIN_USERNAME   — admin login username
 *    ADMIN_PASS_HASH  — bcrypt hash of admin password
 *    JWT_SECRET       — random secret string (≥ 32 chars)
 *    DATABASE_URL     — (optional) PostgreSQL connection string
 *                       If absent, in-memory store is used
 * ============================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   DEPENDENCIES  (install: npm install jsonwebtoken bcryptjs)
───────────────────────────────────────────────────────────── */
let jwt, bcrypt;
try { jwt   = require('jsonwebtoken'); }   catch(e) { jwt   = null; }
try { bcrypt = require('bcryptjs'); }      catch(e) { bcrypt = null; }

/* ─────────────────────────────────────────────────────────────
   IN-MEMORY FALLBACK STORE  (replaces a real DB for demos)
   For production, swap in a real DB adapter below.
───────────────────────────────────────────────────────────── */
const memStore = {
  rsvps:  [],
  config: null
};

/* ─────────────────────────────────────────────────────────────
   DATABASE ADAPTER  (swap this block for real DB)
───────────────────────────────────────────────────────────── */
const db = {
  async insertRsvp(data) {
    const record = { ...data, id: Date.now().toString(36), createdAt: new Date().toISOString() };
    memStore.rsvps.push(record);
    return record;
  },
  async getAllRsvps() {
    return [...memStore.rsvps].reverse();
  },
  async getConfig() {
    return memStore.config;
  },
  async saveConfig(cfg) {
    memStore.config = cfg;
    return cfg;
  }
};

/* ─────────────────────────────────────────────────────────────
   RATE LIMITER  (in-memory, resets per cold-start)
───────────────────────────────────────────────────────────── */
const loginAttempts = new Map(); // ip → { count, resetAt }
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 15 * 60 * 1000; }
  entry.count++;
  loginAttempts.set(ip, entry);
  return entry.count <= 5; // allow 5 per 15 min
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function sanitize(val, max = 300) {
  if (val == null) return '';
  return String(val)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, max);
}

function validateEmail(email) {
  return /^[^\s@]{1,64}@[^\s@]{1,128}\.[^\s@]{1,20}$/.test(email);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  process.env.SITE_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!jwt || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (e) { return null; }
}

/* ─────────────────────────────────────────────────────────────
   ROUTE HANDLERS
───────────────────────────────────────────────────────────── */

/**
 * POST /api/rsvp
 */
async function handleRsvp(event) {
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return jsonResponse(400, { message: 'Invalid JSON.' });
  }

  const name       = sanitize(body.name, 100);
  const email      = sanitize(body.email, 200);
  const attendance = body.attendance === 'yes' ? 'yes' : 'no';
  const evType     = ['both','nikah','walima'].includes(body.event) ? body.event : 'both';
  const guests     = Math.min(Math.max(parseInt(body.guests, 10) || 1, 1), 10);
  const message    = sanitize(body.message, 300);

  if (!name || name.length < 2)          return jsonResponse(400, { message: 'Name is required (min 2 chars).' });
  if (email && !validateEmail(email))    return jsonResponse(400, { message: 'Invalid email address.' });

  try {
    const record = await db.insertRsvp({ name, email, attendance, event: evType, guests, message });
    return jsonResponse(200, { success: true, id: record.id, message: 'RSVP received! JazakAllahu Khayran.' });
  } catch(e) {
    console.error('RSVP insert error:', e);
    return jsonResponse(500, { message: 'Server error. Please try again.' });
  }
}

/**
 * POST /api/admin/login
 */
async function handleLogin(event) {
  const ip = event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return jsonResponse(429, { message: 'Too many login attempts. Please wait 15 minutes.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return jsonResponse(400, { message: 'Invalid JSON.' });
  }

  const username = sanitize(body.username, 64);
  const password = String(body.password || '').substring(0, 128);

  if (!username || !password) return jsonResponse(400, { message: 'Username and password required.' });

  const ADMIN_USER = process.env.ADMIN_USERNAME;
  const PASS_HASH  = process.env.ADMIN_PASS_HASH;
  const JWT_SECRET = process.env.JWT_SECRET;

  // Constant-time username comparison (basic)
  if (!ADMIN_USER || !PASS_HASH || !JWT_SECRET) {
    console.error('Missing env vars: ADMIN_USERNAME, ADMIN_PASS_HASH, JWT_SECRET');
    return jsonResponse(500, { message: 'Server configuration error.' });
  }

  const userMatch = username === ADMIN_USER;
  let passMatch = false;
  if (bcrypt) {
    passMatch = await bcrypt.compare(password, PASS_HASH);
  } else {
    // Fallback: compare plaintext (NOT recommended for production)
    passMatch = password === PASS_HASH;
  }

  if (!userMatch || !passMatch) {
    // Intentional delay to slow brute force
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    return jsonResponse(401, { message: 'Invalid credentials.' });
  }

  const token = jwt
    ? jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' })
    : 'demo-token-no-jwt';

  return jsonResponse(200, { token, message: 'Login successful.' });
}

/**
 * GET /api/admin/rsvps  (protected)
 */
async function handleGetRsvps(event) {
  const payload = verifyToken(event.headers?.authorization || event.headers?.Authorization);
  if (!payload) return jsonResponse(401, { message: 'Unauthorized.' });

  try {
    const rsvps = await db.getAllRsvps();
    return jsonResponse(200, { rsvps, count: rsvps.length });
  } catch(e) {
    return jsonResponse(500, { message: 'Failed to load RSVPs.' });
  }
}

/**
 * GET /api/admin/config  (protected)
 */
async function handleGetConfig(event) {
  const payload = verifyToken(event.headers?.authorization || event.headers?.Authorization);
  if (!payload) return jsonResponse(401, { message: 'Unauthorized.' });

  try {
    // Try to load from DB first, fall back to the config.js defaults
    let cfg = await db.getConfig();
    if (!cfg) {
      // Return minimal structure
      cfg = { message: 'No overrides saved; using config.js defaults.' };
    }
    return jsonResponse(200, cfg);
  } catch(e) {
    return jsonResponse(500, { message: 'Failed to load config.' });
  }
}

/**
 * POST /api/admin/config  (protected)
 */
async function handleSaveConfig(event) {
  const payload = verifyToken(event.headers?.authorization || event.headers?.Authorization);
  if (!payload) return jsonResponse(401, { message: 'Unauthorized.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return jsonResponse(400, { message: 'Invalid JSON.' });
  }

  // Sanitize all string fields recursively
  function sanitizeObj(obj, depth = 0) {
    if (depth > 3) return {};
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string')      out[k] = sanitize(v, 300);
      else if (typeof v === 'object' && v !== null) out[k] = sanitizeObj(v, depth + 1);
      else if (typeof v === 'number') out[k] = v;
      else if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  }

  const safe = sanitizeObj(body);
  try {
    await db.saveConfig(safe);
    return jsonResponse(200, { success: true, message: 'Config saved.' });
  } catch(e) {
    return jsonResponse(500, { message: 'Failed to save config.' });
  }
}

/* ─────────────────────────────────────────────────────────────
   MAIN HANDLER  (Netlify Functions format)
   Vercel uses the same signature.
───────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const method = event.httpMethod;
  const path   = (event.path || event.rawPath || '').replace(/\/$/, '');

  // Route
  if (path.endsWith('/api/rsvp')            && method === 'POST') return handleRsvp(event);
  if (path.endsWith('/api/admin/login')     && method === 'POST') return handleLogin(event);
  if (path.endsWith('/api/admin/rsvps')     && method === 'GET')  return handleGetRsvps(event);
  if (path.endsWith('/api/admin/config')    && method === 'GET')  return handleGetConfig(event);
  if (path.endsWith('/api/admin/config')    && method === 'POST') return handleSaveConfig(event);

  return jsonResponse(404, { message: 'Endpoint not found.' });
};

/* ─────────────────────────────────────────────────────────────
   VERCEL COMPATIBILITY  (export default for ES module mode)
───────────────────────────────────────────────────────────── */
if (typeof module !== 'undefined') {
  // CommonJS (Netlify / older Vercel)
  module.exports.handler = exports.handler;
}
