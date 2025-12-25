const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// optional log
db.on("connect", () => {
  console.log("PostgreSQL connected");
});

module.exports = { db };
