/**
 * ISO 9001 Document Control System - File Decryption CLI
 *
 * Cara penggunaan:
 * node scripts/decrypt-file.js <path-ke-file.enc> [passphrase]
 *
 * Contoh:
 * node scripts/decrypt-file.js ./DJI-SOP-FAT-02-00_PROSES_PEMBELIAN_BARANG.pdf.enc
 *
 * Hasil dekripsi akan otomatis disimpan ke nama file aslinya (misal .pdf)
 * Compatible with OpenSSL standard:
 * openssl enc -d -aes-256-cbc -pbkdf2 -in file.enc -out file.pdf -k "PASSPHRASE"
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadPassphrase() {
  const envFiles = ['.env', 'backend/.env', '.env.local'];
  let authSecretFallback = null;

  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('BACKUP_ENCRYPTION_KEY=')) {
          const val = trimmed.slice('BACKUP_ENCRYPTION_KEY='.length).trim();
          if (val) return val;
        }
        if (!authSecretFallback && trimmed.startsWith('AUTH_SECRET=')) {
          const val = trimmed.slice('AUTH_SECRET='.length).trim();
          if (val && !val.includes('replace-with')) authSecretFallback = val;
        }
      }
    }
  }

  return authSecretFallback || 'DCS_ISO9001_Secure_Encryption_Key_2026';
}

function decryptBuffer(encryptedBuffer, passphrase) {
  if (encryptedBuffer.subarray(0, 8).toString() !== 'Salted__') {
    throw new Error('Header file tidak valid. Berkas bukan format OpenSSL Salted__ terenkripsi.');
  }
  const salt = encryptedBuffer.subarray(8, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  const derived = crypto.pbkdf2Sync(passphrase, salt, 10000, 48, 'sha256');
  const key = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('========================================================================');
  console.log('  ISO 9001:2015 Document Decryption Tool (AES-256-CBC PBKDF2)');
  console.log('========================================================================');
  console.log('Penggunaan : node scripts/decrypt-file.js <file.enc> [passphrase]');
  console.log('Contoh     : node scripts/decrypt-file.js ./DJI-SOP-FAT-02-00.pdf.enc');
  process.exit(1);
}

const filePath = path.resolve(args[0]);
if (!fs.existsSync(filePath)) {
  console.error(`❌ Error: File "${filePath}" tidak ditemukan!`);
  process.exit(1);
}

const passphrase = args[1] || loadPassphrase();

try {
  console.log(`🔓 Mendekripsi file: ${path.basename(filePath)}...`);
  const encryptedBytes = fs.readFileSync(filePath);
  const decryptedBytes = decryptBuffer(encryptedBytes, passphrase);

  // Hilangkan ekstensi .enc
  let outPath = filePath.replace(/\.enc$/i, '');
  if (outPath === filePath) {
    outPath = `${filePath}.decrypted`;
  }

  fs.writeFileSync(outPath, decryptedBytes);
  console.log(`✅ Berhasil didekripsi!`);
  console.log(`📁 File hasil: ${outPath} (${decryptedBytes.length} bytes)`);
} catch (err) {
  console.error(`❌ Gagal mendekripsi file:`, err.message);
  console.error(`Pastikan passphrase/kunci enkripsi benar!`);
  process.exit(1);
}

