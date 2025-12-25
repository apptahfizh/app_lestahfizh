// src/routes/pesertaRoutes.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/db");
const auth = require("../middlewares/auth");

/* =========================================================
   GET - Semua peserta (untuk tabel peserta.html & dashboard)
========================================================= */
router.get("/", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, nama, create_at FROM peserta_didik ORDER BY id DESC")
      .all();

    // List kosong bukan error
    return res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal load peserta", error: err.message });
  }
});

/* =========================================================
   GET - Simple list (dropdown)
========================================================= */
router.get("/simple", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, nama FROM peserta_didik ORDER BY nama ASC")
      .all();

    return res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal load peserta", error: err.message });
  }
});

/* =========================================================
   GET - By ID
========================================================= */
router.get("/:id", auth(["admin", "ustadz", "ortu"]), (req, res) => {
  const id = req.params.id;

  try {
    const row = db
      .prepare("SELECT id, nama, create_at FROM peserta_didik WHERE id = ?")
      .get(id);

    if (!row)
      return res.status(404).json({ message: "Peserta tidak ditemukan" });

    res.json(row);
  } catch (err) {
    res.status(500).json({ message: "Gagal load peserta", error: err.message });
  }
});

/* =========================================================
   POST - Tambah peserta
========================================================= */
router.post("/", auth(["admin", "ustadz"]), (req, res) => {
  const { nama } = req.body;

  if (!nama)
    return res.status(400).json({ message: "Nama peserta wajib diisi" });

  try {
    const info = db
      .prepare(
        "INSERT INTO peserta_didik (nama, create_at) VALUES (?, DATETIME('now'))"
      )
      .run(nama);

    res.json({ message: "Peserta ditambahkan", id: info.lastInsertRowid });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal tambah peserta", error: err.message });
  }
});

/* =========================================================
   PUT - Update peserta
========================================================= */
router.put("/:id", auth(["admin", "ustadz"]), (req, res) => {
  const id = req.params.id;
  const { nama } = req.body;

  if (!nama)
    return res.status(400).json({ message: "Nama peserta wajib diisi" });

  try {
    const info = db
      .prepare("UPDATE peserta_didik SET nama = ? WHERE id = ?")
      .run(nama, id);

    if (info.changes === 0)
      return res.status(404).json({ message: "Peserta tidak ditemukan" });

    res.json({ message: "Peserta diperbarui" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal update peserta", error: err.message });
  }
});

/* =========================================================
   DELETE - Hapus peserta
========================================================= */
router.delete("/:id", auth(["admin", "ustadz"]), (req, res) => {
  const id = req.params.id;

  try {
    const info = db.prepare("DELETE FROM peserta_didik WHERE id = ?").run(id);

    if (info.changes === 0)
      return res.status(404).json({ message: "Peserta tidak ditemukan" });

    res.json({ message: "Peserta dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal hapus peserta", error: err.message });
  }
});

module.exports = router;
