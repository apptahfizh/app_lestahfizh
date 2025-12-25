const express = require("express");
const router = express.Router();
const { db } = require("../config/db"); // db ini better-sqlite3

// GET semua surah
router.get("/", (req, res) => {
  const sql = "SELECT id, nama_surah, jumlah_ayat FROM surah ORDER BY id ASC";
  try {
    const rows = db.prepare(sql).all(); // <-- better-sqlite3 style
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
