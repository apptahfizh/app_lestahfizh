// src/routes/userRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

// DEFAULT PASSWORD UNTUK RESET
const DEFAULT_PASSWORD = "12345678";

/*
  Catatan:
  - File ini mengakses database via req.app.locals.db
  - Pastikan server app.js sudah set: app.locals.db = db;
*/

// =======================================
// GET ALL USERS (sertakan peserta_id & nama peserta jika ada)
// =======================================
router.get("/", (req, res) => {
  const db = req.app.locals.db;

  const sql = `
    SELECT u.id, u.username, u.role, u.created_at, u.peserta_id,
           pd.nama AS peserta_nama
    FROM users u
    LEFT JOIN peserta_didik pd ON u.peserta_id = pd.id
    ORDER BY u.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error mengambil data user", error: err.message });
    }
    res.json(rows);
  });
});

// =======================================
// ADD NEW USER
// =======================================
router.post("/", async (req, res) => {
  try {
    const { username, password, role, peserta_id } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password dan role wajib diisi",
      });
    }

    // Validasi ORTU wajib punya peserta_id
    if (role === "ortu" && !peserta_id) {
      return res
        .status(400)
        .json({ message: "Role ORTU harus punya peserta_id" });
    }

    const db = req.app.locals.db;

    // Cek username sudah ada
    db.get(
      "SELECT id FROM users WHERE username = ?",
      [username],
      async (err, row) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Error cek username", error: err.message });
        if (row)
          return res.status(400).json({ message: "Username sudah terdaftar" });

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Role lain, peserta_id = null
        const pesertaValue = role === "ortu" && peserta_id ? peserta_id : null;

        db.run(
          `INSERT INTO users (username, password_hash, role, created_at, peserta_id)
         VALUES (?, ?, ?, datetime('now'), ?)`,
          [username, hashedPassword, role, pesertaValue],
          function (err) {
            if (err)
              return res
                .status(500)
                .json({ message: "Error menambah user", error: err.message });

            res.json({
              id: this.lastID,
              username,
              role,
              peserta_id: pesertaValue,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =======================================
// RESET PASSWORD USER
// =======================================
router.put("/reset/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    db.run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashedPassword, id],
      function (err) {
        if (err)
          return res
            .status(500)
            .json({ message: "Error reset password", error: err.message });
        if (this.changes === 0)
          return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({
          message: `Password user di-reset ke default: ${DEFAULT_PASSWORD}`,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =======================================
// UPDATE PASSWORD USER
// =======================================
router.put("/update-password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const db = req.app.locals.db;
    const hashed = await bcrypt.hash(password, 10);

    db.run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashed, id],
      function (err) {
        if (err)
          return res
            .status(500)
            .json({ message: "Error update password", error: err.message });
        if (this.changes === 0)
          return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "Password berhasil diperbarui" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =======================================
// UPDATE USER (USERNAME + ROLE + PESERTA_ID)
// =======================================
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { username, role, peserta_id } = req.body;

  if (!username || !role)
    return res.status(400).json({ message: "Username & role wajib diisi" });

  // Validasi ORTU wajib punya peserta_id
  if (role === "ortu" && !peserta_id) {
    return res
      .status(400)
      .json({ message: "Role ORTU harus punya peserta_id" });
  }

  const db = req.app.locals.db;
  const pesertaValue = role === "ortu" && peserta_id ? peserta_id : null;

  db.run(
    "UPDATE users SET username = ?, role = ?, peserta_id = ? WHERE id = ?",
    [username, role, pesertaValue, id],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ message: "Error update user", error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ message: "User tidak ditemukan" });

      res.json({
        message: "User berhasil diupdate",
        username,
        role,
        peserta_id: pesertaValue,
      });
    }
  );
});

// =======================================
// DELETE USER
// =======================================
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err)
      return res
        .status(500)
        .json({ message: "Error menghapus user", error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    res.json({ message: "User berhasil dihapus" });
  });
});

module.exports = router;
