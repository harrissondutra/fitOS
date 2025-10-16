import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: false,
  });

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Connected to Postgres');
    console.log(res.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();




