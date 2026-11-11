require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool, query, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  throw new Error('AUTH_SECRET must be set to a random value of at least 32 characters.');
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;
const loginAttempts = new Map();

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key));
}

function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function readSession(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordMatches(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = passwordHash(password, salt).split(':')[1];
  return candidate.length === hash.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

function safeUser(employee) {
  const { password_hash, ...user } = employee;
  return { ...user, companyCode: user.company_code, companyName: user.company_name };
}

function requireAuth(req, res, next) {
  const session = readSession(parseCookies(req.headers.cookie).dcs_session);
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  req.user = session.user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Insufficient permissions.' });
}

function canAccessCompany(user, companyCode) {
  return user.companyCode === 'ALL' || String(companyCode || '').toUpperCase() === String(user.companyCode || '').toUpperCase();
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// 1. Setup Uploads Directory
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'public', 'uploads'));
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Multer Configuration for Document Storage (Max 50MB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const rawDocNum = req.body.docNumber || 'DOC';
    const cleanDocNum = rawDocNum.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalName = `${cleanDocNum}_${Date.now()}_${cleanFileName}`;
    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]);
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set(['.pdf', '.docx', '.xlsx', '.xls']);
    if (!allowed.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error('Unsupported file type.'));
    }
    cb(null, true);
  }
});

// 3. CORS Middleware (Production VPS & Multi-Origin Support)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3005'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS policy.'));
  },
  credentials: true
}));

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 5. Health Check
app.get(['/health', '/api/health'], async (req, res) => {
  try {
    const { rows } = await query('SELECT 1 as live');
    res.json({
      status: 'ok',
      service: 'document-control-backend',
      timestamp: new Date().toISOString(),
      database: rows.length > 0 ? 'connected' : 'disconnected'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Authentication is intentionally server-side. Password hashes never leave PostgreSQL.
app.post('/api/auth/login', async (req, res) => {
  const clientKey = req.ip;
  const current = loginAttempts.get(clientKey) || { count: 0, resetAt: Date.now() + RATE_WINDOW_MS };
  if (current.resetAt <= Date.now()) {
    loginAttempts.delete(clientKey);
  } else if (current.count >= RATE_MAX) {
    return sendError(res, 429, 'Too many login attempts. Try again later.');
  }
  const identifier = String(req.body?.identifier || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!identifier || !password) return sendError(res, 400, 'Identifier and password are required.');
  try {
    const { rows } = await query(
      'SELECT * FROM public.employees WHERE LOWER(nip) = $1 OR LOWER(email) = $1 LIMIT 1',
      [identifier]
    );
    const employee = rows[0];
    if (!employee || employee.status === 'Nonaktif' || !passwordMatches(password, employee.password_hash)) {
      loginAttempts.set(clientKey, { count: current.count + 1, resetAt: current.resetAt });
      return sendError(res, 401, 'Invalid credentials.');
    }
    loginAttempts.delete(clientKey);
    const user = safeUser(employee);
    const token = signSession({ user, expiresAt: Date.now() + SESSION_TTL_MS });
    res.cookie('dcs_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
    res.json({ user });
  } catch (error) {
    console.error('[Login Error]', error);
    sendError(res, 500, 'Unable to sign in.');
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('dcs_session', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

app.use('/api', requireAuth);
app.use('/uploads', requireAuth, express.static(uploadDir, { fallthrough: false }));

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const pathName = req.path;
  if (pathName === '/upload' || pathName.startsWith('/documents')) {
    return requireRole('admin', 'doc_control', 'approver', 'reviewer', 'staff')(req, res, next);
  }
  if (pathName.startsWith('/audit-logs')) return sendError(res, 403, 'Audit logs are created by the server only.');
  return requireRole('admin')(req, res, next);
});

// 6. File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileSizeFormatted = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(req.file.size / 1024)} KB`;

    // Relative URL so it automatically works with domain / reverse proxy
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: fileSizeFormatted,
      fileType: req.file.mimetype || 'application/pdf',
      fileUrl,
      savedAs: req.file.filename
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ error: error.message });
  }
});

const writableColumns = {
  companies: new Set(['id', 'code', 'name', 'tagline', 'color', 'badge_color', 'active']),
  departments: new Set(['id', 'code', 'name', 'head']),
  document_types: new Set(['id', 'code', 'name', 'level', 'prefix', 'description']),
  employees: new Set(['id', 'nip', 'company_code', 'company_name', 'name', 'department', 'position', 'email', 'role', 'status']),
  verifier_teams: new Set(['id', 'name', 'leader', 'members', 'description']),
  documents: new Set(['id', 'doc_number', 'company_code', 'company_name', 'title', 'type', 'type_name', 'department', 'creator', 'creator_nip', 'creator_position', 'seq_number', 'revision', 'status', 'created_date', 'created_time', 'effective_date', 'verifier_team', 'notes', 'content', 'file_name', 'file_size', 'file_url', 'file_type', 'superseded_by', 'obsolete_date', 'change_reason', 'change_description', 'rejection_reason', 'rejected_by', 'rejected_date', 'approved_by', 'approved_date', 'revision_history', 'updated_at']),
  system_settings: new Set(['id', 'company_name', 'company_code', 'system_name', 'iso_standard', 'numbering_format', 'default_verifier_team', 'watermark_controlled_text', 'watermark_obsolete_text', 'watermark_draft_text', 'enable_qr_stamp', 'enable_audit_auto_log', 'periodic_review_months', 'updated_at']),
};

function sanitizeRecord(tableName, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid request body.');
  const allowed = writableColumns[tableName];
  if (!allowed) throw new Error('Unsupported resource.');
  const unknown = Object.keys(record).filter(key => !allowed.has(key));
  if (unknown.length) throw new Error(`Unsupported fields: ${unknown.join(', ')}`);
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

// Helper for dynamic UPSERT in PostgreSQL. Keys are allowlisted before interpolation.
function buildUpsertQuery(tableName, record, conflictColumn = 'id') {
  record = sanitizeRecord(tableName, record);
  const keys = Object.keys(record);
  if (keys.length === 0) return null;

  const columns = keys.map(k => `"${k}"`).join(', ');
  const values = keys.map((_, i) => `$${i + 1}`).join(', ');
  const updates = keys
    .filter(k => k !== conflictColumn && k !== 'created_at')
    .map(k => `"${k}" = EXCLUDED."${k}"`)
    .join(', ');

  const sql = `
    INSERT INTO public."${tableName}" (${columns})
    VALUES (${values})
    ON CONFLICT ("${conflictColumn}")
    ${updates.length > 0 ? `DO UPDATE SET ${updates}` : 'DO NOTHING'}
    RETURNING *;
  `;
  const params = keys.map(k => {
    const val = record[k];
    if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      return JSON.stringify(val);
    }
    return val;
  });

  return { sql, params };
}

// 7. REST API Endpoints

// --- Companies ---
app.get('/api/companies', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.companies ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const record = req.body;
    const { sql, params } = buildUpsertQuery('companies', record, 'id');
    const { rows } = await query(sql, params);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    await query('DELETE FROM public.companies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Documents ---
app.get('/api/documents', async (req, res) => {
  try {
    const requestedCompany = req.query.company_code;
    const company_code = req.user.companyCode === 'ALL' ? requestedCompany : req.user.companyCode;
    let sql = 'SELECT * FROM public.documents';
    const params = [];
    if (company_code && company_code !== 'ALL') {
      sql += ' WHERE UPPER(company_code) = $1';
      params.push(company_code.toUpperCase());
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];

    for (const record of records) {
      if (!canAccessCompany(req.user, record.company_code)) return sendError(res, 403, 'Cross-company document access is not allowed.');
      record.company_code = req.user.companyCode === 'ALL' ? record.company_code : req.user.companyCode;
      record.creator = req.user.name;
      record.creator_nip = req.user.nip;
      record.creator_position = req.user.position;
      const { sql, params } = buildUpsertQuery('documents', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }

    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    console.error('[POST /api/documents Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = sanitizeRecord('documents', req.body);
    delete updates.id;
    const existing = await query('SELECT company_code, creator_nip, status FROM public.documents WHERE id = $1', [id]);
    if (!existing.rows[0]) return sendError(res, 404, 'Document not found.');
    if (!canAccessCompany(req.user, existing.rows[0].company_code)) return sendError(res, 403, 'Cross-company document access is not allowed.');
    if (req.user.role === 'staff' && existing.rows[0].creator_nip !== req.user.nip) return sendError(res, 403, 'Staff may only edit their own documents.');
    if (req.user.role === 'staff' && updates.status && updates.status !== 'DRAFT') return sendError(res, 403, 'Staff cannot change document approval status.');
    delete updates.company_code;
    delete updates.company_name;
    delete updates.creator;
    delete updates.creator_nip;
    delete updates.creator_position;
    updates.updated_at = new Date().toISOString();

    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ id });

    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const params = [id, ...keys.map(k => {
      const val = updates[k];
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val;
    })];

    const sql = `UPDATE public.documents SET ${setClause} WHERE id = $1 RETURNING *`;
    const { rows } = await query(sql, params);
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/documents/:id Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const existing = await query('SELECT company_code, creator_nip, status FROM public.documents WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return sendError(res, 404, 'Document not found.');
    if (!canAccessCompany(req.user, existing.rows[0].company_code)) return sendError(res, 403, 'Cross-company document access is not allowed.');
    if (req.user.role === 'staff' && existing.rows[0].creator_nip !== req.user.nip) return sendError(res, 403, 'Staff may only delete their own documents.');
    if (existing.rows[0].status !== 'DRAFT' && req.user.role !== 'admin') return sendError(res, 403, 'Only administrators may delete non-draft documents.');
    await query('DELETE FROM public.documents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Departments ---
app.get('/api/departments', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.departments ORDER BY code ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const record of records) {
      const { sql, params } = buildUpsertQuery('departments', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }
    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    await query('DELETE FROM public.departments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Document Types ---
app.get('/api/document-types', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.document_types ORDER BY level ASC, prefix ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/document-types', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const record of records) {
      const { sql, params } = buildUpsertQuery('document_types', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }
    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/document-types/:id', async (req, res) => {
  try {
    await query('DELETE FROM public.document_types WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Employees ---
app.get('/api/employees', async (req, res) => {
  try {
    const requestedCompany = req.query.company_code;
    const company_code = req.user.companyCode === 'ALL' ? requestedCompany : req.user.companyCode;
    let sql = 'SELECT id, nip, company_code, company_name, name, department, position, email, role, status, created_at FROM public.employees';
    const params = [];
    if (company_code && company_code !== 'ALL') {
      sql += ' WHERE UPPER(company_code) = $1 OR UPPER(company_code) = $2';
      params.push(company_code.toUpperCase(), 'ALL');
    }
    sql += ' ORDER BY id ASC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const record of records) {
      const { sql, params } = buildUpsertQuery('employees', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }
    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await query('DELETE FROM public.employees WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Verifier Teams ---
app.get('/api/verifier-teams', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.verifier_teams');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/verifier-teams', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const record of records) {
      const { sql, params } = buildUpsertQuery('verifier_teams', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }
    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Audit Logs ---
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { company_code } = req.query;
    let sql = 'SELECT * FROM public.audit_logs';
    const params = [];
    if (company_code && company_code !== 'ALL') {
      sql += ' WHERE UPPER(company_code) = $1';
      params.push(company_code.toUpperCase());
    }
    sql += ' ORDER BY created_at DESC LIMIT 500';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const record of records) {
      const { sql, params } = buildUpsertQuery('audit_logs', record, 'id');
      const { rows } = await query(sql, params);
      results.push(rows[0]);
    }
    res.json(Array.isArray(payload) ? results : results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- System Settings ---
app.get('/api/system-settings', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.system_settings LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/system-settings', async (req, res) => {
  try {
    const updates = req.body;
    updates.id = 'default';
    updates.updated_at = new Date().toISOString();
    const { sql, params } = buildUpsertQuery('system_settings', updates, 'id');
    const { rows } = await query(sql, params);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server & Initialize Database
async function start() {
  try {
    await initDatabase();
  } catch (e) {
    console.warn('[Startup Warning] Initial database setup deferred:', e.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`PT DJI Document Control API Server`);
    console.log(`Running on: http://0.0.0.0:${PORT}`);
    console.log(`Uploads directory: ${uploadDir}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`=======================================================`);
  });
}

start();
