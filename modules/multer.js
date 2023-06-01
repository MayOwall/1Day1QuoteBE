// multer config 설정 및 AWS S3 연동 관련 파일

const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
require("dotenv/config");
const { AWS_S3_ACCESS_ID, AWS_S3_ACCESS_KEY } = process.env;

aws.config.update({
  accessKeyId: AWS_S3_ACCESS_ID,
  secretAccessKey: AWS_S3_ACCESS_KEY,
  region: "ap-northeast-2",
});

const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "bookstack-images",
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
