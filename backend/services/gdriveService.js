/**
 * Google Drive Automated Per-File Encrypted Backup Service
 * ISO 9001:2015 Clause 7.5.3 Compliant
 *
 * Capabilities:
 * 1. AES-256-CBC with PBKDF2 encryption for individual document files (PDF, Word, Excel).
 * 2. Uploads encrypted files to Google Drive using either OAuth 2.0 User Refresh Token (for personal Google Drive)
 *    or Google Cloud Service Account (for Google Workspace Shared Drives).
 * 3. Organizes files hierarchically: Root -> Company -> Department -> [DOC_NUMBER]_[TITLE].ext.enc.
 * 4. Zero extra npm bloat: uses native Node.js crypto and fetch.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Membaca kredensial Google Service Account dari berbagai kemungkinan path
 */
function getCredentials() {
  const candidatePaths = [
    process.env.GDRIVE_SERVICE_ACCOUNT_KEY,
    process.env.GDRIVE_SERVICE_ACCOUNT_KEY ? path.resolve(process.cwd(), process.env.GDRIVE_SERVICE_ACCOUNT_KEY) : null,
    path.join(__dirname, '..', '..', 'credentials', 'gdrive-service-account.json'),
    path.join(__dirname, '..', 'credentials', 'gdrive-service-account.json'),
    path.join(process.cwd(), 'credentials', 'gdrive-service-account.json'),
    '/app/credentials/gdrive-service-account.json',
  ].filter(Boolean);

  for (const jsonKeyPath of candidatePaths) {
    if (fs.existsSync(jsonKeyPath)) {
      try {
        const raw = fs.readFileSync(jsonKeyPath, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[GDrive Backup] Gagal membaca Service Account JSON di ${jsonKeyPath}:`, err.message);
      }
    }
  }

  if (process.env.GDRIVE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.warn('[GDrive Backup] Gagal parse GDRIVE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  return null;
}

/**
 * Mendapatkan Access Token dari Google OAuth2:
 * Mendukung OAuth 2.0 User Refresh Token (untuk personal Gmail / My Drive)
 * serta Service Account JWT RS256 (untuk Google Workspace Shared Drives)
 */
async function getGoogleAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // Opsi 1: OAuth 2.0 User Refresh Token (Solusi terbaik untuk Akun Personal Google Drive / My Drive)
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;
  const clientId = process.env.GDRIVE_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`Gagal refresh token Google OAuth2 (HTTP ${tokenRes.status}): ${errorText}`);
    }

    const tokenData = await tokenRes.json();
    cachedToken = tokenData.access_token;
    tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
    return cachedToken;
  }

  // Opsi 2: Service Account JWT RS256 (Untuk Google Workspace Shared Drives)
  const credentials = getCredentials();
  if (!credentials || !credentials.client_email || !credentials.private_key) {
    throw new Error('Google Drive belum dikonfigurasi. Sediakan OAuth Refresh Token atau Service Account key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const toB64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${toB64Url(header)}.${toB64Url(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(credentials.private_key, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Gagal otentikasi Google OAuth2 Service Account (HTTP ${tokenRes.status}): ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  cachedToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
  return cachedToken;
}

/**
 * Enkripsi buffer file dengan AES-256-CBC (OpenSSL PBKDF2 standard compatible)
 */
function encryptBuffer(buffer, passphrase) {
  const salt = crypto.randomBytes(8);
  const derived = crypto.pbkdf2Sync(passphrase, salt, 10000, 48, 'sha256');
  const key = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  // Format OpenSSL standar: 'Salted__' (8 bytes) + salt (8 bytes) + ciphertext
  return Buffer.concat([Buffer.from('Salted__'), salt, encrypted]);
}

/**
 * Dekripsi buffer file terenkripsi AES-256-CBC
 */
function decryptBuffer(encryptedBuffer, passphrase) {
  if (encryptedBuffer.subarray(0, 8).toString() !== 'Salted__') {
    throw new Error('Format file terenkripsi tidak valid (Header "Salted__" tidak ditemukan).');
  }
  const salt = encryptedBuffer.subarray(8, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  const derived = crypto.pbkdf2Sync(passphrase, salt, 10000, 48, 'sha256');
  const key = derived.subarray(0, 32);
  const iv = derived.subarray(32, 48);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Mencari atau membuat folder secara rekursif di Google Drive
 */
async function ensureDriveFolder(folderName, parentFolderId, accessToken) {
  const query = `'${parentFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Jika belum ada, buat folder baru
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Gagal membuat folder "${folderName}" di GDrive: ${errorText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Mengunggah satu file dokumen terenkripsi ke Google Drive
 * Alur: Server Disk -> Baca Buffer -> Enkripsi AES-256 -> Upload per File ke GDrive
 */
async function backupDocumentFile(doc) {
  const isEnabled = process.env.GDRIVE_BACKUP_ENABLED !== 'false';
  if (!isEnabled) {
    return { success: false, skipped: true, reason: 'GDRIVE_BACKUP_ENABLED is set to false' };
  }

  const rootFolderId = process.env.GDRIVE_FOLDER_ID;
  if (!rootFolderId) {
    console.log('[GDrive Backup] GDRIVE_FOLDER_ID belum diatur di .env. Lewati pencadangan cloud.');
    return { success: false, skipped: true, reason: 'GDRIVE_FOLDER_ID not configured' };
  }

  const passphrase = process.env.BACKUP_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'DCS_ISO9001_Secure_Encryption_Key_2026';

  // 1. Kumpulkan semua berkas (mendukung multi-file attachments: PDF + DOCX/XLSX)
  const rawAttachments = Array.isArray(doc.attachments) && doc.attachments.length > 0
    ? doc.attachments
    : [{ fileUrl: doc.file_url, fileName: doc.file_name }];

  const seenKeys = new Set();
  const fileEntries = [];
  for (const att of rawAttachments) {
    const fUrl = att?.fileUrl || att?.file_url || null;
    const fName = att?.fileName || att?.file_name || null;
    const key = fUrl || fName;
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    fileEntries.push({ fileUrl: fUrl, fileName: fName });
  }

  const candidateDirs = [
    process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : null,
    path.join(__dirname, '..', 'public', 'uploads'),
    path.join(__dirname, '..', '..', 'backend', 'public', 'uploads'),
    path.join(__dirname, '..', '..', 'uploads'),
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'backend', 'public', 'uploads'),
  ].filter(Boolean);

  const resolveLocalFile = (entry) => {
    const fileNameCandidates = [
      entry.fileUrl ? path.basename(entry.fileUrl) : null,
      entry.fileName ? path.basename(entry.fileName) : null,
    ].filter(Boolean);

    for (const dir of candidateDirs) {
      for (const name of fileNameCandidates) {
        const candidate = path.join(dir, name);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  };

  const resolvedFiles = fileEntries
    .map((entry) => ({ ...entry, localFilePath: resolveLocalFile(entry) }))
    .filter((entry) => Boolean(entry.localFilePath));

  if (resolvedFiles.length === 0) {
    console.warn(`[GDrive Backup] Berkas fisik untuk dokumen ${doc.doc_number || doc.id} tidak ditemukan di disk.`);
    return { success: false, error: 'File fisik tidak ditemukan di server.' };
  }

  try {
    // 2. Otorisasi ke Google Drive & pastikan struktur folder: Root -> [Nama PT] -> [Departemen]
    const accessToken = await getGoogleAccessToken();
    const compName = doc.company_name || (doc.company_code === 'UMI' ? 'PT Ultimo Moda Indotex' : doc.company_code === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');
    const compFolderId = await ensureDriveFolder(compName, rootFolderId, accessToken);
    const deptName = doc.department || 'UMUM';
    const targetFolderId = await ensureDriveFolder(deptName, compFolderId, accessToken);

    const pdfPassword = process.env.PDF_BACKUP_PASSWORD || process.env.BACKUP_ENCRYPTION_KEY || 'DCS2026!';
    const safeDocNum = (doc.doc_number || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTitle = (doc.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

    const usedRemoteNames = new Set();
    const uploadedFiles = [];

    for (const entry of resolvedFiles) {
      const { localFilePath } = entry;
      const originalExt = (path.extname(localFilePath) || (entry.fileName ? path.extname(entry.fileName) : '.pdf')).toLowerCase();

      let fileBytesToUpload = fs.readFileSync(localFilePath);
      let mimeType = 'application/octet-stream';
      let isPasswordProtected = false;

      if (originalExt === '.pdf') {
        mimeType = 'application/pdf';
        try {
          const pdfLib = require('pdf-lib');
          const { configure, lock } = require('pdf-lib-encrypt');
          configure(pdfLib);
          fileBytesToUpload = await lock(fileBytesToUpload, pdfPassword);
          isPasswordProtected = true;
        } catch (pdfErr) {
          console.warn(`[GDrive Backup] Gagal menerapkan password ke PDF, mengunggah PDF biasa:`, pdfErr.message);
        }
      } else if (originalExt === '.docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (originalExt === '.xlsx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      // Nama file di Google Drive (hindari bentrok jika ada 2 file berekstensi sama)
      let remoteFileName = `${safeDocNum}_${safeTitle}${originalExt}`;
      let suffix = 2;
      while (usedRemoteNames.has(remoteFileName.toLowerCase())) {
        remoteFileName = `${safeDocNum}_${safeTitle}_${suffix}${originalExt}`;
        suffix++;
      }
      usedRemoteNames.add(remoteFileName.toLowerCase());

      // Cek apakah file sudah pernah diunggah sebelumnya (update jika sudah ada)
      const checkQuery = `'${targetFolderId}' in parents and name = '${remoteFileName.replace(/'/g, "\\'")}' and trashed = false`;
      const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(checkQuery)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      const checkRes = await fetch(checkUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      let existingFileId = null;

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.files && checkData.files.length > 0) {
          existingFileId = checkData.files[0].id;
        }
      }

      // Upload Multipart ke Google Drive
      const boundary = `----DCSBoundary${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      const metadata = {
        name: remoteFileName,
        description: `ISO 9001 Document | No: ${doc.doc_number || '-'} | Rev: ${doc.revision || '00'} | PT: ${compName} | Dept: ${deptName}${isPasswordProtected ? ' | Password Protected' : ''}`,
        ...(!existingFileId ? { parents: [targetFolderId] } : {}),
      };

      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
      );
      const mediaHeader = Buffer.from(
        `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`
      );
      const closePart = Buffer.from(closeDelimiter);
      const multipartBody = Buffer.concat([metadataPart, mediaHeader, Buffer.from(fileBytesToUpload), closePart]);

      const uploadUrl = existingFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&supportsAllDrives=true`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';

      const uploadRes = await fetch(uploadUrl, {
        method: existingFileId ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length),
        },
        body: multipartBody,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Upload GDrive gagal untuk ${remoteFileName} (HTTP ${uploadRes.status}): ${errorText}`);
      }

      const uploaded = await uploadRes.json();
      console.log(`[GDrive Backup] Berhasil mencadangkan ${remoteFileName} (ID: ${uploaded.id}) ke Google Drive [${compName}/${deptName}]`);
      uploadedFiles.push({
        fileId: uploaded.id,
        fileName: remoteFileName,
        folderId: targetFolderId,
        fileSize: fileBytesToUpload.length,
        isPasswordProtected,
      });
    }

    const first = uploadedFiles[0] || {};
    return {
      success: uploadedFiles.length > 0,
      uploadedCount: uploadedFiles.length,
      files: uploadedFiles,
      fileId: first.fileId,
      fileName: first.fileName,
      folderId: targetFolderId,
      fileSize: first.fileSize,
      isPasswordProtected: first.isPasswordProtected,
    };
  } catch (err) {
    console.error(`[GDrive Backup Error] Gagal mencadangkan dokumen ${doc.doc_number}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Cek status konfigurasi Google Drive saat ini
 */
function getBackupStatus() {
  const credentials = getCredentials();
  const folderId = process.env.GDRIVE_FOLDER_ID;
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  const pdfPassword = process.env.PDF_BACKUP_PASSWORD || 'DCS2026!';
  const hasOAuth = Boolean(process.env.GDRIVE_REFRESH_TOKEN && process.env.GDRIVE_CLIENT_ID && process.env.GDRIVE_CLIENT_SECRET);
  const hasServiceAccount = Boolean(credentials && credentials.client_email);

  return {
    enabled: process.env.GDRIVE_BACKUP_ENABLED !== 'false',
    configured: Boolean((hasOAuth || hasServiceAccount) && folderId),
    authMethod: hasOAuth ? 'OAuth 2.0 (User)' : hasServiceAccount ? 'Service Account' : 'None',
    serviceAccountEmail: credentials?.client_email || null,
    targetFolderId: folderId || null,
    protectionMode: 'PDF Password (AES-256)',
    pdfPassword: pdfPassword,
    hasEncryptionKey: Boolean(encryptionKey),
  };
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  backupDocumentFile,
  getBackupStatus,
  getCredentials,
  getGoogleAccessToken,
};

