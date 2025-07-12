import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const { originalname } = file;

    const dotIndex = originalname.lastIndexOf(".");

    const fileName = originalname.substring(0, dotIndex);
    const fileFormat = originalname.substring(dotIndex);

    const uniqueSuffix =
      Date.now() +
      "-" +
      Math.round(Math.random() * Number(process.env.MULTER_FILE_NAME_RANGE));

    cb(null, fileName + "-" + uniqueSuffix + fileFormat);
  },
});

const multerOptions = {
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};

const upload = multer(multerOptions);

export default upload;
