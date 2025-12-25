// src/routes/ortuAbsensiRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db");

// ===============================
// GET absensi ORTU per bulan
// ===============================
// GET /api/ortu/absensi/kehadiran?bulan=1&tahun=2025
router.get("/kehadiran", (req, res) => {
  try {
    const userId = req.user.id; // dari auth.js (JWT)
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({ message: "Bulan dan tahun wajib diisi" });
    }

    // 1️⃣ Ambil peserta_id milik ORTU
    const user = db
      .prepare("SELECT peserta_id FROM users WHERE id = ?")
      .get(userId);

    if (!user || !user.peserta_id) {
      return res.json({ data: [] });
    }

    // 2️⃣ Ambil absensi + format Hari YYYY-MM-DD
    const rows = db
      .prepare(
        `
        SELECT
          CASE strftime('%w', tanggal)
            WHEN '0' THEN 'Minggu'
            WHEN '1' THEN 'Senin'
            WHEN '2' THEN 'Selasa'
            WHEN '3' THEN 'Rabu'
            WHEN '4' THEN 'Kamis'
            WHEN '5' THEN 'Jumat'
            WHEN '6' THEN 'Sabtu'
          END || ' ' || tanggal AS tanggal_hari,
          status,
          keterangan
        FROM absensi
        WHERE peserta_id = ?
          AND strftime('%m', tanggal) = ?
          AND strftime('%Y', tanggal) = ?
        ORDER BY tanggal ASC
      `
      )
      .all(user.peserta_id, String(bulan).padStart(2, "0"), String(tahun));

    // 3️⃣ DataTables butuh { data: [] }
    return res.json({ data: rows });
  } catch (err) {
    console.error("Unexpected error /kehadiran:", err.message);
    return res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
});

module.exports = router;
