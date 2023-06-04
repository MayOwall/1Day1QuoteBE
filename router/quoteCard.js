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

router.post("/fire", async (req, res) => {
  try {
    // userId, JWT 인증
    const { cardId, fire } = req.body;
    const { authorization: token } = req.headers;
    const { id: userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId) {
      res.status(401).json({ success: false, reason: "unvalid token" });
      return;
    }

    // 카드 fire count 및 fireUserList 업데이트
    const { db } = req.app;
    const filter = {
      "contentData.id": cardId,
    };
    const updateValue =
      fire === "fireUp"
        ? {
            $inc: { "contentData.fireCount": 1 },
            $push: { "contentData.fireUserList": userId },
          }
        : {
            $inc: { "contentData.fireCount": -1 },
            $pull: { "contentData.fireUserList": userId },
          };
    await db.collection("quoteCard").updateOne(filter, updateValue);

    // 서버로 결과 전송 (success)
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("/quoteCard/fire error", err);
    // 서버로 결과 전송 (success)
    return res.status(500).json({ success: false, reason: err });
  }
});
module.exports = router;

router.post("/bookmark", async (req, res) => {
  try {
    //cardId, bookmark, userId 인증 확인
    const { cardId, bookmark } = req.body;
    const { authorization: token } = req.headers;
    const { id: userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId) {
      res.status(401).json({ success: false, reason: "unvalid token" });
      return;
    }

    // db에 북마크 데이터 저장
    const { db } = req.app;
    const filter = {
      id: userId,
    };
    const updateValue =
      bookmark === "addBookmark"
        ? {
            $inc: { bookmarkCount: 1 },
            $push: { bookmarkList: cardId },
          }
        : {
            $inc: { bookmarkCount: -1 },
            $pull: { bookmarkList: cardId },
          };
    await db.collection("auth").updateOne(filter, updateValue);

    // 클라이언트로 결과 전송 (success)
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("/quoteCard/bookmark error", err);
    // 클라이언트로 결과 전송 (success)
    return res.status(500).json({ success: false, reason: err });
  }
});
