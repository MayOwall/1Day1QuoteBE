// AWS S3 이미지 업로드 후 콜백 핸들러
const uploadImage = async (req, res) => {
  if (req.file) {
    const json = {
      result: "success",
      data: {
        imageURL: req.file.location,
      },
    };
    res.status(200).json(json);
  } else {
    const json = {
      result: "error",
    };
    res.status(200).json(json);
  }
};

module.exports = { uploadImage };
