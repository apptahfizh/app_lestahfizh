// src/routes/surahRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db"); // pg Pool

/* =========================================================
   GET - Semua surah
   Digunakan untuk dropdown & referensi hafalan
========================================================= */
router.get("/", async (req, res) => {
  try {
    /*
    -----------------------------------------------------
    Ambil seluruh data surah
    - Urut berdasarkan ID ASC
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      SELECT
        id,
        nama_surah,
        jumlah_ayat
      FROM surah
      ORDER BY id ASC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      message: "Gagal mengambil data surah",
      error: err.message,
    });
  }
});

module.exports = router;
