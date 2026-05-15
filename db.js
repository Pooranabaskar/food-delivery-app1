const { Pool } = require('pg');
require('dotenv').config();

// Pool = a group of database connections
// (more efficient than connecting every single time)
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when app starts
pool.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database!');
  }
});

module.exports = pool;