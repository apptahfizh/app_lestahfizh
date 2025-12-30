// src/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();

/**
 * db = PostgreSQL pool
 * diasumsikan diexport dari config/db.js
 */
const { db } = require("../config/db");
const auth = require("../middlewares/auth");

/*
=========================================================
TOTAL PESERTA
=========================================================
GET /api/dashboard/jumlah-peserta
Role: admin, ustadz, ortu
=========================================================
*/
router.get(
  "/jumlah-peserta",
  auth(["admin", "ustadz", "ortu"]),
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT COUNT(*)::int AS total FROM peserta_didik"
      );

      // PostgreSQL mengembalikan string untuk COUNT, kita cast ke int
      res.json(result.rows[0]);
    } catch (err) {
      console.error("GET jumlah-peserta error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/*
=========================================================
PROGRESS DASHBOARD PESERTA
=========================================================
GET /api/dashboard/peserta-progress
Role: admin, ustadz, ortu
=========================================================
*/
router.get(
  "/peserta-progress",
  auth(["admin", "ustadz", "ortu"]),
  async (req, res) => {
    try {
      /**
       * 1️⃣ Ambil semua peserta
       */
      const pesertaResult = await db.query(
        "SELECT id, nama FROM peserta_didik ORDER BY nama ASC"
      );

      const pesertaRows = pesertaResult.rows;

      /**
       * 2️⃣ Loop setiap peserta untuk ambil hafalan terakhir
       */
      const result = [];

      for (const p of pesertaRows) {
        /**
         * Ambil hafalan terakhir peserta
         * JOIN dengan tabel surah
         */
        const hafalanResult = await db.query(
          `
          SELECT
            h.*,
            s.nama_surah,
            s.jumlah_ayat
          FROM hafalan h
          LEFT JOIN surah s ON s.id = CAST(h.surah AS INTEGER)
          WHERE h.peserta_id = $1
          ORDER BY h.tanggal DESC, h.id DESC
          LIMIT 1
        `,
          [p.id]
        );

        const hafalan = hafalanResult.rows[0];

        /**
         * 3️⃣ Hitung ayat terakhir yang sudah dihafal
         */
        let ayatHafal = 0;

        if (hafalan) {
          // Prioritas: selesai_setor_ayat
          if (hafalan.selesai_setor_ayat) {
            ayatHafal = hafalan.selesai_setor_ayat;
          }
          // Fallback: parse dari ayat_hafal (string)
          else if (hafalan.ayat_hafal) {
            const match = hafalan.ayat_hafal.match(/(\d+)\s*$/);
            ayatHafal = match ? parseInt(match[1], 10) : 0;
          }
        }

        /**
         * 4️⃣ Hitung prosentase hafalan
         */
        const totalAyat = hafalan?.jumlah_ayat || 0;
        const prosentase =
          totalAyat > 0 ? Math.round((ayatHafal / totalAyat) * 100) : 0;

        /**
         * 5️⃣ Push ke hasil akhir
         */
        result.push({
          peserta_id: p.id,
          nama_peserta: p.nama,
          surah: hafalan?.nama_surah || "-",
          ayat_terakhir: ayatHafal,
          total_ayat: totalAyat,
          prosentase,
        });
      }

      res.json(result);
    } catch (err) {
      console.error("GET peserta-progress error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
