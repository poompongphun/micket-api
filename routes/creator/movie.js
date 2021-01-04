const express = require("express");
const router = express.Router();
const verifyCreator = require("../../Middleware/verifyCreator");
const path = require("path");

// Model
const movie = require("../../model/movie");
const movieGroup = require("../../model/movieGroup");
const movieSeason = require("../../model/movieSeason");

//Multer
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
  },
  fileFilter: function (_req, file, cb) {
    checkFileType(file, cb);
  },
});
const uploadMovie = upload.single("movie");

// Setup Firebase
const { firebaseApp } = require("../../firebaseConfig");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

router.get("/:group_id", verifyCreator, async (req, res) => {
  const response = await movieSeason
    .find({
      group_id: req.params.group_id,
      user_id: req.user._id,
    })
    .populate("movie");
  res.json(response);
});

/* Upload movie. */
router.post("/:id/:season", verifyCreator, async (req, res) => {
  try {
    const responseGroup = await movieGroup.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    const responseSeason = await movieSeason.findOne({
      _id: req.params.season,
      user_id: req.user._id,
    });
    if (responseGroup && responseSeason) {
      uploadMovie(req, res, function (error) {
        if (error instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(405).json({ error });
        } else if (error) {
          // An unknown error occurred when uploading.
          res.status(405).json({ error });
        } else {
          const folder = "movie";
          const fileName = `${Date.now()}.webm`;
          const path = `${folder}/${responseGroup._id}/vdo/${responseSeason._id}/${fileName}`;
          const fileUpload = bucket.file(path);
          const blobStream = fileUpload.createWriteStream({
            metadata: {
              contentType: "video/webm",
            },
          });

          blobStream.on("error", (error) => {
            res.status(405).json(error);
          });

          blobStream.on("finish", async () => {
            const url = fileUpload.publicUrl();
            const sendMovie = {
              user_id: req.user._id,
              group_id: responseGroup._id,
              season_id: responseSeason._id,
              name: req.file.originalname,
              price: 0,
              media: {
                thumbnail: "",
                video: url,
              },
              public: false,
            };

            try {
              const movieNew = new movie(sendMovie);
              const createUser = await movieNew.save();
              // Add movie id to Group
              await movieSeason.findByIdAndUpdate(
                responseSeason._id,
                { $push: { movie: createUser._id } },
                {
                  new: true,
                }
              );
              res.status(200).send(createUser);
            } catch (error) {
              fileUpload.delete().then(function (data) {
                res.status(400).send(error);
              });
            }
          });

          try {
            // Upload Files
            blobStream.end(req.file.buffer);
          } catch (error) {
            res.status(405).json({ error: "file can't be empty" });
          }
        }
      });
    } else res.status(400).send("not found group or season");
  } catch (error) {
    res.status(400).send("not found group");
  }
});

function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /mkv|mp4|mov|avi|webm/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb("Allow mp4|mov|avi|webm|mkv Only!");
  }
}

module.exports = router;
