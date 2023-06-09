require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

// 카드 생성
router.post("/create", async (req, res) => {
  try {
    const { db } = req.app;
    const { authorization: token } = req.headers;
    const { userData, contentData } = req.body;
    const { id, date, imageURL, quote, speaker } = contentData;
    // 토큰이 유효한지 확인
    const { id: userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId)
      res.status(500).json({ success: false, reason: "unvalid token" });

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

    // 카드 관련 유저 데이터 업데이트
    const filter = { id: userId };
    const updateValue = {
      $inc: { quoteCount: 1 },
      $push: { quoteList: contentData.id },
    };
    await db.collection("auth").updateOne(filter, updateValue, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ success: true });
  } catch (e) {
    e;
    res.status(500).json({ success: false, reason: "db error" });
  }
});

// 카드 리스트 리턴
router.get("/list", async (req, res) => {
  try {
    const { sort, page } = req.query;
    const { authorization: token } = req.headers;
    let userId = null;
    if (token) {
      userId = jwt.verify(token, JWT_SECRET_KEY).id;
    }

    const { db } = req.app;
    const sortOption =
      sort === "최신순"
        ? { _id: -1 }
        : { "contentData.fireCount": -1, _id: -1 };

    const cursors = await db.collection("quoteCard").find().sort(sortOption);
    const count = await cursors.count();
    const isLast = (Number(page) - 1) * 10 + 10 >= count;
    let cardListData = await cursors
      .skip((Number(page) - 1) * 10)
      .limit(10)
      .toArray();
    // 로그인한 유저라면 fireList제거, isFired와 isBookmarked에 유저 데이터 반영
    if (userId) {
      const { bookmarkList } = await db
        .collection("auth")
        .findOne({ id: userId });
      const cardDataEditor = (card) => {
        const { userData, contentData } = card;
        const { fireUserList, ...nextContentData } = contentData;
        nextContentData.isFired = fireUserList.includes(userId);
        nextContentData.isBookMarked = bookmarkList.includes(contentData.id);
        const nextCardData = {
          userData,
          contentData: nextContentData,
        };
        return nextCardData;
      };

      cardListData = cardListData.map((card) => cardDataEditor(card));
    }

    // 로그인 하지 않은 유저라면 fireUserList제거, isFired와 isBookmark를 false로 반영
    if (!userId) {
      cardListData = cardListData.map((card) => {
        const { userData, contentData } = card;
        const { fireUserList, ...nextContentData } = contentData;
        nextContentData.isFired = false;
        nextContentData.isBookmarked = false;
        const nextCardData = {
          userData,
          contentData: nextContentData,
        };
        return nextCardData;
      });
    }
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

// 카드 fire
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

// 카드 bookmark
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

// 카드 delete
router.delete("/delete", async (req, res) => {
  try {
    // cardId, userId 인증
    const { cardId } = req.body;
    const { authorization: token } = req.headers;
    const { id: userId } = jwt.verify(token, JWT_SECRET_KEY);
    if (!userId) {
      res.status(401).json({ success: false, reason: "unvalid token" });
      return;
    }

    // 카드 데이터 삭제
    const { db } = req.app;
    db.collection("quoteCard").deleteOne({ "contentData.id": cardId });
    // 카드 삭제 관련 유저 데이터 수정
    db.collection("auth").updateOne(
      { id: userId },
      { $pull: { quoteList: cardId }, $inc: { quoteCount: -1 } }
    );

    // 클라이언트로 결과 전송
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, reason: err });
  }
});

module.exports = router;
