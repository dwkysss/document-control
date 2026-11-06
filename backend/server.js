require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, query, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

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
});

// 3. CORS Middleware (Production VPS & Multi-Origin Support)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3005'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow any localhost / loopback port in dev
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for private internal Docker network
  },
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 4. Serve Static Uploads
app.use('/uploads', express.static(uploadDir));

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

// Helper for dynamic UPSERT in PostgreSQL
function buildUpsertQuery(tableName, record, conflictColumn = 'id') {
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
    const { company_code } = req.query;
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
    const updates = req.body;
    delete updates.id;
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
    const { company_code } = req.query;
    let sql = 'SELECT * FROM public.employees';
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
