// src/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db");
const auth = require("../middlewares/auth");

/*
=========================================================
TOTAL PESERTA
=========================================================
*/
router.get("/jumlah-peserta", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const row = db.prepare("SELECT COUNT(*) AS total FROM peserta_didik").get();
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
=========================================================
PROGRESS DASHBOARD
=========================================================
*/
router.get(
  "/peserta-progress",
  auth(["admin", "ustadz", "ortu"]),
  (req, res) => {
    try {
      // Ambil semua peserta
      const pesertaRows = db
        .prepare(`SELECT id, nama FROM peserta_didik`)
        .all();

      const result = pesertaRows.map((p) => {
        // Ambil hafalan terakhir peserta JOIN dengan tabel surah
        const hafalan = db
          .prepare(
            `
        SELECT 
          h.*, 
          s.nama_surah, 
          s.jumlah_ayat
        FROM hafalan h
        LEFT JOIN surah s ON s.id = CAST(h.surah AS INTEGER)
        WHERE h.peserta_id = ?
        ORDER BY h.tanggal DESC, h.id DESC
        LIMIT 1
      `
          )
          .get(p.id);

        let ayatHafal = 0;

        if (hafalan) {
          // Ambil angka terakhir dari kolom ayat_hafal (string)
          if (hafalan.selesai_setor_ayat) {
            ayatHafal = hafalan.selesai_setor_ayat;
          } else if (hafalan.ayat_hafal) {
            const match = hafalan.ayat_hafal.match(/(\d+)\s*$/);
            ayatHafal = match ? parseInt(match[1]) : 0;
          }
        }

        const totalAyat = hafalan?.jumlah_ayat || 0;
        const prosentase =
          totalAyat > 0 ? Math.round((ayatHafal / totalAyat) * 100) : 0;

        return {
          peserta_id: p.id,
          nama_peserta: p.nama,
          surah: hafalan?.nama_surah || "-",
          ayat_terakhir: ayatHafal,
          total_ayat: totalAyat,
          prosentase,
        };
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
