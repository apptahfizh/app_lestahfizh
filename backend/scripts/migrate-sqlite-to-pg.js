require("dotenv").config();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Pool } = require("pg");

// ===============================
// KONEKSI SQLITE
// ===============================
const sqliteDbPath = path.join(__dirname, "..", "lestahfizh_final.db");
const sqliteDb = new sqlite3.Database(sqliteDbPath);

// ===============================
// KONEKSI POSTGRES
// ===============================
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ===============================
// HELPER
// ===============================
function sqliteAll(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ===============================
// MIGRASI PESERTA DIDIK
// ===============================
async function migratePeserta() {
  console.log("⏳ Migrating peserta_didik...");
  const rows = await sqliteAll(sqliteDb, "SELECT * FROM peserta_didik");

  for (const r of rows) {
    await pg.query(
      `
      INSERT INTO peserta_didik (id, nama, create_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      `,
      [r.id, r.nama, r.create_at]
    );
  }
  console.log("✅ peserta_didik OK");
}

// ===============================
// MIGRASI USERS
// ===============================
async function migrateUsers() {
  console.log("⏳ Migrating users...");
  const rows = await sqliteAll(sqliteDb, "SELECT * FROM users");

  for (const r of rows) {
    await pg.query(
      `
      INSERT INTO users
        (id, username, password_hash, role, display_name, created_at, peserta_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        r.id,
        r.username,
        r.password_hash,
        r.role,
        r.display_name,
        r.created_at,
        r.peserta_id,
      ]
    );
  }
  console.log("✅ users OK");
}

// ===============================
// MIGRASI SURAH
// ===============================
async function migrateSurah() {
  console.log("⏳ Migrating surah...");
  const rows = await sqliteAll(sqliteDb, "SELECT * FROM surah");

  for (const r of rows) {
    await pg.query(
      `
      INSERT INTO surah (id, nama_surah, jumlah_ayat)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      `,
      [r.id, r.nama_surah, r.jumlah_ayat]
    );
  }
  console.log("✅ surah OK");
}

// ===============================
// MIGRASI HAFALAN
// ===============================
async function migrateHafalan() {
  console.log("⏳ Migrating hafalan...");
  const rows = await sqliteAll(sqliteDb, "SELECT * FROM hafalan");

  for (const r of rows) {
    await pg.query(
      `
      INSERT INTO hafalan
        (id, peserta_id, tanggal, surah, ayat_hafal, ayat_setor, mulai_setor_ayat, selesai_setor_ayat, keterangan)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        r.id,
        r.peserta_id,
        r.tanggal,
        r.surah,
        r.ayat_hafal,
        r.ayat_setor,
        r.mulai_setor_ayat,
        r.selesai_setor_ayat,
        r.keterangan,
      ]
    );
  }
  console.log("✅ hafalan OK");
}

// ===============================
// MIGRASI ABSENSI
// ===============================
async function migrateAbsensi() {
  console.log("⏳ Migrating absensi...");
  const rows = await sqliteAll(sqliteDb, "SELECT * FROM absensi");

  for (const r of rows) {
    await pg.query(
      `
      INSERT INTO absensi
        (id, peserta_id, tanggal, status, keterangan, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [r.id, r.peserta_id, r.tanggal, r.status, r.keterangan, r.created_at]
    );
  }
  console.log("✅ absensi OK");
}

// ===============================
// MAIN
// ===============================
async function run() {
  try {
    await migratePeserta();
    await migrateUsers();
    await migrateSurah();
    await migrateHafalan();
    await migrateAbsensi();

    console.log("\n🎉 MIGRASI SELESAI 100%");
  } catch (err) {
    console.error("❌ MIGRASI GAGAL:", err);
  } finally {
    sqliteDb.close();
    await pg.end();
  }
}

run();
