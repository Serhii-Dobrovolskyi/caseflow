const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "disconnected";

  res.json({
    status: "ok",
    message: "API is healthy",
    db: dbStatus
  });
});

module.exports = router;
