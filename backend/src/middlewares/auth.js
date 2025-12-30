// src/middlewares/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (roles = []) {
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Token tidak ada" });

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Format token salah. Gunakan: Bearer <token>",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // cek role
      if (roles.length && !roles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Akses ditolak (role tidak cocok)" });
      }

      next();
    } catch (err) {
      console.log("JWT Error:", err.message);
      return res
        .status(401)
        .json({ message: "Token tidak valid", error: err.message });
    }
  };
};
