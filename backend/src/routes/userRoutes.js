// src/routes/userRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { db } = require("../config/db"); // pg Pool

// DEFAULT PASSWORD UNTUK RESET
const DEFAULT_PASSWORD = "12345678";

/*
CATATAN MIGRASI
- Migrasi penuh ke PostgreSQL (pg)
- Menggunakan async/await & Pool
*/

/* =========================================================
   GET - Semua user
   Sertakan peserta_id & nama peserta (jika ada)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.username,
        u.role,
        u.created_at,
        u.peserta_id,
        pd.nama AS peserta_nama
      FROM users u
      LEFT JOIN peserta_didik pd ON u.peserta_id = pd.id
      ORDER BY u.id DESC
    `);

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      message: "Error mengambil data user",
      error: err.message,
    });
  }
});

/* =========================================================
   GET - User by ID
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        u.id,
        u.username,
        u.role,
        u.created_at,
        u.peserta_id,
        pd.nama AS peserta_nama
      FROM users u
      LEFT JOIN peserta_didik pd ON u.peserta_id = pd.id
      WHERE u.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({
      message: "Error mengambil user",
      error: err.message,
    });
  }
});

/* =========================================================
   POST - Tambah user baru
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { username, password, role, peserta_id } = req.body || {};

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password dan role wajib diisi",
      });
    }

    // Validasi role ORTU wajib punya peserta_id
    if (role === "ortu" && !peserta_id) {
      return res
        .status(400)
        .json({ message: "Role ORTU harus punya peserta_id" });
    }

    // Cek username sudah ada
    const cekUser = await db.query("SELECT id FROM users WHERE username = $1", [
      username,
    ]);

    if (cekUser.rows.length > 0) {
      return res.status(400).json({ message: "Username sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // peserta_id hanya untuk ORTU
    const pesertaValue = role === "ortu" ? peserta_id : null;

    const insertResult = await db.query(
      `
      INSERT INTO users
        (username, password_hash, role, created_at, peserta_id)
      VALUES
        ($1, $2, $3, NOW(), $4)
      RETURNING id
      `,
      [username, hashedPassword, role, pesertaValue]
    );

    return res.json({
      id: insertResult.rows[0].id,
      username,
      role,
      peserta_id: pesertaValue,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================================================
   PUT - Reset password user (ke DEFAULT_PASSWORD)
========================================================= */
router.put("/reset/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const result = await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json({
      message: `Password user di-reset ke default: ${DEFAULT_PASSWORD}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================================================
   PUT - Update password user
========================================================= */
router.put("/update-password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json({ message: "Password berhasil diperbarui" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================================================
   PUT - Update user (username, role, peserta_id)
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, peserta_id } = req.body || {};

    if (!username || !role) {
      return res.status(400).json({ message: "Username & role wajib diisi" });
    }

    // Validasi ORTU wajib punya peserta_id
    if (role === "ortu" && !peserta_id) {
      return res
        .status(400)
        .json({ message: "Role ORTU harus punya peserta_id" });
    }

    const pesertaValue = role === "ortu" ? peserta_id : null;

    const result = await db.query(
      `
      UPDATE users
      SET username = $1,
          role = $2,
          peserta_id = $3
      WHERE id = $4
      `,
      [username, role, pesertaValue, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json({
      message: "User berhasil diupdate",
      username,
      role,
      peserta_id: pesertaValue,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error update user",
      error: err.message,
    });
  }
});

/* =========================================================
   DELETE - Hapus user
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    return res.status(500).json({
      message: "Error menghapus user",
      error: err.message,
    });
  }
});

module.exports = router;
