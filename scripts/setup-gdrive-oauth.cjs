/**
 * One-Time Google Drive OAuth 2.0 Setup Script (CommonJS)
 * Otentikasi Akun Pribadi (@gmail.com) agar dapat mengunggah file tanpa batasan kuota Service Account.
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function updateEnvFile(updates) {
  const targets = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
  ];

  for (const target of targets) {
    let content = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(target, content.trim() + '\n', 'utf8');
  }
  console.log('✅ File .env dan backend/.env berhasil diperbarui!');
}

function promptInput(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  console.log('================================================================');
  console.log(' ISO 9001:2015 DCS - Setup Google Drive OAuth 2.0 Authorization');
  console.log('================================================================\n');

  const existingEnv = loadEnvFile(path.resolve(process.cwd(), '.env'));

  let clientId = process.argv[2] || process.env.GDRIVE_CLIENT_ID || existingEnv.GDRIVE_CLIENT_ID;
  let clientSecret = process.argv[3] || process.env.GDRIVE_CLIENT_SECRET || existingEnv.GDRIVE_CLIENT_SECRET;

  if (!clientId) {
    clientId = await promptInput('Masukkan Google Client ID: ');
  }
  if (!clientSecret) {
    clientSecret = await promptInput('Masukkan Google Client Secret: ');
  }

  if (!clientId || !clientSecret) {
    console.error('❌ Client ID dan Client Secret wajib diisi.');
    process.exit(1);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
      if (parsedUrl.pathname !== '/callback') {
        res.writeHead(404);
        return res.end('Not found');
      }

      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>❌ Izin Ditolak oleh Pengguna: ${error}</h2>`);
        console.error('❌ Izin ditolak:', error);
        server.close();
        process.exit(1);
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2>❌ Parameter code tidak ditemukan</h2>');
        return;
      }

      console.log('🔄 Menukarkan Authorization Code dengan Refresh Token Google...');
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>❌ Gagal Mendapatkan Token: ${tokenData.error_description || tokenData.error}</h2>`);
        console.error('❌ Error response dari Google:', tokenData);
        server.close();
        process.exit(1);
      }

      const refreshToken = tokenData.refresh_token;
      if (!refreshToken) {
        console.warn('⚠️ Tidak ada refresh_token yang dikembalikan (mungkin aplikasi sudah pernah diizinkan sebelumnya).');
      }

      // Update .env
      const envUpdates = {
        GDRIVE_CLIENT_ID: clientId,
        GDRIVE_CLIENT_SECRET: clientSecret,
      };
      if (refreshToken) {
        envUpdates.GDRIVE_REFRESH_TOKEN = refreshToken;
      }
      updateEnvFile(envUpdates);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h1 style="color: #10b981;">🎉 Autorisasi Google Drive Berhasil!</h1>
          <p style="font-size: 16px; color: #374151;">Document Control System sekarang terhubung langsung dengan Google Drive Anda.</p>
          <p style="color: #6b7280; font-size: 14px;">Anda dapat menutup jendela browser ini sekarang.</p>
        </div>
      `);

      console.log('\n🎉 SUKSES BESAR!');
      console.log('Token Google Drive telah tersimpan di .env.');
      console.log('Pencadangan file terenkripsi sekarang siap digunakan dengan kapasitas Google Drive Anda.');

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1500);

    } catch (err) {
      console.error('❌ Error saat menangani callback:', err);
      res.writeHead(500);
      res.end('Server Error');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`\nSilakan buka tautan berikut di browser untuk mengizinkan akses Google Drive:\n`);
    console.log(`👉 ${authUrl}\n`);
    console.log('Membuka browser secara otomatis...');

    // Windows open browser
    exec(`start "" "${authUrl}"`, (err) => {
      if (err) {
        console.log('Jika browser tidak terbuka otomatis, salin dan tempel tautan di atas ke browser Anda.');
      }
    });
  });
}

main().catch(console.error);

