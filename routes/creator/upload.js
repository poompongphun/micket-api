const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const verifyCreator = require("../../Middleware/verifyCreator");
const path = require("path");
const sharp = require("sharp");

// Model
const movieGroup = require("../../model/movieGroup");
const movie = require("../../model/movie");

//Multer Setup
const multer = require("multer");
const uploadImg = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
  },
  fileFilter: function (_req, file, cb) {
    checkImagesType(file, cb);
  },
});
const uploadPoster = uploadImg.single("poster");
const uploadThumbnail = uploadImg.single("thumbnail");

// Setup Firebase
const { firebaseApp } = require("../../firebaseConfig");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

/* Upload Poster Images. */
router.post("/poster/:id/:type", verifyCreator, async (req, res) => {
  const type = req.params.type;
  if (type === "x" || type === "y") {
    const isX = type === "x";
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
            const width = isX ? 768 : 486;
            const height = isX ? 432 : 720;
            const file = req.file.buffer;
            const sharpOption = {
              quality: 25,
              chromaSubsampling: "4:4:4",
            };
            const img = await sharp(file)
              .resize(width, height)
              .webp(sharpOption)
              .toBuffer();

            const folder = "movie";
            const id = response._id;
            const fileName = `${Date.now()}.webp`;
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

            blobStream.on("finish", async () => {
              const url = fileUpload.publicUrl();
              const posterSend = isX
                ? { "poster.x": url }
                : { "poster.y": url };

              try {
                const updateResponse = await movieGroup.findByIdAndUpdate(
                  response._id,
                  { $set: posterSend },
                  {
                    new: true,
                  }
                );

                if (updateResponse) {
                  const oldUrl = isX ? response.poster.x : response.poster.y;
                  if (oldUrl !== "") {
                    const web =
                      "https://storage.googleapis.com/micket-d452e.appspot.com/";
                    const removePath = oldUrl.replace(web, "");
                    const removeFile = bucket.file(removePath);
                    removeFile
                      .delete()
                      .then(() => {
                        res.json(updateResponse);
                      })
                      .catch((error) => res.status(500).send(error));
                  } else res.json(updateResponse);
                }
              } catch (error) {
                res.status(500).send(error);
              }
            });
            blobStream.end(img);
          }
        });
      } else {
        res.status(400).send("not found");
      }
    } catch (error) {
      res.status(400).send("not found");
    }
  } else {
    res.status(400).send("not found");
  }
});

//upload video thumbnail by movie id
router.post("/thumbnail/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movie.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (response) {
      uploadThumbnail(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(405).json({ error });
        } else if (error) {
          // An unknown error occurred when uploading.
          res.status(405).json({ error });
        } else {
          const width = 768;
          const height = 432;
          const file = req.file.buffer;
          const sharpOption = {
            quality: 20,
            chromaSubsampling: "4:4:4",
          };
          const img = await sharp(file)
            .resize(width, height)
            .webp(sharpOption)
            .toBuffer();

          const folder = "movie";
          const groupId = response.group_id;
          const seasonId = response.season_id;
          const fileName = `${Date.now()}.webp`;
          const path = `${folder}/${groupId}/vdo/${seasonId}/thumbnail/${fileName}`;
          const fileUpload = bucket.file(path);
          const blobStream = fileUpload.createWriteStream({
            metadata: {
              contentType: "image/webp",
            },
          });

          blobStream.on("error", (error) => {
            res.status(405).json(error);
          });

          blobStream.on("finish", async () => {
            const url = fileUpload.publicUrl();
            const posterSend = { "media.thumbnail": url };

            try {
              const updateResponse = await movie.findByIdAndUpdate(
                response._id,
                { $set: posterSend },
                {
                  new: true,
                }
              );

              if (updateResponse) {
                const oldUrl = response.media.thumbnail;
                if (oldUrl !== "") {
                  const web =
                    "https://storage.googleapis.com/micket-d452e.appspot.com/";
                  const removePath = oldUrl.replace(web, "");
                  const removeFile = bucket.file(removePath);
                  removeFile
                    .delete()
                    .then(() => {
                      res.json(updateResponse);
                    })
                    .catch((error) => res.status(500).send(error));
                } else res.json(updateResponse);
              }
            } catch (error) {
              res.status(500).send(error);
            }
          });

          blobStream.end(img);
        }
      });
    } else res.status(400).send("not found");
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
