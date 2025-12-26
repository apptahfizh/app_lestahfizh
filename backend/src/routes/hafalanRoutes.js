// src/routes/hafalanRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { db } = require("../config/db");

/* =========================================================
   QUERY: HAFALAN TERAKHIR PER PESERTA
========================================================= */
const getLastHafalanQuery = `
  SELECT 
    h.id,
    h.peserta_id,
    p.nama AS peserta,
    h.tanggal,
    s.nama_surah AS surah_nama,
    h.ayat_hafal,
    h.ayat_setor,
    h.keterangan
  FROM hafalan h
  JOIN (
    SELECT peserta_id, MAX(id) AS last_id
    FROM hafalan
    GROUP BY peserta_id
  ) x ON h.id = x.last_id
  JOIN peserta_didik p ON h.peserta_id = p.id
  JOIN surah s ON s.id = h.surah::int
  ORDER BY h.id DESC
`;

/* =========================================================
   GET - DATA TABLE (SERVER SIDE)
   /api/hafalan/all
========================================================= */
router.get("/all", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Math.max(0, Number(req.query.start) || 0);
    const length = Math.min(100, Number(req.query.length) || 10);

    const search = req.query?.search?.value || "";
    const tanggal_mulai = req.query.tanggal_mulai || "";
    const tanggal_selesai = req.query.tanggal_selesai || "";
    const peserta = req.query.peserta || "";
    const surah = req.query.surah || "";

    let where = "WHERE 1=1";
    const values = [];
    let idx = 1;

    // ORTU: hanya anak sendiri
    if (req.user?.role === "ortu") {
      where += ` AND h.peserta_id = $${idx++}`;
      values.push(req.user.peserta_id);
    }

    if (search) {
      where += ` AND (pd.nama ILIKE $${idx} OR CAST(h.surah AS TEXT) ILIKE $${idx} OR h.keterangan ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    if (tanggal_mulai) {
      where += ` AND h.tanggal >= $${idx++}`;
      values.push(tanggal_mulai);
    }

    if (tanggal_selesai) {
      where += ` AND h.tanggal <= $${idx++}`;
      values.push(tanggal_selesai);
    }

    if (peserta && req.user?.role !== "ortu") {
      where += ` AND pd.nama ILIKE $${idx++}`;
      values.push(`%${peserta}%`);
    }

    if (surah) {
      where += ` AND h.surah = $${idx++}`;
      values.push(surah);
    }

    // total semua data
    const totalResult = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM hafalan`
    );
    const recordsTotal = totalResult.rows[0].cnt;

    // total setelah filter
    const filteredResult = await db.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM hafalan h
      LEFT JOIN peserta_didik pd ON h.peserta_id = pd.id
      ${where}
    `,
      values
    );
    const recordsFiltered = filteredResult.rows[0].cnt;

    // data utama
    const dataResult = await db.query(
      `
      SELECT 
        h.id,
        h.tanggal,
        pd.nama AS peserta,
        s.nama_surah AS surah_nama,
        s.jumlah_ayat AS total_ayat,
        h.ayat_hafal,
        h.ayat_setor,
        h.keterangan,
        h.peserta_id
      FROM hafalan h
      LEFT JOIN peserta_didik pd ON h.peserta_id = pd.id
      LEFT JOIN surah s ON s.id = h.surah::int
      ${where}
      ORDER BY h.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `,
      [...values, length, start]
    );

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data: dataResult.rows,
    });
  } catch (err) {
    console.error("Error /hafalan/all:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================================================
   GET - TABEL HAFALAN RINGKAS
========================================================= */
router.get("/table", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  try {
    if (req.user.role === "ortu") {
      const result = await db.query(
        `
        SELECT 
          h.id,
          h.peserta_id,
          p.nama AS peserta,
          h.tanggal,
          s.nama_surah AS surah_nama,
          h.ayat_hafal,
          h.ayat_setor,
          h.keterangan
        FROM hafalan h
        JOIN peserta_didik p ON h.peserta_id = p.id
        JOIN surah s ON s.id = h.surah::int
        WHERE h.peserta_id = $1
        ORDER BY h.id DESC
        LIMIT 1
      `,
        [req.user.peserta_id]
      );
      return res.json(result.rows);
    }

    const result = await db.query(getLastHafalanQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error /hafalan/table:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   GET - HAFALAN TERAKHIR
========================================================= */
router.get("/last", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  try {
    let result;

    if (req.user.role === "ortu") {
      result = await db.query(
        `
        SELECT 
          h.id,
          h.peserta_id,
          p.nama AS peserta,
          h.tanggal,
          s.nama_surah AS surah_nama,
          s.jumlah_ayat AS total_ayat,
          h.ayat_hafal,
          h.keterangan
        FROM hafalan h
        JOIN peserta_didik p ON h.peserta_id = p.id
        JOIN surah s ON s.id = h.surah::int
        WHERE h.peserta_id = $1
        ORDER BY h.id DESC
        LIMIT 1
      `,
        [req.user.peserta_id]
      );
    } else {
      result = await db.query(
        `
        SELECT 
          h.id,
          h.peserta_id,
          p.nama AS peserta,
          h.tanggal,
          s.nama_surah AS surah_nama,
          s.jumlah_ayat AS total_ayat,
          h.ayat_hafal,
          h.keterangan
        FROM hafalan h
        JOIN peserta_didik p ON h.peserta_id = p.id
        JOIN surah s ON s.id = h.surah::int
        ORDER BY h.id DESC
        LIMIT 1
      `
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error /hafalan/last:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   POST - TAMBAH HAFALAN
========================================================= */
router.post("/", auth(["admin", "ustadz"]), async (req, res) => {
  const {
    peserta_id,
    surah,
    ayat_hafal,
    ayat_setor,
    mulai_setor_ayat,
    selesai_setor_ayat,
    keterangan,
    tanggal,
  } = req.body || {};

  try {
    const result = await db.query(
      `
      INSERT INTO hafalan
      (peserta_id, tanggal, surah, ayat_hafal, ayat_setor, mulai_setor_ayat, selesai_setor_ayat, keterangan)
      VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        peserta_id,
        tanggal,
        surah,
        ayat_hafal,
        ayat_setor,
        mulai_setor_ayat,
        selesai_setor_ayat,
        keterangan,
      ]
    );

    res.json({ message: "Hafalan ditambahkan", id: result.rows[0].id });
  } catch (err) {
    console.error("Error POST /hafalan:", err);
    res.status(400).json({ message: "Gagal tambah hafalan" });
  }
});

/* =========================================================
   PUT - UPDATE HAFALAN
========================================================= */
router.put("/:id", auth(["admin", "ustadz"]), async (req, res) => {
  try {
    const result = await db.query(
      `
      UPDATE hafalan
      SET peserta_id = $1,
          tanggal = COALESCE($2, tanggal),
          surah = $3,
          ayat_hafal = $4,
          ayat_setor = $5,
          mulai_setor_ayat = $6,
          selesai_setor_ayat = $7,
          keterangan = $8
      WHERE id = $9
    `,
      [
        req.body.peserta_id,
        req.body.tanggal,
        req.body.surah,
        req.body.ayat_hafal,
        req.body.ayat_setor,
        req.body.mulai_setor_ayat,
        req.body.selesai_setor_ayat,
        req.body.keterangan,
        req.params.id,
      ]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Hafalan tidak ditemukan" });

    res.json({ message: "Hafalan diperbarui" });
  } catch (err) {
    console.error("Error PUT /hafalan:", err);
    res.status(400).json({ message: "Gagal update hafalan" });
  }
});

/* =========================================================
   DELETE - HAPUS HAFALAN
========================================================= */
router.delete("/:id", auth(["admin", "ustadz"]), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM hafalan WHERE id = $1", [
      req.params.id,
    ]);

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Hafalan tidak ditemukan" });

    res.json({ message: "Hafalan dihapus" });
  } catch (err) {
    console.error("Error DELETE /hafalan:", err);
    res.status(500).json({ message: "Error menghapus hafalan" });
  }
});

module.exports = router;
