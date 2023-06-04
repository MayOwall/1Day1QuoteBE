require("dotenv/config");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// 로그인 POST 핸들러
router.post("/", async (req, res) => {
  try {
    const { id, name, imageURL } = req.body;
    const { db } = req.app;
    const token = jwt.sign({ id }, JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    const userDBData = await db
      .collection("auth")
      .findOne({ id })
      .catch((e) => res.status(500).json({ success: false, reason: e }));

    // 유저 정보 존재하지 않을 때 : 새 유저 정보 생성
    if (!userDBData) {
      const newUserDBData = {
        id,
        name,
        imageURL,
        introduce: "",
        quoteCount: 0,
        quoteList: [],
        bookmarkCount: 0,
        bookmarkList: [],
      };

      await db.collection("auth").insertOne(newUserDBData);

      res.status(200).json({
        success: true,
        isNewAccount: true,
        userData: {
          authToken: token,
          id,
          name,
          imageURL,
          introduce: "",
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
          id: userDBData.id,
          name: userDBData.name,
          imageURL: userDBData.imageURL,
          introduce: userDBData.introduce,
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
