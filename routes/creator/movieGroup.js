const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const verifyCreator = require("../../Middleware/verifyCreator");
const sharp = require("sharp");
const fs = require("fs");
const {
  movieGroupValidation,
  editMovieGroupValidation,
} = require("../../validation");

// Model
const movieGroup = require("../../model/movieGroup");

// Firebase Setup
const { firebaseApp } = require("../../firebaseConfig");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

// Get movie group
router.get("/", verifyCreator, async (req, res) => {
  const response = await movieGroup.find({ user_id: req.user._id });
  res.json(response);
});

/* Create movie group. */
router.post("/create", verifyCreator, async (req, res) => {
  const validation = movieGroupValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    const movie = new movieGroup({
      user_id: req.user._id,
      title: validation.value.title,
      description: validation.value.description,
    });
    try {
      const createUser = await movie.save();
      res.status(200).send(createUser);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

// Update Movie group
router.patch("/:id", verifyCreator, async (req, res) => {
  const validation = editMovieGroupValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    try {
      const movie = await movieGroup.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        validation.value,
        {
          new: true,
        }
      );
      res.json(movie);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

// Delete Movie Group
router.delete("/:id", verifyCreator, async (req, res) => {
  try {
    const response = await movieGroup.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (response) {
      const folder = "movie";
      const id = response._id;
      console.log(id);
      const path = `${folder}/${id}/`;
      bucket.deleteFiles(
        {
          prefix: path,
        },
        (error) => {
          if (!error) {
            // All files in the `images` directory have been deleted.
            res.json({ message: "Deleted" });
          }
          res.json(error);
        }
      );
    } else res.status(400).json({ message: "Not Found" });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Poster with ?size
router.get("/poster/:id/:type", async (req, res) => {
  if (req.params.type === "x" || req.params.type === "y") {
    const folder = "movie";
    const id = req.params.id;
    const fileName = req.params.type === "x" ? "posterX.webp" : "posterY.webp";
    const path = `${folder}/${id}/poster/${fileName}`;
    const fileUpload = bucket.file(path);
    res.send({ img: fileUpload.publicUrl() + "?" + Math.random() });
    // fileUpload
    //   .download()
    //   .then(async (img) => {
    //     const size =
    //       req.query.size === "xs"
    //         ? 0.1
    //         : req.query.size === "sm"
    //         ? 0.3
    //         : req.query.size === "md"
    //         ? 0.5
    //         : req.query.size === "xl"
    //         ? 0.7
    //         : 1;
    //     const image = await sharp(img[0])
    //       .metadata()
    //       .then(({ width }) =>
    //         sharp(img[0])
    //           .resize(Math.round(width * size))
    //           .webp()
    //           .toBuffer()
    //       );
    //     res.writeHead(200, { "Content-Type": "image/webp" });
    //     res.end(image, "binary");
    //   })
    //   .catch((error) => {
    //     const image = fs.readFileSync("public/images/Micket.svg");
    //     res.writeHead(200, { "Content-Type": "image/svg+xml" });
    //     res.end(image, "binary");
    //   });
  } else {
    res.status(400).send("not found");
  }
});

module.exports = router;
