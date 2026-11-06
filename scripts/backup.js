import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const envFiles = ['.env.local', '.env', 'backend/.env'];
  const env = {};
  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            env[key.trim()] = vals.join('=').trim();
          }
        }
      }
    }
  }
  return env;
}

const env = loadEnv();
const apiBase = env.BACKEND_URL || (env.BACKEND_PORT ? `http://127.0.0.1:${env.BACKEND_PORT}` : 'http://localhost:5001');

const TABLES = [
  'companies',
  'departments',
  'document_types',
  'employees',
  'verifier_teams',
  'documents',
  'audit_logs',
  'system_settings'
];

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return val.toString();
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectRoot, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Memulai backup data dari backend: ${apiBase}...`);
  const backupData = {
    exportedAt: new Date().toISOString(),
    tables: {}
  };

  const sqlStatements = [
    `-- ==============================================================================`,
    `-- ISO 9001 DOCUMENT CONTROL SYSTEM DATABASE BACKUP`,
    `-- Generated At: ${new Date().toISOString()}`,
    `-- Source: ${apiBase}`,
    `-- ==============================================================================\n`
  ];

  let totalRows = 0;

  for (const table of TABLES) {
    const endpoint = table.replace(/_/g, '-');
    try {
      const res = await fetch(`${apiBase}/api/${endpoint}`);
      if (!res.ok) {
        console.warn(`⚠️ Gagal mengambil tabel ${table}: HTTP ${res.status}`);
        backupData.tables[table] = [];
        continue;
      }
      const rows = await res.json();
      const records = Array.isArray(rows) ? rows : (rows ? [rows] : []);
      backupData.tables[table] = records;
      totalRows += records.length;
      console.log(`  ✓ ${table}: ${records.length} baris`);

      if (records.length > 0) {
        sqlStatements.push(`-- Table: ${table} (${records.length} rows)`);
        for (const row of records) {
          const keys = Object.keys(row);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const vals = keys.map(k => escapeSqlValue(row[k])).join(', ');
          const conflictCol = keys.includes('id') ? 'id' : (keys.includes('code') ? 'code' : 'nik');
          const updates = keys
            .filter(k => k !== conflictCol && k !== 'created_at')
            .map(k => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');

          const conflictClause = updates.length > 0
            ? `ON CONFLICT (${conflictCol}) DO UPDATE SET ${updates};`
            : `ON CONFLICT (${conflictCol}) DO NOTHING;`;

          sqlStatements.push(`INSERT INTO public.${table} (${cols}) VALUES (${vals}) ${conflictClause}`);
        }
        sqlStatements.push('');
      }
    } catch (err) {
      console.warn(`⚠️ Error koneksi pada tabel ${table}:`, err.message);
      backupData.tables[table] = [];
    }
  }

  const jsonFilename = `backup_${timestamp}.json`;
  const jsonPath = path.join(backupDir, jsonFilename);
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  const sqlFilename = `backup_${timestamp}.sql`;
  const sqlPath = path.join(backupDir, sqlFilename);
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf8');

  // Symlink/Copy to latest
  fs.writeFileSync(path.join(backupDir, 'backup_latest.json'), JSON.stringify(backupData, null, 2), 'utf8');
  fs.writeFileSync(path.join(backupDir, 'backup_latest.sql'), sqlStatements.join('\n'), 'utf8');

  console.log(`\n🎉 Backup Selesai! Total: ${totalRows} rekaman diekspor.`);
  console.log(`  📄 JSON: backups/${jsonFilename}`);
  console.log(`  🗄️ SQL : backups/${sqlFilename}`);
  console.log(`  🔗 Latest: backups/backup_latest.sql & backups/backup_latest.json`);
}

runBackup();
