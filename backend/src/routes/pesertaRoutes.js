// src/routes/pesertaRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db"); // pg Pool
const auth = require("../middlewares/auth");

/* =========================================================
   GET - Semua peserta
   Digunakan untuk tabel peserta.html & dashboard
========================================================= */
router.get("/", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  try {
    /*
    -----------------------------------------------------
    Ambil seluruh peserta, urut terbaru
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      SELECT id, nama, create_at
      FROM peserta_didik
      ORDER BY id DESC
      `
    );

    // List kosong bukan error
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      message: "Gagal load peserta",
      error: err.message,
    });
  }
});

/* =========================================================
   GET - Simple list (dropdown)
========================================================= */
router.get("/simple", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  try {
    /*
    -----------------------------------------------------
    Data ringan untuk dropdown
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      SELECT id, nama
      FROM peserta_didik
      ORDER BY nama ASC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      message: "Gagal load peserta",
      error: err.message,
    });
  }
});

/* =========================================================
   GET - Peserta By ID
========================================================= */
router.get("/:id", auth(["admin", "ustadz", "ortu"]), async (req, res) => {
  const id = req.params.id;

  try {
    /*
    -----------------------------------------------------
    Ambil peserta berdasarkan ID
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      SELECT id, nama, create_at
      FROM peserta_didik
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Peserta tidak ditemukan",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({
      message: "Gagal load peserta",
      error: err.message,
    });
  }
});

/* =========================================================
   POST - Tambah peserta
   Hanya admin & ustadz
========================================================= */
router.post("/", auth(["admin", "ustadz"]), async (req, res) => {
  console.log("BODY:", req.body); // 🔥 TAMBAH INI
  const { nama } = req.body;

  if (!nama) {
    return res.status(400).json({
      message: "Nama peserta wajib diisi",
    });
  }

  try {
    /*
    -----------------------------------------------------
    Insert peserta baru
    - DATETIME('now') ➜ NOW() PostgreSQL
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      INSERT INTO peserta_didik (nama, create_at)
      VALUES ($1, NOW())
      RETURNING id
      `,
      [nama]
    );

    return res.json({
      message: "Peserta ditambahkan",
      id: result.rows[0].id,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Gagal tambah peserta",
      error: err.message,
    });
  }
});

/* =========================================================
   PUT - Update peserta
   Hanya admin & ustadz
========================================================= */
router.put("/:id", auth(["admin", "ustadz"]), async (req, res) => {
  const id = req.params.id;
  const { nama } = req.body;

  if (!nama) {
    return res.status(400).json({
      message: "Nama peserta wajib diisi",
    });
  }

  try {
    /*
    -----------------------------------------------------
    Update nama peserta
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      UPDATE peserta_didik
      SET nama = $1
      WHERE id = $2
      `,
      [nama, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Peserta tidak ditemukan",
      });
    }

    return res.json({
      message: "Peserta diperbarui",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Gagal update peserta",
      error: err.message,
    });
  }
});

/* =========================================================
   DELETE - Hapus peserta
   Hanya admin & ustadz
========================================================= */
router.delete("/:id", auth(["admin", "ustadz"]), async (req, res) => {
  const id = req.params.id;

  try {
    /*
    -----------------------------------------------------
    Hapus peserta berdasarkan ID
    -----------------------------------------------------
    */
    const result = await db.query(
      `
      DELETE FROM peserta_didik
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Peserta tidak ditemukan",
      });
    }

    return res.json({
      message: "Peserta dihapus",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Gagal hapus peserta",
      error: err.message,
    });
  }
});

module.exports = router;
