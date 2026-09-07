#!/usr/bin/env node

/**
 * Seed the first admin user.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node seed_admin.js "Admin Name" "admin@example.com" "SecurePassword123"
 *
 * Or with .env:
 *   node -r dotenv/config seed_admin.js "Admin Name" "admin@example.com" "SecurePassword123"
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node seed_admin.js <name> <email> <password>');
  console.error('  Set DATABASE_URL in environment or .env file.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO admin_users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3, name = $1
     RETURNING id, name, email`,
    [name.trim(), email.toLowerCase().trim(), hash]
  );

  console.log('Admin user seeded successfully:', rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
