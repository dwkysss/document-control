require('dotenv').config();
const crypto = require('crypto');
const { pool } = require('../db');

const nip = String(process.env.USER_NIP || '').trim();
const password = String(process.env.USER_PASSWORD || '');

if (!nip || password.length < 12) {
  console.error('Set USER_NIP and a USER_PASSWORD of at least 12 characters before running this script.');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');

pool.query('UPDATE public.employees SET password_hash = $1 WHERE nip = $2 RETURNING nip', [`${salt}:${hash}`, nip])
  .then(({ rows }) => {
    if (!rows.length) throw new Error('Employee NIP was not found.');
    console.log(`Password set for ${rows[0].nip}.`);
  })
  .catch(error => {
    console.error('Password was not set:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
