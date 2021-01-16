const express = require("express");
const router = express.Router();
const verifyCreator = require("../../Middleware/verifyCreator");
const path = require("path");

const { movieValidation } = require("../../validation");

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
const users = require("../../model/users");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

router.get("/group/:group_id", verifyCreator, async (req, res) => {
  try {
    const response = await movieSeason
      .find({
        group_id: req.params.group_id,
        user_id: req.user._id,
      })
      .populate("movie");
    res.json(response);
  } catch (error) {
    res.status(400).send(error);
  }
});

/* Upload movie by group id and season id. */
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
                fileName: fileName,
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

// Delete by movie id
router.delete("/:id", verifyCreator, async (req, res) => {
  try {
    const responseMovie = await movie.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (responseMovie) {
      const folder = "movie";
      const fileName = responseMovie.media.fileName;
      const path = `${folder}/${responseMovie.group_id}/vdo/${responseMovie.season_id}/${fileName}`;
      const fileUpload = bucket.file(path);
      fileUpload.delete().then(async () => {
        const deleteInSeason = await movieSeason.findByIdAndUpdate(
          responseMovie.season_id,
          { $pull: { movie: responseMovie._id } },
          { safe: true, upsert: true }
        );
        await updateGroupPrice(responseMovie.group_id);
        res.send("deleted");
      });
    } else res.status(400).send("not found movie");
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Movie by id
router.get("/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movie.findById(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update movie by movie id
router.patch("/:id", verifyCreator, async (req, res) => {
  const validation = movieValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    try {
      const movieResponse = await movie.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        validation.value,
        {
          new: true,
        }
      );

      await updateGroupPrice(movieResponse.group_id);

      res.send(movieResponse);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

router.get("/:id/users", verifyCreator, async (req, res) => {
  try {
    const responseOwnedUsers = await movie
      .findById(req.params.id)
      .populate({ path: "purchase_user", select: "name" })
      .select("purchase_user");
    res.json(responseOwnedUsers);
  } catch (error) {
    res.status(400).send(error);
  }
});

// delete owned user
router.delete("/:id/users/:user", verifyCreator, async (req, res) => {
  try {
    const responseOwnedUsers = await movie
      .findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        {
          $pull: { purchase_user: req.params.user },
        },
        { new: true }
      )
      .populate({ path: "purchase_user", select: "name" })
      .select("purchase_user group_id");

    // Check if no more movie then remove groupid from user library
    const checkUserMovie = await movie.find({
      purchase_user: { $all: req.params.user },
      group_id: responseOwnedUsers.group_id,
    });
    if (checkUserMovie.length === 0) {
      await users.findByIdAndUpdate(req.params.user, {
        $pull: { library: responseOwnedUsers.group_id },
      });
    }
    
    res.json(responseOwnedUsers);
  } catch (error) {
    res.status(400).send(error);
  }
});

async function updateGroupPrice(groupId) {
  try {
    const findPrice = await movie
      .find({
        group_id: groupId,
        public: true,
      })
      .select("price");
    let initialValue = 0;
    const sumPrice = findPrice.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.price;
    }, initialValue);
    const updatePrice = await movieGroup.findByIdAndUpdate(
      groupId,
      { price: sumPrice.toFixed(2) },
      {
        new: true,
      }
    );
    if (!updatePrice) return false;
  } catch (error) {
    console.log(error);
  }
}

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
