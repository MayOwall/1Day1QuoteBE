require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

router.post("/create", async (req, res) => {
  try {
    const { db } = req.app;
    const { token, cardData } = req.body;

    // 토큰이 유효한지 확인
    const { userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId)
      res.status(500).json({ success: false, reason: "expired token" });

    // 카드 데이터 생성
    const newQuoteCardDBData = {
      _id: cardData._id,
      quote: cardData.quote,
      speaker: cardData.speaker,
      imageURL: cardData.imageURL,
      fireCount: 0,
      fireUserList: [],
    };
    await db.collection("quoteCard").insertOne(newQuoteCardDBData);

    let { userQuoteCount, userQuoteList } = await db
      .collection("auth")
      .findOne({ userId })
      .catch(() =>
        res
          .status(500)
          .json({ success: false, reason: "DB 로그인 APi 도중 에러" })
      );

    const myQuery = { userId };
    const newValues = {
      $set: {
        userQuoteCount: userQuoteCount + 1,
        userQuoteList: [...userQuoteList, cardData._id],
      },
    };

    await db.collection("auth").updateOne(myQuery, newValues, (err) => {
      if (err) throw err;
    });

    res.status(200).json({
      success: true,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, reason: "db error" });
  }
});

module.exports = router;
