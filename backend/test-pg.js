require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PG CONNECTED:", res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error("❌ PG CONNECTION ERROR:", err.message);
  }
}

test();
