// src/routes/hafalanRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { db } = require("../config/db");

// =======================
// Query: last hafalan per peserta (harus menyertakan peserta_id)
// =======================
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
  JOIN surah s ON h.surah = s.id
  ORDER BY h.id DESC
`;

/* =========================================================
   GET - DATA TABLE (SERVER-SIDE)
   /api/hafalan/all
   - ORTU hanya bisa lihat hafalan anaknya sendiri
========================================================= */
router.get("/all", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Math.max(0, Number(req.query.start) || 0);
    const length = Math.min(100, Number(req.query.length) || 10);

    const search = req.query?.search?.value || "";
    const tanggal_mulai = req.query.tanggal_mulai || "";
    const tanggal_selesai = req.query.tanggal_selesai || "";
    const peserta = req.query.peserta || "";

    let where = "WHERE 1=1";
    const params = {};

    // Jika ORTU, filter peserta_id (menggunakan named parameter)
    if (req.user && req.user.role === "ortu") {
      where += " AND h.peserta_id = @peserta_id";
      params.peserta_id = req.user.peserta_id;
    }

    if (search) {
      where +=
        " AND (pd.nama LIKE @search OR CAST(h.surah AS TEXT) LIKE @search OR h.keterangan LIKE @search)";
      params.search = `%${search}%`;
    }

    if (tanggal_mulai) {
      where += " AND date(h.tanggal) >= date(@tgl_mulai)";
      params.tgl_mulai = tanggal_mulai;
    }

    if (tanggal_selesai) {
      where += " AND date(h.tanggal) <= date(@tgl_selesai)";
      params.tgl_selesai = tanggal_selesai;
    }

    if (peserta && (!req.user || req.user.role !== "ortu")) {
      where += " AND pd.nama LIKE @peserta";
      params.peserta = `%${peserta}%`;
    }

    const total = db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM hafalan h LEFT JOIN peserta_didik pd ON h.peserta_id = pd.id`
      )
      .get().cnt;

    const surah = req.query.surah || "";

    if (surah) {
      where += " AND h.surah = @surah";
      params.surah = surah;
    }

    let filtered = 0;
    try {
      filtered = db
        .prepare(
          `SELECT COUNT(*) AS cnt
           FROM hafalan h
           LEFT JOIN peserta_didik pd ON h.peserta_id = pd.id
           ${where}`
        )
        .get(params).cnt;
    } catch (err) {
      console.log("Filtered error:", err);
      filtered = 0;
    }

    const rows = db
      .prepare(
        `SELECT 
      h.id,
      h.tanggal,
      pd.nama AS peserta,
      s.nama_surah AS surah_nama,
      s.jumlah_ayat AS total_ayat,   -- ✅ TAMBAHKAN INI
      h.ayat_hafal,
      h.ayat_setor,
      h.keterangan,
      h.peserta_id
     FROM hafalan h
     LEFT JOIN peserta_didik pd ON h.peserta_id = pd.id
     LEFT JOIN surah s ON h.surah = s.id
     ${where}
     ORDER BY h.id DESC
     LIMIT @limit OFFSET @offset`
      )
      .all({
        ...params,
        limit: length,
        offset: start,
      });

    res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data: rows,
    });
  } catch (err) {
    console.log("Error /hafalan/all:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================================================
   GET - TABEL HAFALAN (RINGKAS)
   /api/hafalan/table -> redirect ke /last
   ORTU filter otomatis
========================================================= */
router.get("/table", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  const user = req.user;

  let rows;
  if (user.role === "ortu") {
    rows = db
      .prepare(
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
      JOIN surah s ON h.surah = s.id
      WHERE h.peserta_id = ?
      ORDER BY h.id DESC
      LIMIT 1
    `
      )
      .get(user.peserta_id);
  } else {
    rows = db.prepare(getLastHafalanQuery).all();
  }

  res.json(rows);
});

/* =========================================================
   GET - Hafalan terakhir
   ORTU hanya lihat hafalan anaknya sendiri
========================================================= */
router.get("/last", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const user = req.user || {};
    let row;

    if (user.role === "ortu") {
      row = db
        .prepare(
          `
        SELECT 
          h.id,
          h.peserta_id,
          p.nama AS peserta,
          h.tanggal,
          s.nama_surah AS surah_nama,
          h.ayat_hafal,
          s.jumlah_ayat AS total_ayat,
          h.keterangan
        FROM hafalan h
        JOIN peserta_didik p ON h.peserta_id = p.id
        JOIN surah s ON h.surah = s.id
        WHERE h.peserta_id = ?
        ORDER BY h.id DESC
        LIMIT 1
      `
        )
        .get([user.peserta_id]);
    } else {
      row = db
        .prepare(
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
        JOIN surah s ON h.surah = s.id
        ORDER BY h.id DESC
        LIMIT 1
      `
        )
        .get();
    }

    res.json([row]);
  } catch (err) {
    console.log("Error /hafalan/last:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================================================
   GET - Progres hafalan per peserta (Line Chart)
========================================================= */
router.get("/progres", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const user = req.user || {};
    let rows;

    if (user.role === "ortu") {
      rows = db
        .prepare(
          `SELECT 
             h.id,
             h.peserta_id,
             p.nama AS peserta,
             h.tanggal,
             s.nama_surah AS surah_nama,
             h.ayat_hafal,
             s.jumlah_ayat AS total_ayat
           FROM hafalan h
           JOIN peserta_didik p ON h.peserta_id = p.id
           JOIN surah s ON h.surah = s.id
           WHERE h.peserta_id = ?
           ORDER BY h.tanggal ASC`
        )
        .all([user.peserta_id]);
    } else {
      rows = db
        .prepare(
          `SELECT 
             h.id,
             h.peserta_id,
             p.nama AS peserta,
             h.tanggal,
             s.nama_surah AS surah_nama,
             h.ayat_hafal,
             s.jumlah_ayat AS total_ayat
           FROM hafalan h
           JOIN peserta_didik p ON h.peserta_id = p.id
           JOIN surah s ON h.surah = s.id
           ORDER BY h.tanggal ASC`
        )
        .all();
    }

    res.json(rows);
  } catch (err) {
    console.log("Error /hafalan/progres:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================================================
   GET - By ID
   ORTU hanya bisa lihat hafalan anaknya sendiri
========================================================= */
router.get("/:id", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  const id = req.params.id;

  let sql = `
    SELECT
      h.id,
      h.peserta_id,
      p.nama AS peserta_nama,
      h.tanggal,
      h.surah,
      h.ayat_hafal,
      h.ayat_setor,
      h.mulai_setor_ayat,
      h.selesai_setor_ayat,
      h.keterangan
    FROM hafalan h
    JOIN peserta_didik p ON h.peserta_id = p.id
    WHERE h.id = ?
  `;

  const row = db.prepare(sql).get(id);

  if (!row) return res.status(404).json({ message: "Hafalan tidak ditemukan" });

  // Cek ORTU, harus peserta_id sama
  if (
    req.user &&
    req.user.role === "ortu" &&
    row.peserta_id !== req.user.peserta_id
  ) {
    return res
      .status(403)
      .json({ message: "Tidak berhak mengakses hafalan ini" });
  }

  res.json(row);
});

/* =========================================================
   POST - Tambah Hafalan
   Hanya admin & ustadz
========================================================= */
router.post("/", auth(["admin", "ustadz"]), (req, res) => {
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

  if (!peserta_id || !surah)
    return res.status(400).json({ message: "peserta_id & surah wajib diisi" });

  if (isNaN(peserta_id))
    return res.status(400).json({ message: "peserta_id harus angka" });
  if (isNaN(surah))
    return res.status(400).json({ message: "surah harus angka" });
  if (tanggal && isNaN(Date.parse(tanggal)))
    return res
      .status(400)
      .json({ message: "Format tanggal tidak valid (YYYY-MM-DD)" });

  try {
    const info = db
      .prepare(
        `INSERT INTO hafalan 
         (peserta_id, tanggal, surah, ayat_hafal, ayat_setor, mulai_setor_ayat, selesai_setor_ayat, keterangan)
         VALUES (?, COALESCE(?, DATE('now')), ?, ?, ?, ?, ?, ?)`
      )
      .run(
        peserta_id,
        tanggal || null,
        surah,
        ayat_hafal || null,
        ayat_setor || null,
        mulai_setor_ayat || null,
        selesai_setor_ayat || null,
        keterangan || null
      );

    res.json({ message: "Hafalan ditambahkan", id: info.lastInsertRowid });
  } catch (err) {
    console.log("Error POST /hafalan:", err);
    res
      .status(400)
      .json({ message: "Gagal tambah hafalan", error: err.message });
  }
});

/* =========================================================
   PUT - Update Hafalan
   Hanya admin & ustadz
========================================================= */
router.put("/:id", auth(["admin", "ustadz"]), (req, res) => {
  const id = req.params.id;
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

  if (!peserta_id || !surah)
    return res.status(400).json({ message: "peserta_id & surah wajib diisi" });

  if (isNaN(peserta_id))
    return res.status(400).json({ message: "peserta_id harus angka" });
  if (isNaN(surah))
    return res.status(400).json({ message: "surah harus angka" });
  if (tanggal && isNaN(Date.parse(tanggal)))
    return res
      .status(400)
      .json({ message: "Format tanggal tidak valid (YYYY-MM-DD)" });

  try {
    const info = db
      .prepare(
        `UPDATE hafalan
         SET peserta_id = ?, tanggal = COALESCE(?, tanggal), surah = ?, ayat_hafal = ?, 
             ayat_setor = ?, mulai_setor_ayat = ?, selesai_setor_ayat = ?, keterangan = ?
         WHERE id = ?`
      )
      .run(
        peserta_id,
        tanggal || null,
        surah,
        ayat_hafal || null,
        ayat_setor || null,
        mulai_setor_ayat || null,
        selesai_setor_ayat || null,
        keterangan || null,
        id
      );

    if (info.changes === 0)
      return res.status(404).json({ message: "Hafalan tidak ditemukan" });

    res.json({ message: "Hafalan diperbarui" });
  } catch (err) {
    console.log("Error PUT /hafalan/:id", err);
    res
      .status(400)
      .json({ message: "Gagal update hafalan", error: err.message });
  }
});

/* =========================================================
   DELETE Hafalan
   Hanya admin & ustadz
========================================================= */
router.delete("/:id", auth(["admin", "ustadz"]), (req, res) => {
  const id = req.params.id;
  try {
    const info = db.prepare("DELETE FROM hafalan WHERE id = ?").run(id);
    if (info.changes === 0)
      return res.status(404).json({ message: "Hafalan tidak ditemukan" });

    res.json({ message: "Hafalan dihapus" });
  } catch (err) {
    console.log("Error DELETE /hafalan/:id", err);
    res
      .status(500)
      .json({ message: "Error menghapus hafalan", error: err.message });
  }
});

module.exports = router;
