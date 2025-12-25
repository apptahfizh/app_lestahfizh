// src/routes/ortuAbsensiRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db"); // pg Pool
const auth = require("../middlewares/auth");

/*
=========================================================
GET absensi ORTU per bulan
GET /api/ortu/absensi/kehadiran?bulan=1&tahun=2025
=========================================================
*/
router.get("/kehadiran", auth(["ortu"]), async (req, res) => {
  try {
    /*
    -----------------------------------------------------
    Ambil user id dari JWT (auth middleware)
    -----------------------------------------------------
    */
    const userId = req.user.id;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({
        message: "Bulan dan tahun wajib diisi",
      });
    }

    /*
    -----------------------------------------------------
    1️⃣ Ambil peserta_id milik ORTU
    -----------------------------------------------------
    */
    const userResult = await db.query(
      `
      SELECT peserta_id
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].peserta_id) {
      // Jika ORTU belum terhubung dengan peserta
      return res.json({ data: [] });
    }

    const pesertaId = userResult.rows[0].peserta_id;

    /*
    -----------------------------------------------------
    2️⃣ Ambil absensi per bulan & tahun
    - strftime ➜ EXTRACT (PostgreSQL)
    - Mapping hari angka ➜ nama hari (CASE)
    -----------------------------------------------------
    */
    const absensiResult = await db.query(
      `
      SELECT
        CASE EXTRACT(DOW FROM tanggal)
          WHEN 0 THEN 'Minggu'
          WHEN 1 THEN 'Senin'
          WHEN 2 THEN 'Selasa'
          WHEN 3 THEN 'Rabu'
          WHEN 4 THEN 'Kamis'
          WHEN 5 THEN 'Jumat'
          WHEN 6 THEN 'Sabtu'
        END || ' ' || TO_CHAR(tanggal, 'YYYY-MM-DD') AS tanggal_hari,
        status,
        keterangan
      FROM absensi
      WHERE peserta_id = $1
        AND EXTRACT(MONTH FROM tanggal) = $2
        AND EXTRACT(YEAR FROM tanggal) = $3
      ORDER BY tanggal ASC
      `,
      [pesertaId, Number(bulan), Number(tahun)]
    );

    /*
    -----------------------------------------------------
    3️⃣ Format response sesuai DataTables
    -----------------------------------------------------
    */
    return res.json({
      data: absensiResult.rows,
    });
  } catch (err) {
    console.error("Unexpected error /kehadiran:", err.message);
    return res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
});

module.exports = router;
