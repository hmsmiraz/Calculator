require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'calculator_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// ── Schema ─────────────────────────────────────────────────────────────────────

const CREATE_TABLES = `

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100)        NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255)        NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Calculation history table
  CREATE TABLE IF NOT EXISTS calculations (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    operand_a  NUMERIC             NOT NULL,
    operand_b  NUMERIC             NOT NULL,
    operator   VARCHAR(1)          NOT NULL,
    result     NUMERIC             NOT NULL,
    expression VARCHAR(255)        NOT NULL,
    operation  VARCHAR(50)         NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Index for fast per-user history lookups
  CREATE INDEX IF NOT EXISTS idx_calculations_user_id
    ON calculations(user_id);

  -- Auto-update updated_at on users
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS users_updated_at ON users;
  CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

const DROP_TABLES = `
  DROP TABLE IF EXISTS calculations CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  DROP FUNCTION IF EXISTS update_updated_at CASCADE;
`;

// ── Runner ─────────────────────────────────────────────────────────────────────

const migrate = async () => {
  const undo = process.argv[2] === 'undo';
  const client = await pool.connect();

  try {
    if (undo) {
      console.log('⚠️  Rolling back all tables...');
      await client.query(DROP_TABLES);
      console.log('✅ All tables dropped.');
    } else {
      console.log('🚀 Running migrations...');
      await client.query(CREATE_TABLES);
      console.log('✅ Tables created successfully:');
      console.log('   → users');
      console.log('   → calculations');
      console.log('   → idx_calculations_user_id (index)');
      console.log('   → users_updated_at (trigger)');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
