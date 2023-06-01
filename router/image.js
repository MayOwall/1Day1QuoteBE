const express = require("express");
const router = express.Router();
const upload = require("../modules/multer");
const { uploadImage } = require("../controller/image");

// AWS S3 이미지 업로드 핸들러
router.post("/upload", upload.single("image"), uploadImage);

module.exports = router;
