require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

// 카드 생성
router.post("/create", async (req, res) => {
  try {
    const { db } = req.app;
    const { token, userData, contentData } = req.body;
    const { id, date, imageURL, quote, speaker } = contentData;
    // 토큰이 유효한지 확인
    const { userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId)
      res.status(500).json({ success: false, reason: "expired token" });

    // 카드 데이터 생성
    const newQuoteCardDBData = {
      userData,
      contentData: {
        id,
        date,
        imageURL,
        quote,
        speaker,
        fireCount: 0,
        fireUserList: [],
      },
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
        userQuoteList: [...userQuoteList, contentData.id],
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

// 카드 리스트 리턴
router.get("/list", async (req, res) => {
  try {
    const { sort, page } = req.query;
    const { db } = req.app;
    const cursors = await db
      .collection("quoteCard")
      .find()
      .sort(sort === "최신순" ? { _id: -1 } : { fireCount: -1, _id: -1 });
    const count = await cursors.count();
    const cardListData = await cursors
      .skip((Number(page) - 1) * 10)
      .limit(10)
      .toArray();
    const isLast = (Number(page) - 1) * 10 + 10 >= count;
    const data = {
      isLast,
      cardListData,
    };
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.log("/quoteCard/list error", err);
    return res.status(500).json({ success: false, reason: err });
  }
});
module.exports = router;
