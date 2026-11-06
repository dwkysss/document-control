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

const ORDERED_TABLES = [
  'companies',
  'departments',
  'document_types',
  'employees',
  'verifier_teams',
  'documents',
  'audit_logs',
  'system_settings'
];

async function runRestore() {
  const targetFileArg = process.argv[2];
  const backupFile = targetFileArg 
    ? path.resolve(process.cwd(), targetFileArg)
    : path.join(projectRoot, 'backups', 'backup_latest.json');

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ File backup tidak ditemukan: ${backupFile}`);
    process.exit(1);
  }

  console.log(`🔄 Membaca file backup: ${backupFile}`);
  const rawContent = fs.readFileSync(backupFile, 'utf8');
  let backupData;
  try {
    backupData = JSON.parse(rawContent);
  } catch (err) {
    console.error('❌ Gagal mem-parse file JSON backup:', err.message);
    process.exit(1);
  }

  console.log(`🚀 Memulai Restore Data ke self-hosted backend: ${apiBase}...`);
  let totalRestored = 0;

  for (const table of ORDERED_TABLES) {
    const records = backupData.tables[table] || [];
    if (records.length === 0) continue;

    const endpoint = table.replace(/_/g, '-');
    try {
      const res = await fetch(`${apiBase}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });

      if (!res.ok) {
        console.error(`❌ Gagal restore tabel ${table}: HTTP ${res.status}`);
      } else {
        console.log(`  ✓ Berhasil memulihkan ${records.length} baris ke tabel ${table}`);
        totalRestored += records.length;
      }
    } catch (err) {
      console.error(`❌ Error pada tabel ${table}:`, err.message);
    }
  }

  console.log(`\n🎉 Proses Restore Selesai! Total ${totalRestored} rekaman berhasil dipulihkan.`);
}

runRestore();
