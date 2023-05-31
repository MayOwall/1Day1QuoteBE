require("dotenv/config");
const express = require("express");
const router = express.Router();

router.get("/:id", async (req, res) => {
  const { db } = req.app;
  const { id } = req.params;
  const userDBData = await db
    .collection("auth")
    .findOne({ userId: id })
    .catch(() =>
      res.status(500).jsoin({ success: false, reason: "DB 서버 에러" })
    );

  res.header("Access-Control-Allow-Origin", "*");
  if (userDBData) {
    res.status(200).json({ success: true, userDBData });
    return;
  }

  if (!userDBData) {
    res.status(200).json({ success: false, reason: "no such userId" });
    return;
  }
});

module.exports = router;
