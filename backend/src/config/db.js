// backend/src/config/db.js
const { Pool } = require("pg");

/*
=========================================================
POSTGRESQL CONNECTION (Neon / Production Ready)
=========================================================
*/

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // wajib untuk Neon / Vercel
  },
});

/*
=========================================================
LOG KONEKSI (sekali saat connect)
=========================================================
*/
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

/*
=========================================================
LOG ERROR GLOBAL
=========================================================
*/
pool.on("error", (err) => {
  console.error("❌ Unexpected PG error", err);
  process.exit(1);
});

module.exports = {
  db: pool, // konsisten dengan: const { db } = require("../config/db")
};
