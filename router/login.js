require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// 로그인 POST 핸들러
router.post("/", async (req, res) => {
  try {
    const { userId, userName, userImageURL } = req.body;
    const { db } = req.app;
    const token = jwt.sign({ userId: userId }, JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    const userDBData = await db
      .collection("auth")
      .findOne({ userId })
      .catch((e) => res.status(500).json({ success: false, reason: e }));

    // 유저 정보 존재하지 않을 때 : 새 유저 정보 생성
    if (!userDBData) {
      const newUserDBData = {
        userId,
        userName,
        userImageURL,
        userIntroduce: "",
        userQuoteCount: 0,
        userQuoteList: [],
        userBookmarkCount: 0,
        userBookmarkList: [],
      };

      await db.collection("auth").insertOne(newUserDBData);

      res.status(200).json({
        success: true,
        isNewAccount: true,
        userData: {
          authToken: token,
          userId,
          userName,
          userImageURL,
          userIntroduce: "",
        },
      });
      return;
    }

    // 유저 데이터가 존재할 때 : 기존 유저 정보 제공
    if (!!userDBData) {
      res.json({
        success: true,
        isNewAccount: false,
        userData: {
          authToken: token,
          userId: userDBData.userId,
          userName: userDBData.userName,
          userImageURL: userDBData.userImageURL,
          userIntroduce: userDBData.userIntroduce,
        },
      });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, reason: err });
  }
});

module.exports = router;
