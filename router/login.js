require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

// 로그인 POST 핸들러
router.post("/", async (req, res) => {
  try {
    const { userId, userName, userImageURL } = req.body;
    const { db } = req.app;
    const userData = await db
      .collection("auth")
      .findOne({ userId })
      .catch(() =>
        res
          .status(500)
          .json({ success: false, reason: "DB 로그인 APi 도중 에러" })
      );
    console.log("userData", userData);
    // 아이디가 존재하지 않을 때
    if (!userData) {
      // 새로운 회원 만들기
      const newAccount = {
        userId,
        userName,
        userImageURL,
        userIntroduce: "",
        userQuoteCount: 0,
        userQuoteList: [],
        userBookmarkCount: 0,
        userBookmarkList: [],
      };

      db.collection("auth").insertOne(newAccount);

      const token = jwt.sign({ userId: userId }, JWT_SECRET_KEY, {
        expiresIn: "1d",
      });

      res.status(200).json({
        success: true,
        isNewAccount: true,
        token,
        userData: { userId, userName, userImageURL },
      });
      return;
    }

    //성공여부 및 jwt 응답
    res.json({
      success: true,
      isNewAccount: false,
      token,
      userData: { userId, userName, userImageURL },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, reason: "로그인 서버 에러" });
  }
});

module.exports = router;
