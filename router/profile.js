require("dotenv/config");
const express = require("express");
const router = express.Router();

router.get("/userQuoteList", async (req, res) => {
  try {
    const { db } = req.app;
    const { id, page } = req.query;
    const user = await db.collection("auth").findOne({ id });
    const { quoteList: quoteIdList, bookmarkList } = user;

    const curQuoteIdList = quoteIdList.slice((Number(page) - 1) * 10, 30);

    const quoteDBList = await Promise.all(
      curQuoteIdList.map((quoteId) => {
        const quote = db
          .collection("quoteCard")
          .findOne({ "contentData.id": quoteId });
        return quote;
      })
    );

    const quoteList = quoteDBList.map((quote) => {
      const { userData, contentData } = quote;
      const { fireUserList, ...nextContentData } = contentData;
      nextContentData.isFired = fireUserList.includes(userData.id);
      nextContentData.isBookMarked = bookmarkList.includes(contentData.id);
      const nextQuote = {
        userData,
        contentData: nextContentData,
      };
      return nextQuote;
    });

    res.json({
      success: true,
      data: {
        quoteList,
      },
    });
  } catch (err) {
    console.log("error from profile/userQuoteList", err);
    res.status(500).json({
      success: false,
      reason: "server error from /profile/userQuoteList",
    });
  }
});

router.get("/userBookmarkList", async (req, res) => {
  try {
    const { db } = req.app;
    const { id, page } = req.query;
    const { bookmarkList: bookmarkIdList } = await db
      .collection("auth")
      .findOne({ id });

    const curQuoteIdList = bookmarkIdList.slice((Number(page) - 1) * 10, 30);

    const bookmarkDBList = await Promise.all(
      curQuoteIdList.map((bookmarkId) => {
        const bookmark = db
          .collection("quoteCard")
          .findOne({ "contentData.id": bookmarkId });
        return bookmark;
      })
    );
    const bookmarkList = bookmarkDBList.map((bookmark) => {
      const { userData, contentData } = bookmark;
      const { fireUserList, ...nextContentData } = contentData;
      nextContentData.isBookMarked = true;
      nextContentData.isFired = fireUserList.includes(userData.id);
      const nextBookmark = {
        userData,
        contentData: nextContentData,
      };
      return nextBookmark;
    });

    res.json({
      success: true,
      data: {
        bookmarkList,
      },
    });
  } catch (err) {
    console.log("error from profile/userBookmarkList", err);
    res.status(500).json({
      success: false,
      reason: "server error from /profile/userBookmarkList",
    });
  }
});

router.get("/:id", async (req, res) => {
  const { db } = req.app;
  const { id } = req.params;
  const userDBData = await db
    .collection("auth")
    .findOne({ id })
    .catch(() =>
      res.status(500).json({ success: false, reason: "DB 서버 에러" })
    );

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
