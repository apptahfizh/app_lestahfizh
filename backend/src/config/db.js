// src/config/db.js
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const dbPath = process.env.DB_FILE
  ? path.resolve(process.cwd(), process.env.DB_FILE)
  : path.resolve(process.cwd(), "lestahfizh_final.db");

// single instance
const db = new Database(dbPath);

// enable foreign keys
db.pragma("foreign_keys = ON");

// helper: run in transaction
function transaction(fn) {
  const t = db.transaction(fn);
  return (...args) => t(...args);
}

module.exports = { db, transaction };
