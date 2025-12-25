// src/models/init.js
const { db, transaction } = require("../config/db");
const bcrypt = require("bcryptjs");

function init() {
  // users
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin','ustadz','ortu')) NOT NULL DEFAULT 'ortu',
      display_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `
  ).run();

  // peserta_didik (final structure)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS peserta_didik (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      create_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `
  ).run();

  // hafalan (final structure)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS hafalan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peserta_id INTEGER NOT NULL,
      tanggal TEXT DEFAULT CURRENT_TIMESTAMP,
      surah TEXT NOT NULL,
      ayat_hafal TEXT,
      ayat_setor TEXT,
      mulai_setor_ayat INTEGER,
      selesai_setor_ayat INTEGER,
      keterangan TEXT,
      FOREIGN KEY (peserta_id) REFERENCES peserta_didik(id) ON DELETE CASCADE
    )
  `
  ).run();

  // index untuk mempercepat query hafalan
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_hafalan_peserta ON hafalan(peserta_id)"
  ).run();
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_hafalan_tanggal ON hafalan(tanggal)"
  ).run();
  db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_hafalan_surah ON hafalan(surah)"
  ).run();

  // seed default admin if not exists
  const admin = db
    .prepare("SELECT id FROM users WHERE username = 'admin'")
    .get();
  if (!admin) {
    const hashed = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'admin', ?)"
    ).run("admin", hashed, "Administrator");
    console.log("Seed: admin (username: admin, password: admin123)");
  }

  // seed sample peserta (if table empty)
  const count = db.prepare("SELECT COUNT(1) AS cnt FROM peserta_didik").get();
  if (count.cnt === 0) {
    const insert = db.prepare("INSERT INTO peserta_didik (nama) VALUES (?)");
    const t = transaction(() => {
      insert.run("Budi Santoso");
      insert.run("Siti Aminah");
      insert.run("Alya Putri");
    });
    t();
    console.log("Seed: contoh peserta ditambahkan (3 rows).");
  }
}

module.exports = init;
