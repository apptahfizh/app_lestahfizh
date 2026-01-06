// src/routes/absensiRoutes.js
const express = require("express");
const router = express.Router();

// 🔥 WAJIB: destructuring dari db.js
const { db: pool } = require("../config/db");

// ======================================================
// GET absensi per tanggal
// ======================================================
router.get("/", async (req, res) => {
  const { tanggal } = req.query;

  if (!tanggal) {
    return res.status(400).json({ message: "Tanggal wajib diisi" });
  }

  if (isNaN(Date.parse(tanggal))) {
    return res.status(400).json({ message: "Format tanggal tidak valid" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        p.id AS peserta_id,
        p.nama,
        a.status,
        a.keterangan
      FROM peserta_didik p
      LEFT JOIN absensi a
        ON a.peserta_id = p.id
        AND a.tanggal = $1
      ORDER BY p.nama ASC
      `,
      [tanggal]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/absensi ERROR FULL:", err);
    res.status(500).json({
      message: "Gagal load absensi",
      error: err.message,
    });
  }
});

// ======================================================
// SIMPAN / UPDATE absensi (UPSERT)
// ======================================================
router.post("/", async (req, res) => {
  const { peserta_id, tanggal, status, keterangan } = req.body;

  if (!peserta_id || !tanggal || !status) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    // ON CONFLICT di PostgreSQL
    await pool.query(
      `
      INSERT INTO absensi (peserta_id, tanggal, status, keterangan)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (peserta_id, tanggal)
      DO UPDATE SET
        status = EXCLUDED.status,
        keterangan = EXCLUDED.keterangan
      `,
      [peserta_id, tanggal, status, keterangan || null]
    );

    res.json({ message: "Absensi berhasil disimpan" });
  } catch (err) {
    console.error("POST /api/absensi error:", err.message);
    res.status(500).json({ message: "Gagal simpan absensi" });
  }
});

// ======================================================
// REKAP BULANAN PER PESERTA
// ======================================================
router.get("/rekap-bulanan", async (req, res) => {
  const { bulan, tahun } = req.query;

  if (!bulan || !tahun) {
    return res.status(400).json({
      message: "bulan dan tahun wajib diisi",
    });
  }

  try {
    const result = await pool.query(
      `
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
        AND EXTRACT(MONTH FROM a.tanggal) = $1
        AND EXTRACT(YEAR FROM a.tanggal) = $2
      GROUP BY p.id
      ORDER BY p.nama ASC
      `,
      [Number(bulan), Number(tahun)]
    );

    res.json(result.rows); // 🔥 ARRAY
  } catch (err) {
    console.error("GET rekap bulanan error:", err.message);
    res.status(500).json({ message: "Gagal load rekap bulanan" });
  }
});

// ======================================================
// GET detail absensi per peserta (bulanan)
// ======================================================
router.get("/detail", async (req, res) => {
  const { peserta_id, bulan, tahun } = req.query;

  if (!peserta_id || !bulan || !tahun) {
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        tanggal,
        status,
        keterangan
      FROM absensi
      WHERE peserta_id = $1
        AND EXTRACT(MONTH FROM tanggal) = $2
        AND EXTRACT(YEAR FROM tanggal) = $3
      ORDER BY tanggal ASC
      `,
      [peserta_id, Number(bulan), Number(tahun)]
    );

    res.json(result.rows); // 🔥 ARRAY
  } catch (err) {
    console.error("GET detail absensi error:", err.message);
    res.status(500).json({ message: "Gagal load detail absensi" });
  }
});

// ======================================================
// GET absensi kehadiran (ROLE: ORTU)
// ======================================================
router.get("/kehadiran", async (req, res) => {
  const userId = req.user.id; // dari JWT
  const { bulan, tahun } = req.query;

  if (!bulan || !tahun) {
    return res.status(400).json({ message: "Bulan dan tahun wajib diisi" });
  }

  try {
    // ===========================
    // Ambil peserta milik ORTU
    // ===========================
    const userResult = await pool.query(
      "SELECT peserta_id FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].peserta_id) {
      return res.json({ data: [] });
    }

    const pesertaId = userResult.rows[0].peserta_id;

    // ===========================
    // Ambil absensi + nama hari
    // ===========================
    const absensiResult = await pool.query(
      `
      SELECT
        TO_CHAR(a.tanggal, 'YYYY-MM-DD') || ' ' ||
        CASE EXTRACT(DOW FROM a.tanggal)
          WHEN 0 THEN 'Minggu'
          WHEN 1 THEN 'Senin'
          WHEN 2 THEN 'Selasa'
          WHEN 3 THEN 'Rabu'
          WHEN 4 THEN 'Kamis'
          WHEN 5 THEN 'Jumat'
          WHEN 6 THEN 'Sabtu'
        END AS tanggal_hari,
        a.status,
        a.keterangan,
        p.nama AS nama_peserta
      FROM absensi a
      JOIN peserta_didik p ON a.peserta_id = p.id
      WHERE a.peserta_id = $1
        AND EXTRACT(MONTH FROM a.tanggal) = $2
        AND EXTRACT(YEAR FROM a.tanggal) = $3
      ORDER BY a.tanggal ASC
      `,
      [pesertaId, Number(bulan), Number(tahun)]
    );

    return res.json({ data: absensiResult.rows });
  } catch (err) {
    console.error("GET kehadiran error:", err.message);
    res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
});

module.exports = router;
