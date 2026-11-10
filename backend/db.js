require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://appuser:appsecurepassword@localhost:5432/doccontroldb';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Postgres Pool Error]', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('[Database] Checking schema & initializing tables...');

    // 1. Run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('[Database] Schema verified successfully.');
    }

    // 2. Ensure company_code & company_name exist on documents and employees, and migrate NIK to NIP
    await client.query(`
      ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_code TEXT DEFAULT 'DJI';
      ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'PT Dentelle Jaya Infinitex';
      ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_code TEXT DEFAULT 'DJI';
      ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'PT Dentelle Jaya Infinitex';

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'nik') THEN
          ALTER TABLE public.employees RENAME COLUMN nik TO nip;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'creator_nik') THEN
          ALTER TABLE public.documents RENAME COLUMN creator_nik TO creator_nip;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'nik') THEN
          ALTER TABLE public.audit_logs RENAME COLUMN nik TO nip;
        END IF;
      END $$;
    `);

    // 3. Ensure Companies Master Seeded
    await client.query(`
      INSERT INTO public.companies (id, code, name, tagline, color, badge_color) VALUES
      ('comp-dji', 'DJI', 'PT Dentelle Jaya Infinitex', 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga', 'blue', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'),
      ('comp-umi', 'UMI', 'PT Ultimo Moda Indotex', 'Excellence in Fashion & Textile Manufacturing', 'indigo', 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'),
      ('comp-imk', 'IMK', 'PT IMK', 'High Quality Industrial Textile & Knitting', 'emerald', 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Check if documents table has rows
    const { rows: docCount } = await client.query('SELECT COUNT(*) as count FROM public.documents');
    if (parseInt(docCount[0].count, 10) === 0) {
      console.log('[Database] Documents table is empty. Seeding initial data from backup_latest.sql...');
      const backupPath = path.join(__dirname, '..', 'backups', 'backup_latest.sql');
      const fallbackBackupPath = path.join(__dirname, 'backup_latest.sql');
      const seedFile = fs.existsSync(backupPath) ? backupPath : (fs.existsSync(fallbackBackupPath) ? fallbackBackupPath : null);

      if (seedFile) {
        const seedSql = fs.readFileSync(seedFile, 'utf8');
        await client.query(seedSql);
        console.log('[Database] Successfully seeded initial master documents and tables from backup!');
      } else {
        console.warn('[Database] backup_latest.sql not found, tables created without seed.');
      }
    } else {
      console.log(`[Database] Found ${docCount[0].count} existing documents in database.`);
    }

    // 5. Update any null company_code on existing documents
    await client.query(`
      UPDATE public.documents 
      SET company_code = 'DJI', company_name = 'PT Dentelle Jaya Infinitex' 
      WHERE company_code IS NULL;
    `);

  } catch (error) {
    console.error('[Database Init Error]', error);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase,
};
