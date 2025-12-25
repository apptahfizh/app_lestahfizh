// src/routes/absensiRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db");

// ===============================
// GET absensi per tanggal
// ===============================
router.get("/", (req, res) => {
  const { tanggal } = req.query;

  if (!tanggal) {
    return res.status(400).json({ message: "Tanggal wajib diisi" });
  }

  try {
    const rows = db
      .prepare(
        `
      SELECT
        p.id AS peserta_id,
        p.nama,
        a.status,
        a.keterangan
      FROM peserta_didik p
      LEFT JOIN absensi a
        ON a.peserta_id = p.id
        AND a.tanggal = ?
      ORDER BY p.nama ASC
    `
      )
      .all(tanggal);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/absensi error:", err.message);
    res.status(500).json({ message: "Gagal load absensi" });
  }
});

// ===============================
// SIMPAN / UPDATE absensi
// ===============================
router.post("/", (req, res) => {
  const { peserta_id, tanggal, status, keterangan } = req.body;

  if (!peserta_id || !tanggal || !status) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    db.prepare(
      `
      INSERT INTO absensi (peserta_id, tanggal, status, keterangan)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(peserta_id, tanggal)
      DO UPDATE SET
        status = excluded.status,
        keterangan = excluded.keterangan
    `
    ).run(peserta_id, tanggal, status, keterangan || null);

    res.json({ message: "Absensi berhasil disimpan" });
  } catch (err) {
    console.error("POST /api/absensi error:", err.message);
    res.status(500).json({ message: "Gagal simpan absensi" });
  }
});

module.exports = router;

// ===============================
// REKAP BULANAN PER PESERTA (SQLITE3)
// ===============================
router.get("/rekap-bulanan", (req, res) => {
  const db = req.app.locals.db;
  const { bulan, tahun } = req.query;

  if (!bulan || !tahun) {
    return res.status(400).json({
      message: "bulan dan tahun wajib diisi",
    });
  }

  const sql = `
    SELECT
      p.id AS peserta_id,
      p.nama,
      SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
      SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END) AS izin,
      SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
      SUM(CASE WHEN a.status = 'tidak hadir' THEN 1 ELSE 0 END) AS tidak_hadir
    FROM peserta_didik p
    LEFT JOIN absensi a
      ON a.peserta_id = p.id
      AND strftime('%m', a.tanggal) = ?
      AND strftime('%Y', a.tanggal) = ?
    GROUP BY p.id
    ORDER BY p.nama ASC
  `;

  db.all(sql, [String(bulan).padStart(2, "0"), String(tahun)], (err, rows) => {
    if (err) {
      console.error("GET rekap bulanan error:", err.message);
      return res.status(500).json({ message: "Gagal load rekap bulanan" });
    }

    res.json(rows); // 🔥 ARRAY, BUKAN {}
  });
});

// ===============================
// GET detail absensi per peserta (bulanan)
// ===============================
router.get("/detail", (req, res) => {
  const db = req.app.locals.db;
  const { peserta_id, bulan, tahun } = req.query;

  if (!peserta_id || !bulan || !tahun) {
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  }

  const bulanStr = String(bulan).padStart(2, "0");

  const sql = `
    SELECT
      tanggal,
      status,
      keterangan
    FROM absensi
    WHERE peserta_id = ?
      AND strftime('%m', tanggal) = ?
      AND strftime('%Y', tanggal) = ?
    ORDER BY tanggal ASC
  `;

  db.all(sql, [peserta_id, bulanStr, String(tahun)], (err, rows) => {
    if (err) {
      console.error("GET detail absensi error:", err.message);
      return res.status(500).json({ message: "Gagal load detail absensi" });
    }

    res.json(rows); // 🔥 array
  });
});

// GET /api/ortu/absensi/kehadiran?bulan=1&tahun=2025
module.exports = router;

router.get("/kehadiran", (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id; // dari JWT
  const { bulan, tahun } = req.query;

  if (!bulan || !tahun) {
    return res.status(400).json({ message: "Bulan dan tahun wajib diisi" });
  }

  // Ambil peserta milik ORTU
  const sqlPeserta = "SELECT peserta_id FROM users WHERE id = ?";
  db.get(sqlPeserta, [userId], (err, userRow) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil data peserta", error: err.message });
    }

    if (!userRow || !userRow.peserta_id) {
      return res.json({ data: [] });
    }

    const pesertaId = userRow.peserta_id;

    // Ambil absensi + nama hari
    const sqlAbsensi = `
      SELECT 
        a.tanggal || ' ' || 
        CASE strftime('%w', a.tanggal)
          WHEN '0' THEN 'Minggu'
          WHEN '1' THEN 'Senin'
          WHEN '2' THEN 'Selasa'
          WHEN '3' THEN 'Rabu'
          WHEN '4' THEN 'Kamis'
          WHEN '5' THEN 'Jumat'
          WHEN '6' THEN 'Sabtu'
        END AS tanggal_hari,
        a.status,
        a.keterangan,
        p.nama AS nama_peserta
      FROM absensi a
      JOIN peserta_didik p ON a.peserta_id = p.id
      WHERE a.peserta_id = ?
        AND strftime('%m', a.tanggal) = ?
        AND strftime('%Y', a.tanggal) = ?
      ORDER BY a.tanggal ASC
    `;

    db.all(
      sqlAbsensi,
      [pesertaId, String(bulan).padStart(2, "0"), String(tahun)],
      (err2, rows) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({
            message: "Gagal mengambil data absensi",
            error: err2.message,
          });
        }

        return res.json({ data: rows });
      }
    );
  });
});
