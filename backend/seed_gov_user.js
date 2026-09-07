const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/civicsolve'
});

async function main() {
  const password = 'GovTest@123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);

  // Delete existing test user and re-insert with correct hash
  await pool.query("DELETE FROM government_users WHERE email = 'gov.test@civicsolve.in'");

  const result = await pool.query(
    `INSERT INTO government_users (name, email, password_hash, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     RETURNING id, name, email, department, designation`,
    ['Test Government Officer', 'gov.test@civicsolve.in', hash, 'Public Works', 'District Officer', 'Hyderabad', 'Telangana', '9876543210']
  );

  console.log('Created user:', result.rows[0]);

  // Verify login works
  const { rows } = await pool.query("SELECT password_hash FROM government_users WHERE email = 'gov.test@civicsolve.in'");
  const match = await bcrypt.compare(password, rows[0].password_hash);
  console.log('Password verification:', match ? 'SUCCESS' : 'FAILED');

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
