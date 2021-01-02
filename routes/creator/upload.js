const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const verifyCreator = require("../../Middleware/verifyCreator");
const path = require("path");
const sharp = require("sharp");

// Model
const movieGroup = require("../../model/movieGroup");

//Multer Setup
const multer = require("multer");
const uploadImg = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 2,
  },
  fileFilter: function (_req, file, cb) {
    checkImagesType(file, cb);
  },
});
const uploadPoster = uploadImg.single("poster");

// Setup Firebase
const { firebaseApp } = require("../../firebaseConfig");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

/* Update Horizon Poster. */
router.post("/posterX/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movieGroup.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (response) {
      uploadPoster(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(405).json({ error });
        } else if (error) {
          // An unknown error occurred when uploading.
          res.status(405).json({ error });
        } else {
          const img = await sharp(req.file.buffer)
            .resize(720, 480)
            .webp({
              quality: 20,
              chromaSubsampling: "4:4:4",
            })
            .toBuffer();
          const folder = "movie";
          const id = response._id;
          const fileName = `posterX.webp`;
          const path = `${folder}/${id}/poster/${fileName}`;
          const fileUpload = bucket.file(path);
          const blobStream = fileUpload.createWriteStream({
            metadata: {
              contentType: "image/webp",
            },
          });
          blobStream.on("error", (error) => {
            res.status(405).json(error);
          });
          blobStream.on("finish", () => {
            res.send({ img: fileUpload.publicUrl() + "?" + Math.random() });
            // fileUpload.download().then((img) => {
            //   res.writeHead(200, { "Content-Type": "image/webp" });
            //   res.end(img[0], "binary");
            // });
          });
          blobStream.end(img);
        }
      });
    }
  } catch (error) {
    res.status(400).send("not found");
  }
});

// Update Vertical Poster
router.post("/posterY/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movieGroup.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (response) {
      uploadPoster(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(405).json({ error });
        } else if (error) {
          // An unknown error occurred when uploading.
          res.status(405).json({ error });
        } else {
          const img = await sharp(req.file.buffer)
            .resize(486, 720)
            .webp({
              quality: 20,
              chromaSubsampling: "4:4:4",
            })
            .toBuffer();
          const folder = "movie";
          const id = response._id;
          const fileName = `posterY.webp`;
          const path = `${folder}/${id}/poster/${fileName}`;
          const fileUpload = bucket.file(path);
          const blobStream = fileUpload.createWriteStream({
            metadata: {
              contentType: "image/webp",
            },
          });
          blobStream.on("error", (error) => {
            res.status(405).json(error);
          });
          blobStream.on("finish", () => {
            res.send({ img: fileUpload.publicUrl() + "?" + Math.random() });
            // fileUpload.download().then((img) => {
            //   res.writeHead(200, { "Content-Type": "image/webp" });
            //   res.end(img[0], "binary");
            // });
          });
          blobStream.end(img);
        }
      });
    }
  } catch (error) {
    res.status(400).send("not found");
  }
});

function checkImagesType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|tiff|gif|bmp|webp/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb("Allow jpeg,jpg,png,tiff,gif,bmp,webp Only!");
  }
}

module.exports = router;
